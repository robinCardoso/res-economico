import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BravoProduto } from '../client/bravo-erp-client.interface';

/**
 * Serviço responsável por transformar produtos do Bravo ERP
 * para o formato interno usando mapeamento configurado
 */
@Injectable()
export class ProductTransformService {
  private readonly logger = new Logger(ProductTransformService.name);
  private mapeamentoCache: Map<string, any> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca mapeamento de campos do banco de dados (com cache)
   */
  private async buscarMapeamentoCampos(): Promise<Map<string, any>> {
    const now = Date.now();

    // Usar cache se ainda válido
    if (
      this.mapeamentoCache &&
      now - this.cacheTimestamp < this.CACHE_TTL
    ) {
      return this.mapeamentoCache;
    }

    try {
      const mapeamentos = await this.prisma.bravoCampoMapeamento.findMany({
        where: {
          ativo: true,
        },
        orderBy: {
          ordem: 'asc',
        },
      });

      const mapeamentoMap = new Map();
      mapeamentos.forEach((map) => {
        mapeamentoMap.set(map.campo_bravo, map);
      });

      this.mapeamentoCache = mapeamentoMap;
      this.cacheTimestamp = now;

      return mapeamentoMap;
    } catch (error) {
      this.logger.error('❌ Erro ao buscar mapeamento de campos:', error);
      return new Map();
    }
  }

  /**
   * Obtém valor de campo aninhado (ex: _ref.marca.titulo)
   */
  /**
   * Obtém valor de campo aninhado com suporte a caminhos genéricos
   * Ex: _ref.unidade.abreviacao será resolvido usando id_unidade_padrao_venda
   */
  private obterValorCampo(objeto: any, caminho: string): any {
    // Tratamento especial para campos _ref que precisam buscar pelo ID correto
    // Isso permite usar caminhos genéricos sem números fixos
    
    // _ref.marca.*
    if (caminho.startsWith('_ref.marca.') && objeto.id_marca) {
      const campo = caminho.replace('_ref.marca.', '');
      return objeto._ref?.marca?.[objeto.id_marca]?.[campo] || null;
    }
    
    // _ref.categoria.*
    if (caminho.startsWith('_ref.categoria.') && objeto.id_produto_categoria) {
      const campo = caminho.replace('_ref.categoria.', '');
      return objeto._ref?.categoria?.[objeto.id_produto_categoria]?.[campo] || null;
    }
    
    // _ref.unidade.* (usando id_unidade_padrao_venda)
    if (caminho.startsWith('_ref.unidade.') && objeto.id_unidade_padrao_venda) {
      const campo = caminho.replace('_ref.unidade.', '');
      return objeto._ref?.unidade?.[objeto.id_unidade_padrao_venda]?.[campo] || null;
    }
    
    // gtin.* (gtin é um objeto indexado por ID, pegar primeiro)
    if (caminho.startsWith('gtin.')) {
      const campo = caminho.replace('gtin.', '');
      if (Array.isArray(objeto.gtin)) {
        if (objeto.gtin.length > 0) {
          return objeto.gtin[0]?.[campo] || null;
        }
        return null;
      }
      if (typeof objeto.gtin === 'object' && objeto.gtin !== null) {
        const gtinKeys = Object.keys(objeto.gtin);
        if (gtinKeys.length > 0) {
          return objeto.gtin[gtinKeys[0]]?.[campo] || null;
        }
      }
      return null;
    }
    
    // Para outros campos, usar acesso direto padrão
    return caminho.split('.').reduce((obj, key) => {
      if (obj && typeof obj === 'object') {
        return obj[key];
      }
      return undefined;
    }, objeto);
  }

  /**
   * Obtém título da marca usando ID
   */
  private obterTituloMarca(produto: any, idMarca: string): string | null {
    if (!produto._ref?.marca || !idMarca) return null;
    const marcaData = produto._ref.marca[idMarca];
    return marcaData?.titulo || null;
  }

  /**
   * Obtém título da categoria usando ID
   */
  private obterTituloCategoria(
    produto: any,
    idCategoria: string,
  ): string | null {
    if (!produto._ref?.categoria || !idCategoria) return null;
    const categoriaData = produto._ref.categoria[idCategoria];
    return categoriaData?.titulo || null;
  }

  /**
   * Obtém GTIN do produto
   */
  private obterGtin(produto: any): string | null {
    if (!produto.gtin) return null;

    if (Array.isArray(produto.gtin)) {
      if (produto.gtin.length === 0) return null;
      const primeiroGtin = produto.gtin[0];
      return primeiroGtin?.gtin || primeiroGtin || null;
    }

    if (typeof produto.gtin === 'object') {
      const gtinKeys = Object.keys(produto.gtin);
      if (gtinKeys.length > 0) {
        const primeiroGtin = produto.gtin[gtinKeys[0]];
        return primeiroGtin?.gtin || primeiroGtin || null;
      }
    }

    return produto.gtin || null;
  }

  /**
   * Transforma produto do Bravo ERP para formato interno
   */
  async transformarProduto(produtoBravo: BravoProduto): Promise<any> {
    const mapeamentoMap = await this.buscarMapeamentoCampos();

    const resultado: any = {
      updatedAt: new Date(),
    };

    const metadata: any = {};

    // Aplicar cada mapeamento configurado
    mapeamentoMap.forEach((mapeamento, campoBravo) => {
      let valorBravo = this.obterValorCampo(produtoBravo, campoBravo);

      // Tratamentos especiais para campos específicos
      if (campoBravo === '_ref.marca.titulo' && produtoBravo.marca_id) {
        valorBravo = this.obterTituloMarca(produtoBravo, produtoBravo.marca_id);
      } else if (
        campoBravo === 'id_produto_categoria' &&
        produtoBravo.categoria_id
      ) {
        valorBravo = this.obterTituloCategoria(
          produtoBravo,
          produtoBravo.categoria_id,
        );
      } else if (campoBravo === 'gtin.gtin') {
        valorBravo = this.obterGtin(produtoBravo);
      }

      if (mapeamento.tipo_transformacao === 'direto') {
        // Mapeamento direto
        resultado[mapeamento.campo_interno] = valorBravo || null;
      } else if (mapeamento.tipo_transformacao === 'boolean_invertido') {
        // Transformação booleana invertida (excluido = 'N' → ativo = true)
        resultado[mapeamento.campo_interno] = valorBravo === 'N';
      } else if (mapeamento.tipo_transformacao === 'json') {
        // Campo vai para metadata
        if (valorBravo !== null && valorBravo !== undefined) {
          const campoMeta = mapeamento.campo_interno.replace('metadata->', '');
          metadata[campoMeta] = valorBravo;
        }
      }
    });

    // Garantir campos essenciais
    if (!resultado.referencia) {
      resultado.referencia = produtoBravo.referencia || produtoBravo.ref || null;
    }

    if (!resultado.id_prod) {
      resultado.id_prod =
        produtoBravo.id_produto || produtoBravo.product_id || null;
    }

    // Adicionar data de modificação se disponível
    if (produtoBravo._data_ult_modif) {
      resultado.dataUltModif = new Date(produtoBravo._data_ult_modif);
    } else if (produtoBravo.dataUltModif) {
      resultado.dataUltModif = new Date(produtoBravo.dataUltModif);
    }

    // Adicionar metadata se houver campos
    if (Object.keys(metadata).length > 0) {
      resultado.metadata = metadata;
    }

    return resultado;
  }

  /**
   * Limpa cache de mapeamento (útil após salvar novos mapeamentos)
   */
  clearCache(): void {
    this.mapeamentoCache = null;
    this.cacheTimestamp = 0;
  }
}
