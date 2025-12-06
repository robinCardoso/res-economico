import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ProductTransformService } from './product-transform.service';
import { SyncLogService } from './sync-log.service';
import { BravoProduto } from '../client/bravo-erp-client.interface';
import { Prisma } from '@prisma/client';

/**
 * Serviço para processar lotes de produtos
 */
@Injectable()
export class SyncProcessorService {
  private readonly logger = new Logger(SyncProcessorService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor(
    private readonly prisma: PrismaService,
    private readonly transformService: ProductTransformService,
    private readonly logService: SyncLogService,
  ) {}

  /**
   * Processa lote de produtos (inserção/atualização)
   */
  async processarLoteProdutos(
    produtos: BravoProduto[],
    apenas_ativos: boolean,
    syncLogId: string | null,
    verificar_duplicatas: boolean = true,
    modo_teste: boolean = false,
  ): Promise<void> {
    let produtosComErro = 0;
    const tiposErro: Record<string, number> = {};
    const sugestoesCorrecao: string[] = [];

    try {
      if (this.isDev) {
        this.logger.log(
          `🔄 Processando lote de ${produtos.length} produtos...`,
        );
      }

      // Aplicar filtro de produtos ativos
      let produtosFiltrados = produtos;
      if (apenas_ativos) {
        const antes = produtos.length;
        produtosFiltrados = produtos.filter(
          (p: any) => p.excluido === 'N',
        );
        if (this.isDev) {
          this.logger.log(
            `🔍 Filtro ativos: ${antes} → ${produtosFiltrados.length} produtos`,
          );
        }
      }

      if (produtosFiltrados.length === 0) {
        if (this.isDev) {
          this.logger.log(`⏭️ Nenhum produto ativo no lote`);
        }
        return;
      }

      // Buscar produtos existentes (se verificar_duplicatas estiver habilitado)
      const mapaProdutosExistentes = await this.buscarProdutosExistentes(
        produtosFiltrados,
        verificar_duplicatas,
        modo_teste,
      );

      const produtosParaInserir: any[] = [];
      const produtosParaAtualizar: any[] = [];
      let produtosIgnorados = 0;

      // Analisar cada produto
      for (const produtoBravo of produtosFiltrados) {
        try {
          const dadosTransformados =
            await this.transformService.transformarProduto(produtoBravo);

          // Garantir referência e id_prod
          dadosTransformados.referencia =
            dadosTransformados.referencia != null
              ? String(dadosTransformados.referencia).trim()
              : '';
          dadosTransformados.id_prod =
            dadosTransformados.id_prod != null
              ? String(dadosTransformados.id_prod).trim()
              : null;

          // Garantir que dataUltModif seja sempre salvo
          if (produtoBravo._data_ult_modif) {
            dadosTransformados.dataUltModif = new Date(
              produtoBravo._data_ult_modif,
            );
          } else if (produtoBravo.dataUltModif) {
            dadosTransformados.dataUltModif = new Date(
              produtoBravo.dataUltModif,
            );
          }

          if (!dadosTransformados.referencia) {
            if (this.isDev) {
              this.logger.warn(
                '⚠️ Produto sem referência ignorado',
                produtoBravo,
              );
            }
            continue;
          }

          if (verificar_duplicatas) {
            const produtoExistente = this.encontrarProdutoExistente(
              dadosTransformados,
              mapaProdutosExistentes,
            );

            if (produtoExistente) {
              // Verificar data de modificação
              const dataBravo =
                produtoBravo._data_ult_modif || produtoBravo.dataUltModif;
              const dataAtual = produtoExistente.data_modificacao;

              if (dataBravo && dataAtual) {
                const dataBravoDate = new Date(dataBravo);
                const dataAtualDate = new Date(dataAtual);

                if (dataBravoDate <= dataAtualDate) {
                  produtosIgnorados++;
                  continue;
                }
              }

              produtosParaAtualizar.push({
                ...dadosTransformados,
                id: produtoExistente.id,
              });
            } else {
              produtosParaInserir.push(dadosTransformados);
            }
          } else {
            produtosParaInserir.push(dadosTransformados);
          }
        } catch (error) {
          this.logger.error(
            `❌ Erro ao transformar produto ${produtoBravo.referencia}:`,
            error,
          );
        }
      }

      this.logger.log(
        `📋 Lote analisado: ${produtosParaInserir.length} novos, ${produtosParaAtualizar.length} existentes, ${produtosIgnorados} ignorados`,
      );

      // Processar inserções
      if (produtosParaInserir.length > 0 && !modo_teste) {
        await this.inserirProdutos(
          produtosParaInserir,
          tiposErro,
          sugestoesCorrecao,
        );
      } else if (modo_teste) {
        this.logger.log(
          `🧪 Modo teste: ${produtosParaInserir.length} produtos seriam inseridos`,
        );
      }

      // Processar atualizações
      if (produtosParaAtualizar.length > 0 && !modo_teste) {
        await this.atualizarProdutos(produtosParaAtualizar);
      } else if (modo_teste) {
        this.logger.log(
          `🧪 Modo teste: ${produtosParaAtualizar.length} produtos seriam atualizados`,
        );
      }

      // Atualizar log com detalhes de erro
      if (
        !modo_teste &&
        syncLogId &&
        (produtosComErro > 0 || Object.keys(tiposErro).length > 0)
      ) {
        await this.logService.updateLog(syncLogId, {
          produtos_com_erro: produtosComErro,
          tipos_erro: tiposErro as Prisma.InputJsonValue,
          sugestoes_correcao: sugestoesCorrecao,
          status_detalhado:
            produtosComErro > 0
              ? 'completed_with_errors'
              : 'completed_successfully',
          percentual_sucesso:
            produtosFiltrados.length > 0
              ? Math.round(
                  ((produtosFiltrados.length - produtosComErro) /
                    produtosFiltrados.length) *
                    100,
                )
              : 100,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao processar lote de produtos:', error);
      throw error;
    }
  }

  /**
   * Busca produtos existentes no banco
   */
  private async buscarProdutosExistentes(
    produtos: BravoProduto[],
    verificar_duplicatas: boolean,
    modo_teste: boolean,
  ): Promise<Map<string, any>> {
    const mapaProdutosExistentes = new Map();

    if (!verificar_duplicatas || modo_teste) {
      return mapaProdutosExistentes;
    }

    const referencias = Array.from(
      new Set(
        produtos
          .map((p: any) =>
            p.referencia != null ? String(p.referencia).trim() : null,
          )
          .filter((ref: string | null): ref is string => !!ref),
      ),
    );

    const idProdutos = Array.from(
      new Set(
        produtos
          .map((p: any) =>
            p.id_produto != null ? String(p.id_produto).trim() : null,
          )
          .filter((id: string | null): id is string => !!id),
      ),
    );

    // Buscar por referência
    if (referencias.length > 0) {
      const encontradosPorReferencia = await this.prisma.produto.findMany({
        where: { referencia: { in: referencias } },
        select: {
          id: true,
          referencia: true,
          id_prod: true,
          dataUltModif: true,
        },
      });

      encontradosPorReferencia.forEach((produto) => {
        const refKey = produto.referencia
          ? String(produto.referencia).trim()
          : null;
        const idProdKey = produto.id_prod
          ? String(produto.id_prod).trim()
          : null;

        if (refKey) {
          mapaProdutosExistentes.set(refKey, {
            id: produto.id,
            data_modificacao: produto.dataUltModif,
            id_prod: idProdKey,
          });
        }

        if (idProdKey) {
          mapaProdutosExistentes.set(`id_prod:${idProdKey}`, {
            id: produto.id,
            data_modificacao: produto.dataUltModif,
            referencia: refKey,
          });
        }
      });
    }

    // Buscar por id_prod
    if (idProdutos.length > 0) {
      const encontradosPorId = await this.prisma.produto.findMany({
        where: { id_prod: { in: idProdutos } },
        select: {
          id: true,
          referencia: true,
          id_prod: true,
          dataUltModif: true,
        },
      });

      encontradosPorId.forEach((produto) => {
        const refKey = produto.referencia
          ? String(produto.referencia).trim()
          : null;
        const idProdKey = produto.id_prod
          ? String(produto.id_prod).trim()
          : null;

        if (refKey) {
          mapaProdutosExistentes.set(refKey, {
            id: produto.id,
            data_modificacao: produto.dataUltModif,
            id_prod: idProdKey,
          });
        }

        if (idProdKey) {
          mapaProdutosExistentes.set(`id_prod:${idProdKey}`, {
            id: produto.id,
            data_modificacao: produto.dataUltModif,
            referencia: refKey,
          });
        }
      });
    }

    return mapaProdutosExistentes;
  }

  /**
   * Encontra produto existente no mapa
   */
  private encontrarProdutoExistente(
    dadosTransformados: any,
    mapaProdutosExistentes: Map<string, any>,
  ): any {
    const produtoExistentePorRef = mapaProdutosExistentes.get(
      dadosTransformados.referencia,
    );

    const produtoExistentePorId = dadosTransformados.id_prod
      ? mapaProdutosExistentes.get(`id_prod:${dadosTransformados.id_prod}`)
      : null;

    return produtoExistentePorRef || produtoExistentePorId;
  }

  /**
   * Insere produtos no banco
   */
  private async inserirProdutos(
    produtosParaInserir: any[],
    tiposErro: Record<string, number>,
    sugestoesCorrecao: string[],
  ): Promise<void> {
    this.logger.log(`💾 Inserindo ${produtosParaInserir.length} produtos novos...`);

    // Remover ID dos produtos novos
    const produtosNovos = produtosParaInserir.map((p) => {
      const { id, ...produtoSemId } = p;
      return produtoSemId;
    });

    try {
      await this.prisma.produto.createMany({
        data: produtosNovos,
        skipDuplicates: true,
      });

      this.logger.log(
        `✅ ${produtosParaInserir.length} produtos novos inseridos`,
      );
    } catch (error: any) {
      this.logger.error(`❌ Erro ao inserir produtos novos:`, error);
      // Se erro de chave duplicada, tentar inserir um por vez
      if (error.code === 'P2002') {
        this.logger.log(
          `🔍 Tentando inserir produtos um por vez para identificar conflitos...`,
        );
        for (const produto of produtosNovos) {
          try {
            await this.prisma.produto.create({ data: produto });
          } catch (singleError: any) {
            this.logger.error(
              `❌ Conflito no produto: ref=${produto.referencia}, id_prod=${produto.id_prod}`,
              singleError,
            );
            tiposErro['duplicate_key'] =
              (tiposErro['duplicate_key'] || 0) + 1;
          }
        }
      }
    }
  }

  /**
   * Atualiza produtos existentes
   */
  private async atualizarProdutos(
    produtosParaAtualizar: any[],
  ): Promise<void> {
    this.logger.log(
      `💾 Atualizando ${produtosParaAtualizar.length} produtos existentes...`,
    );

    for (const produto of produtosParaAtualizar) {
      const { id, ...dadosAtualizacao } = produto;

      try {
        await this.prisma.produto.update({
          where: { id },
          data: dadosAtualizacao,
        });
      } catch (error) {
        this.logger.error(
          `❌ Erro ao atualizar produto ${produto.referencia}:`,
          error,
        );
      }
    }

    this.logger.log(
      `✅ ${produtosParaAtualizar.length} produtos existentes atualizados`,
    );
  }

  /**
   * Atualiza tabelas agregadas (Marcas, Grupos, Subgrupos)
   */
  async atualizarTabelasAgregadas(): Promise<void> {
    try {
      this.logger.log(
        '🏷️ Atualizando tabelas de marcas, grupos e subgrupos...',
      );

      const produtos = await this.prisma.produto.findMany({
        where: { marca: { not: null } },
        select: { marca: true, grupo: true, subgrupo: true },
      });

      const marcasSet = new Set<string>();
      const gruposSet = new Set<string>();
      const subgruposSet = new Set<string>();

      produtos.forEach((produto) => {
        if (produto.marca) marcasSet.add(produto.marca);
        if (produto.grupo) gruposSet.add(produto.grupo);
        if (produto.subgrupo) subgruposSet.add(produto.subgrupo);
      });

      // Atualizar marcas
      const marcas = Array.from(marcasSet);
      for (const marca of marcas) {
        await this.prisma.marca.upsert({
          where: { nome: marca },
          update: {},
          create: { nome: marca },
        });
      }

      // Atualizar grupos
      const grupos = Array.from(gruposSet);
      for (const grupo of grupos) {
        await this.prisma.grupo.upsert({
          where: { nome: grupo },
          update: {},
          create: { nome: grupo },
        });
      }

      // Atualizar subgrupos
      const subgrupos = Array.from(subgruposSet);
      for (const subgrupo of subgrupos) {
        await this.prisma.subgrupo.upsert({
          where: { nome: subgrupo },
          update: {},
          create: { nome: subgrupo },
        });
      }

      this.logger.log(
        `✅ Tabelas atualizadas: ${marcas.length} marcas, ${grupos.length} grupos, ${subgrupos.length} subgrupos`,
      );
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar tabelas agregadas:', error);
      throw error;
    }
  }
}
