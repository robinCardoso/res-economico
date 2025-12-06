import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CampoMapeamentoDto, CreateMappingDto } from '../dto/mapping.dto';
import { BravoErpClientV2Service } from '../client/bravo-erp-client-v2.service';
import { BravoProduto } from '../client/bravo-erp-client.interface';

@Injectable()
export class MappingService {
  private readonly logger = new Logger(MappingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bravoClient: BravoErpClientV2Service,
  ) {}

  /**
   * Buscar mapeamentos de campos
   */
  async getMapeamentos(): Promise<{
    success: boolean;
    mapeamentos?: any[];
    error?: string;
  }> {
    try {
      const mapeamentos = await this.prisma.bravoCampoMapeamento.findMany({
        orderBy: {
          ordem: 'asc',
        },
      });

      return {
        success: true,
        mapeamentos: mapeamentos || [],
      };
    } catch (error) {
      console.error('❌ Erro ao buscar mapeamentos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Salvar mapeamentos de campos
   */
  async saveMapeamentos(
    dto: CreateMappingDto,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('💾 Salvando mapeamentos:', dto.mapeamentos.length);

      // Deletar mapeamentos existentes
      await this.prisma.bravoCampoMapeamento.deleteMany({});

      // Inserir novos mapeamentos
      await this.prisma.bravoCampoMapeamento.createMany({
        data: dto.mapeamentos.map((m, index) => ({
          campo_bravo: m.campo_bravo,
          campo_interno: m.campo_interno,
          tipo_transformacao: m.tipo_transformacao,
          ativo: m.ativo,
          ordem: index + 1,
        })),
      });

      console.log('✅ Mapeamentos salvos com sucesso');

      return {
        success: true,
        message: 'Mapeamentos salvos com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro ao salvar mapeamentos:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  }

  /**
   * MELHORIA 1: Obter campos da tabela produtos do schema Prisma
   */
  async getInternalFields(): Promise<{
    success: boolean;
    fields?: Array<{
      nome: string;
      tipo: string;
      obrigatorio: boolean;
      descricao: string;
    }>;
    error?: string;
  }> {
    try {
      // Definir campos da tabela produtos baseado no schema
      const fields = [
        // Campos obrigatórios e básicos
        {
          nome: 'referencia',
          tipo: 'varchar',
          obrigatorio: true,
          descricao: 'Referência única do produto (obrigatório)',
        },
        {
          nome: 'id_prod',
          tipo: 'varchar',
          obrigatorio: false,
          descricao: 'ID do produto (campo existente)',
        },
        {
          nome: 'descricao',
          tipo: 'text',
          obrigatorio: false,
          descricao: 'Descrição do produto',
        },
        {
          nome: 'marca',
          tipo: 'varchar',
          obrigatorio: false,
          descricao: 'Marca do produto',
        },
        {
          nome: 'grupo',
          tipo: 'varchar',
          obrigatorio: false,
          descricao: 'Grupo/categoria do produto',
        },
        {
          nome: 'subgrupo',
          tipo: 'varchar',
          obrigatorio: false,
          descricao: 'Subgrupo do produto',
        },
        {
          nome: 'ativo',
          tipo: 'boolean',
          obrigatorio: false,
          descricao: 'Produto ativo no sistema',
        },
        // Campos adicionais
        {
          nome: 'gtin',
          tipo: 'varchar',
          obrigatorio: false,
          descricao: 'Código GTIN/EAN do produto',
        },
        {
          nome: 'ncm',
          tipo: 'varchar',
          obrigatorio: false,
          descricao: 'Código NCM do produto',
        },
        {
          nome: 'cest',
          tipo: 'varchar',
          obrigatorio: false,
          descricao: 'Código CEST do produto',
        },
        {
          nome: 'dataUltModif',
          tipo: 'timestamp',
          obrigatorio: false,
          descricao: 'Data da última modificação',
        },
        // Campos de metadata (JSONB)
        {
          nome: 'metadata->bravo_id',
          tipo: 'jsonb',
          obrigatorio: false,
          descricao: 'ID original do Bravo ERP',
        },
        {
          nome: 'metadata->tipo_produto',
          tipo: 'jsonb',
          obrigatorio: false,
          descricao: 'Tipo do produto (prod, serv, etc)',
        },
        {
          nome: 'metadata->preco_venda',
          tipo: 'jsonb',
          obrigatorio: false,
          descricao: 'Preço de venda do produto',
        },
        {
          nome: 'metadata->peso_bruto',
          tipo: 'jsonb',
          obrigatorio: false,
          descricao: 'Peso bruto em kg',
        },
        {
          nome: 'metadata->peso_liquido',
          tipo: 'jsonb',
          obrigatorio: false,
          descricao: 'Peso líquido em kg',
        },
        {
          nome: 'metadata->unidade_venda',
          tipo: 'jsonb',
          obrigatorio: false,
          descricao: 'Unidade de venda (UND, KG, etc)',
        },
        {
          nome: 'metadata->data_modificacao_bravo',
          tipo: 'jsonb',
          obrigatorio: false,
          descricao: 'Data de modificação no Bravo',
        },
      ];

      return {
        success: true,
        fields,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter campos internos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * MELHORIA 2: Flatten object recursivamente para extrair campos aninhados
   */
  private flattenObject(
    obj: any,
    prefix = '',
    result: Array<{
      nome: string;
      tipo: string;
      valor_exemplo: any;
      caminho: string;
    }> = [],
  ): Array<{
    nome: string;
    tipo: string;
    valor_exemplo: any;
    caminho: string;
  }> {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const caminho = prefix ? `${prefix}.${key}` : key;

        if (value === null || value === undefined) {
          result.push({
            nome: caminho,
            tipo: 'null',
            valor_exemplo: null,
            caminho,
          });
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            // Se é array de objetos, processar primeiro item
            if (typeof value[0] === 'object' && value[0] !== null) {
              this.flattenObject(value[0], caminho, result);
            } else {
              result.push({
                nome: caminho,
                tipo: 'array',
                valor_exemplo: value[0],
                caminho,
              });
            }
          } else {
            result.push({
              nome: caminho,
              tipo: 'array',
              valor_exemplo: [],
              caminho,
            });
          }
        } else if (typeof value === 'object') {
          // Objeto aninhado - recursão
          this.flattenObject(value, caminho, result);
        } else {
          // Valor primitivo
          const tipo =
            typeof value === 'string'
              ? 'string'
              : typeof value === 'number'
                ? value % 1 === 0
                  ? 'integer'
                  : 'decimal'
                : typeof value === 'boolean'
                  ? 'boolean'
                  : 'unknown';

          result.push({
            nome: caminho,
            tipo,
            valor_exemplo: value,
            caminho,
          });
        }
      }
    }

    return result;
  }

  /**
   * MELHORIA 2: Obter campos do Bravo ERP do primeiro produto da API
   */
  async getBravoFields(): Promise<{
    success: boolean;
    fields?: Array<{
      nome: string;
      tipo: string;
      valor_exemplo: any;
      caminho: string;
    }>;
    product_sample?: any;
    error?: string;
  }> {
    try {
      // Buscar primeira página (1 produto)
      const produtos = await this.bravoClient.consultarProdutos({
        page: 1,
        limit: 1,
      });

      if (!produtos || produtos.length === 0) {
        return {
          success: false,
          error: 'Nenhum produto encontrado na API do Bravo ERP',
        };
      }

      const primeiroProduto = produtos[0];

      // Extrair campos usando flatten
      const campos = this.flattenObject(primeiroProduto);

      return {
        success: true,
        fields: campos,
        product_sample: primeiroProduto,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter campos do Bravo ERP:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao buscar campos',
      };
    }
  }

  /**
   * MELHORIA 3: Preview do mapeamento aplicado ao primeiro produto
   */
  async previewMapping(mapeamentos: CampoMapeamentoDto[]): Promise<{
    success: boolean;
    original?: any;
    mapped?: any;
    metadata?: any;
    mapping_details?: Array<{
      campo_bravo: string;
      campo_interno: string;
      valor_original: any;
      valor_mapeado: any;
      transformacao: string;
      sucesso: boolean;
      erro?: string;
    }>;
    unmapped_fields?: Array<{
      campo: string;
      valor: any;
      tipo: string;
    }>;
    error?: string;
  }> {
    try {
      // Buscar primeiro produto
      const produtos = await this.bravoClient.consultarProdutos({
        page: 1,
        limit: 1,
      });

      if (!produtos || produtos.length === 0) {
        return {
          success: false,
          error: 'Nenhum produto encontrado na API do Bravo ERP',
        };
      }

      const produtoOriginal = produtos[0];

      // Temporariamente salvar mapeamentos para aplicar transformação
      const mapeamentosAtivos = mapeamentos.filter((m) => m.ativo);
      
      // Criar map temporário de mapeamentos para usar na transformação
      const mapeamentoMapTemporario = new Map();
      mapeamentosAtivos.forEach((m) => {
        mapeamentoMapTemporario.set(m.campo_bravo, {
          campo_interno: m.campo_interno,
          tipo_transformacao: m.tipo_transformacao,
        });
      });

      // Aplicar transformação manualmente (simular ProductTransformService)
      const produtoMapeado: any = {
        updatedAt: new Date(),
      };
      const metadata: any = {};
      const mappingDetails: Array<{
        campo_bravo: string;
        campo_interno: string;
        valor_original: any;
        valor_mapeado: any;
        transformacao: string;
        sucesso: boolean;
        erro?: string;
      }> = [];

      // Função auxiliar para obter valor aninhado
      const obterValorCampo = (obj: any, caminho: string): any => {
        return caminho.split('.').reduce((o, key) => {
          if (o && typeof o === 'object') {
            return o[key];
          }
          return undefined;
        }, obj);
      };

      // Aplicar cada mapeamento
      mapeamentosAtivos.forEach((mapeamento) => {
        try {
          let valorOriginal = obterValorCampo(produtoOriginal, mapeamento.campo_bravo);
          let valorMapeado: any = null;

          if (mapeamento.tipo_transformacao === 'direto') {
            valorMapeado = valorOriginal || null;
            produtoMapeado[mapeamento.campo_interno] = valorMapeado;
          } else if (mapeamento.tipo_transformacao === 'boolean_invertido') {
            valorMapeado = valorOriginal === 'N';
            produtoMapeado[mapeamento.campo_interno] = valorMapeado;
          } else if (mapeamento.tipo_transformacao === 'json') {
            const campoMeta = mapeamento.campo_interno.replace('metadata->', '');
            if (valorOriginal !== null && valorOriginal !== undefined) {
              metadata[campoMeta] = valorOriginal;
              valorMapeado = valorOriginal;
            }
          } else if (mapeamento.tipo_transformacao === 'decimal') {
            valorMapeado = valorOriginal ? parseFloat(String(valorOriginal)) : null;
            produtoMapeado[mapeamento.campo_interno] = valorMapeado;
          } else if (mapeamento.tipo_transformacao === 'datetime') {
            valorMapeado = valorOriginal ? new Date(valorOriginal) : null;
            produtoMapeado[mapeamento.campo_interno] = valorMapeado;
          }

          mappingDetails.push({
            campo_bravo: mapeamento.campo_bravo,
            campo_interno: mapeamento.campo_interno,
            valor_original: valorOriginal,
            valor_mapeado: valorMapeado,
            transformacao: mapeamento.tipo_transformacao,
            sucesso: true,
          });
        } catch (error) {
          mappingDetails.push({
            campo_bravo: mapeamento.campo_bravo,
            campo_interno: mapeamento.campo_interno,
            valor_original: null,
            valor_mapeado: null,
            transformacao: mapeamento.tipo_transformacao,
            sucesso: false,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      });

      // Adicionar metadata se houver campos
      if (Object.keys(metadata).length > 0) {
        produtoMapeado.metadata = metadata;
      }

      // Identificar campos não mapeados
      const camposOriginais = this.flattenObject(produtoOriginal);
      const camposMapeados = new Set(
        mapeamentosAtivos.map((m) => m.campo_bravo),
      );
      const unmappedFields = camposOriginais
        .filter((campo) => !camposMapeados.has(campo.caminho))
        .map((campo) => ({
          campo: campo.caminho,
          valor: campo.valor_exemplo,
          tipo: campo.tipo,
        }));

      return {
        success: true,
        original: produtoOriginal,
        mapped: produtoMapeado,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        mapping_details: mappingDetails,
        unmapped_fields: unmappedFields,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao gerar preview do mapeamento:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao gerar preview',
      };
    }
  }
}
