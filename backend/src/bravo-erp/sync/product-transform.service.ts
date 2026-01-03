import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { BravoProduto } from '../client/bravo-erp-client.interface';

/**
 * Serviço responsável por transformar produtos do Bravo ERP
 * para o formato interno usando mapeamento configurado
 */
@Injectable()
export class ProductTransformService {
  private readonly logger = new Logger(ProductTransformService.name);
  private mapeamentoCache: Map<
    string,
    {
      campo_interno: string;
      tipo_transformacao: string;
      campo_bravo: string;
      ativo: boolean;
    }
  > | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca mapeamento de campos do banco de dados (com cache)
   */
  private async buscarMapeamentoCampos(): Promise<
    Map<
      string,
      {
        campo_interno: string;
        tipo_transformacao: string;
        campo_bravo: string;
        ativo: boolean;
      }
    >
  > {
    const now = Date.now();

    // Usar cache se ainda válido
    if (this.mapeamentoCache && now - this.cacheTimestamp < this.CACHE_TTL) {
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
  private obterValorCampo(
    objeto: Record<string, unknown>,
    caminho: string,
  ): unknown {
    // Tratamento especial para campos _ref que precisam buscar pelo ID correto
    // Isso permite usar caminhos genéricos sem números fixos

    const objRef = objeto._ref as
      | {
          marca?: Record<string, Record<string, unknown>>;
          categoria?: Record<string, Record<string, unknown>>;
          unidade?: Record<string, Record<string, unknown>>;
        }
      | undefined;
    const idMarca = objeto.id_marca as string | undefined;
    const idCategoria = objeto.id_produto_categoria as string | undefined;
    const idUnidade = objeto.id_unidade_padrao_venda as string | undefined;

    // _ref.marca.*
    if (caminho.startsWith('_ref.marca.') && idMarca && objRef?.marca) {
      const campo = caminho.replace('_ref.marca.', '');
      const marcaObj = objRef.marca[idMarca];
      return marcaObj?.[campo] ?? null;
    }

    // _ref.categoria.*
    if (
      caminho.startsWith('_ref.categoria.') &&
      idCategoria &&
      objRef?.categoria
    ) {
      const campo = caminho.replace('_ref.categoria.', '');
      const categoriaObj = objRef.categoria[idCategoria];
      return categoriaObj?.[campo] ?? null;
    }

    // _ref.unidade.* (usando id_unidade_padrao_venda)
    if (caminho.startsWith('_ref.unidade.') && idUnidade && objRef?.unidade) {
      const campo = caminho.replace('_ref.unidade.', '');
      const unidadeObj = objRef.unidade[idUnidade];
      return unidadeObj?.[campo] ?? null;
    }

    // gtin.* (gtin é um objeto indexado por ID, pegar primeiro)
    const gtinValue = objeto.gtin;
    if (caminho.startsWith('gtin.')) {
      const campo = caminho.replace('gtin.', '');
      if (Array.isArray(gtinValue)) {
        if (gtinValue.length > 0) {
          const primeiroItem = gtinValue[0] as Record<string, unknown>;
          return primeiroItem?.[campo] ?? null;
        }
        return null;
      }
      if (typeof gtinValue === 'object' && gtinValue !== null) {
        const gtinKeys = Object.keys(gtinValue);
        if (gtinKeys.length > 0) {
          const primeiroItem = (gtinValue as Record<string, unknown>)[
            gtinKeys[0]
          ] as Record<string, unknown>;
          return primeiroItem?.[campo] ?? null;
        }
      }
      return null;
    }

    // Para outros campos, usar acesso direto padrão
    return caminho.split('.').reduce((obj, key) => {
      if (
        obj &&
        typeof obj === 'object' &&
        obj !== null &&
        !Array.isArray(obj)
      ) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, objeto as unknown);
  }

  /**
   * Obtém título da marca usando ID
   */
  private obterTituloMarca(
    produto: Record<string, unknown>,
    idMarca: string,
  ): string | null {
    const objRef = produto._ref as
      | { marca?: Record<string, { titulo?: unknown }> }
      | undefined;
    if (!objRef?.marca || !idMarca) return null;
    const marcaData = objRef.marca[idMarca] as { titulo?: unknown } | undefined;
    return (marcaData?.titulo as string) ?? null;
  }

  /**
   * Obtém título da categoria usando ID
   */
  private obterTituloCategoria(
    produto: Record<string, unknown>,
    idCategoria: string,
  ): string | null {
    const objRef = produto._ref as
      | { categoria?: Record<string, { titulo?: unknown }> }
      | undefined;
    if (!objRef?.categoria || !idCategoria) return null;
    const categoriaData = objRef.categoria[idCategoria] as
      | { titulo?: unknown }
      | undefined;
    return (categoriaData?.titulo as string) ?? null;
  }

  /**
   * Obtém GTIN do produto
   */
  private obterGtin(produto: Record<string, unknown>): string | null {
    const gtinValue = produto.gtin;
    if (!gtinValue) return null;

    if (Array.isArray(gtinValue)) {
      if (gtinValue.length === 0) return null;
      const primeiroGtin = gtinValue[0] as { gtin?: unknown };
      if (
        typeof primeiroGtin === 'object' &&
        primeiroGtin !== null &&
        'gtin' in primeiroGtin
      ) {
        return (primeiroGtin as { gtin: unknown }).gtin as string | null;
      }
      return primeiroGtin as string | null;
    }

    if (typeof gtinValue === 'object' && gtinValue !== null) {
      const gtinKeys = Object.keys(gtinValue);
      if (gtinKeys.length > 0) {
        const primeiroGtin = (gtinValue as Record<string, unknown>)[
          gtinKeys[0]
        ];
        if (
          typeof primeiroGtin === 'object' &&
          primeiroGtin !== null &&
          'gtin' in primeiroGtin
        ) {
          return (primeiroGtin as { gtin: unknown }).gtin as string | null;
        }
        return primeiroGtin as string | null;
      }
    }

    return gtinValue as string | null;
  }

  /**
   * Transforma produto do Bravo ERP para formato interno
   */
  async transformarProduto(
    produtoBravo: BravoProduto,
  ): Promise<Record<string, unknown>> {
    const mapeamentoMap = await this.buscarMapeamentoCampos();

    const resultado: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const metadata: Record<string, unknown> = {};

    // Aplicar cada mapeamento configurado
    mapeamentoMap.forEach((mapeamento, campoBravo) => {
      let valorBravo = this.obterValorCampo(
        produtoBravo as Record<string, unknown>,
        campoBravo,
      );

      // Tratamentos especiais para campos específicos
      if (campoBravo === '_ref.marca.titulo' && produtoBravo.marca_id) {
        valorBravo = this.obterTituloMarca(
          produtoBravo as Record<string, unknown>,
          produtoBravo.marca_id,
        );
      } else if (
        campoBravo === 'id_produto_categoria' &&
        produtoBravo.categoria_id
      ) {
        valorBravo = this.obterTituloCategoria(
          produtoBravo as Record<string, unknown>,
          produtoBravo.categoria_id,
        );
      } else if (campoBravo === 'gtin.gtin') {
        valorBravo = this.obterGtin(produtoBravo as Record<string, unknown>);
      }

      // Verificar se é campo metadata (sintaxe metadata->campo)
      const isMetadataField = mapeamento.campo_interno.startsWith('metadata->');

      if (isMetadataField) {
        // Campo vai para metadata (independente do tipo de transformação)
        if (valorBravo !== null && valorBravo !== undefined) {
          const campoMeta = mapeamento.campo_interno.replace('metadata->', '');

          // Aplicar transformação se necessário antes de salvar em metadata
          if (mapeamento.tipo_transformacao === 'boolean_invertido') {
            metadata[campoMeta] = valorBravo === 'N';
          } else if (mapeamento.tipo_transformacao === 'decimal') {
            let valorStr = '';
            if (typeof valorBravo === 'string') {
              valorStr = valorBravo;
            } else if (typeof valorBravo === 'number') {
              valorStr = String(valorBravo);
            } else if (typeof valorBravo === 'boolean') {
              valorStr = String(valorBravo);
            }
            metadata[campoMeta] = valorStr ? parseFloat(valorStr) : null;
          } else if (mapeamento.tipo_transformacao === 'datetime') {
            const dateValue =
              typeof valorBravo === 'string' || valorBravo instanceof Date
                ? new Date(valorBravo)
                : null;
            metadata[campoMeta] = dateValue;
          } else {
            metadata[campoMeta] = valorBravo;
          }
        }
      } else if (mapeamento.tipo_transformacao === 'direto') {
        // Mapeamento direto (campos normais)
        resultado[mapeamento.campo_interno] = valorBravo || null;
      } else if (mapeamento.tipo_transformacao === 'boolean_invertido') {
        // Transformação booleana invertida (excluido = 'N' → ativo = true)
        resultado[mapeamento.campo_interno] = valorBravo === 'N';
      } else if (mapeamento.tipo_transformacao === 'decimal') {
        let valorStr = '';
        if (typeof valorBravo === 'string') {
          valorStr = valorBravo;
        } else if (typeof valorBravo === 'number') {
          valorStr = String(valorBravo);
        } else if (typeof valorBravo === 'boolean') {
          valorStr = String(valorBravo);
        }
        resultado[mapeamento.campo_interno] = valorStr
          ? parseFloat(valorStr)
          : null;
      } else if (mapeamento.tipo_transformacao === 'datetime') {
        let dateValue: Date | null = null;
        if (valorBravo) {
          if (typeof valorBravo === 'string' || valorBravo instanceof Date) {
            dateValue = new Date(valorBravo);
          } else if (typeof valorBravo === 'number') {
            dateValue = new Date(valorBravo);
          }
        }
        resultado[mapeamento.campo_interno] = dateValue;
      } else if (mapeamento.tipo_transformacao === 'json') {
        // Campo vai para metadata (compatibilidade com sintaxe antiga)
        if (valorBravo !== null && valorBravo !== undefined) {
          const campoMeta = mapeamento.campo_interno.replace('metadata->', '');
          metadata[campoMeta] = valorBravo;
        }
      }
    });

    // Garantir campos essenciais
    if (!resultado.referencia) {
      resultado.referencia =
        produtoBravo.referencia || produtoBravo.ref || null;
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
