import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ProductTransformService } from './product-transform.service';
import { SyncLogService } from './sync-log.service';
import { BravoProduto } from '../client/bravo-erp-client.interface';
import { Prisma } from '@prisma/client';
import { VendasUpdateService } from '../../../vendas/vendas-update.service';

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
    private readonly vendasUpdateService: VendasUpdateService,
  ) {}

  /**
   * Processa lote de produtos (inserção/atualização)
   * Retorna estatísticas do processamento
   */
  async processarLoteProdutos(
    produtos: BravoProduto[],
    apenas_ativos: boolean,
    syncLogId: string | null,
    verificar_duplicatas: boolean = true,
    modo_teste: boolean = false,
  ): Promise<{
    inseridos: number;
    atualizados: number;
    ignorados: number;
    comErro: number;
  }> {
    const produtosComErro = 0;
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
          (p: Record<string, unknown>) => p.excluido === 'N',
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
        return {
          inseridos: 0,
          atualizados: 0,
          ignorados: 0,
          comErro: 0,
        };
      }

      // Buscar produtos existentes (se verificar_duplicatas estiver habilitado)
      const mapaProdutosExistentes = await this.buscarProdutosExistentes(
        produtosFiltrados,
        verificar_duplicatas,
        modo_teste,
      );

      const produtosParaInserir: Array<Record<string, unknown>> = [];
      const produtosParaAtualizar: Array<Record<string, unknown>> = [];
      let produtosIgnorados = 0;

      // Analisar cada produto
      for (const produtoBravo of produtosFiltrados) {
        try {
          const dadosTransformados =
            await this.transformService.transformarProduto(produtoBravo);

          // Garantir referência e id_prod
          const referenciaValue = dadosTransformados.referencia;
          let referenciaStr = '';
          if (referenciaValue != null) {
            if (typeof referenciaValue === 'string') {
              referenciaStr = referenciaValue.trim();
            } else if (
              typeof referenciaValue === 'number' ||
              typeof referenciaValue === 'boolean'
            ) {
              referenciaStr = String(referenciaValue).trim();
            }
          }
          dadosTransformados.referencia = referenciaStr;

          const idProdValue = dadosTransformados.id_prod;
          let idProdStr: string | null = null;
          if (idProdValue != null) {
            if (typeof idProdValue === 'string') {
              idProdStr = idProdValue.trim();
            } else if (
              typeof idProdValue === 'number' ||
              typeof idProdValue === 'boolean'
            ) {
              idProdStr = String(idProdValue).trim();
            }
          }
          dadosTransformados.id_prod = idProdStr;

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
                const dataBravoStr =
                  typeof dataBravo === 'string' ? dataBravo : String(dataBravo);
                let dataAtualStr: string | Date | null = null;
                if (
                  typeof dataAtual === 'string' ||
                  dataAtual instanceof Date
                ) {
                  dataAtualStr = dataAtual;
                } else if (
                  typeof dataAtual === 'number' ||
                  typeof dataAtual === 'boolean'
                ) {
                  dataAtualStr = String(dataAtual);
                }
                if (!dataAtualStr) continue;
                const dataBravoDate = new Date(dataBravoStr);
                const dataAtualDate =
                  dataAtualStr instanceof Date
                    ? dataAtualStr
                    : new Date(dataAtualStr);

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
      let realmenteInseridos = 0;
      if (produtosParaInserir.length > 0 && !modo_teste) {
        realmenteInseridos = await this.inserirProdutos(
          produtosParaInserir,
          tiposErro,
        );
      } else if (modo_teste) {
        this.logger.log(
          `🧪 Modo teste: ${produtosParaInserir.length} produtos seriam inseridos`,
        );
        realmenteInseridos = 0;
      }

      // Processar atualizações
      let realmenteAtualizados = 0;
      if (produtosParaAtualizar.length > 0 && !modo_teste) {
        realmenteAtualizados = await this.atualizarProdutos(
          produtosParaAtualizar,
        );
      } else if (modo_teste) {
        this.logger.log(
          `🧪 Modo teste: ${produtosParaAtualizar.length} produtos seriam atualizados`,
        );
        realmenteAtualizados = 0;
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

      // Retornar estatísticas do processamento (valores realmente inseridos/atualizados)
      return {
        inseridos: realmenteInseridos,
        atualizados: realmenteAtualizados,
        ignorados: produtosIgnorados,
        comErro: produtosComErro,
      };
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
  ): Promise<Map<string, Record<string, unknown>>> {
    const mapaProdutosExistentes = new Map<string, Record<string, unknown>>();

    if (!verificar_duplicatas || modo_teste) {
      return mapaProdutosExistentes;
    }

    const referencias = Array.from(
      new Set(
        produtos
          .map((p: Record<string, unknown>) => {
            const ref = p.referencia;
            if (ref == null) return null;
            if (typeof ref === 'string') return ref.trim();
            if (typeof ref === 'number' || typeof ref === 'boolean') {
              return String(ref).trim();
            }
            return null;
          })
          .filter((ref: string | null): ref is string => !!ref),
      ),
    );

    const idProdutos = Array.from(
      new Set(
        produtos
          .map((p: Record<string, unknown>) => {
            const idProd = p.id_prod; // Corrigido: usar id_prod em vez de id_produto
            if (idProd == null) return null;
            if (typeof idProd === 'string') return idProd.trim();
            if (typeof idProd === 'number' || typeof idProd === 'boolean') {
              return String(idProd).trim();
            }
            return null;
          })
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
          descricao: true, // Adicionado para a nova lógica de duplicatas
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
        const descricaoKey = produto.descricao
          ? String(produto.descricao).trim()
          : null;

        if (refKey) {
          mapaProdutosExistentes.set(refKey, {
            id: produto.id,
            data_modificacao: produto.dataUltModif,
            id_prod: idProdKey,
            descricao: descricaoKey,
          });
        }

        if (idProdKey) {
          mapaProdutosExistentes.set(`id_prod:${idProdKey}`, {
            id: produto.id,
            data_modificacao: produto.dataUltModif,
            referencia: refKey,
            descricao: descricaoKey,
          });
        }

        // Adicionando chave combinada id_prod:referencia para verificação de duplicatas
        if (idProdKey && refKey) {
          mapaProdutosExistentes.set(
            `id_prod:${idProdKey}:referencia:${refKey}`,
            {
              id: produto.id,
              data_modificacao: produto.dataUltModif,
              referencia: refKey,
              descricao: descricaoKey,
              id_prod: idProdKey,
            },
          );
        }

        // Adicionando chave combinada id_prod:descricao para verificação de duplicatas
        if (idProdKey && descricaoKey) {
          mapaProdutosExistentes.set(
            `id_prod:${idProdKey}:descricao:${descricaoKey}`,
            {
              id: produto.id,
              data_modificacao: produto.dataUltModif,
              referencia: refKey,
              descricao: descricaoKey,
            },
          );
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
          descricao: true, // Adicionado para a nova lógica de duplicatas
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
        const descricaoKey = produto.descricao
          ? String(produto.descricao).trim()
          : null;

        if (refKey) {
          mapaProdutosExistentes.set(refKey, {
            id: produto.id,
            data_modificacao: produto.dataUltModif,
            id_prod: idProdKey,
            descricao: descricaoKey,
          });
        }

        if (idProdKey) {
          mapaProdutosExistentes.set(`id_prod:${idProdKey}`, {
            id: produto.id,
            data_modificacao: produto.dataUltModif,
            referencia: refKey,
            descricao: descricaoKey,
          });
        }

        // Adicionando chave combinada id_prod:referencia para verificação de duplicatas
        if (idProdKey && refKey) {
          mapaProdutosExistentes.set(
            `id_prod:${idProdKey}:referencia:${refKey}`,
            {
              id: produto.id,
              data_modificacao: produto.dataUltModif,
              referencia: refKey,
              descricao: descricaoKey,
              id_prod: idProdKey,
            },
          );
        }

        // Adicionando chave combinada id_prod:descricao para verificação de duplicatas
        if (idProdKey && descricaoKey) {
          mapaProdutosExistentes.set(
            `id_prod:${idProdKey}:descricao:${descricaoKey}`,
            {
              id: produto.id,
              data_modificacao: produto.dataUltModif,
              referencia: refKey,
              descricao: descricaoKey,
            },
          );
        }
      });
    }

    return mapaProdutosExistentes;
  }

  /**
   * Encontra produto existente no mapa
   */
  private encontrarProdutoExistente(
    dadosTransformados: Record<string, unknown>,
    mapaProdutosExistentes: Map<string, Record<string, unknown>>,
  ): Record<string, unknown> | undefined {
    const referencia = dadosTransformados.referencia as string | undefined;
    const idProd = dadosTransformados.id_prod as string | undefined;

    // Verificar duplicata pela combinação id_prod + referencia
    if (referencia && idProd) {
      const produtoExistentePorComb = mapaProdutosExistentes.get(
        `id_prod:${idProd}:referencia:${referencia}`,
      );
      if (produtoExistentePorComb) {
        return produtoExistentePorComb;
      }
    }

    // Caso não encontre pela combinação, verificar individualmente como fallback
    const produtoExistentePorRef = referencia
      ? mapaProdutosExistentes.get(referencia)
      : undefined;

    const produtoExistentePorId = idProd
      ? mapaProdutosExistentes.get(`id_prod:${idProd}`)
      : undefined;

    return produtoExistentePorRef || produtoExistentePorId;
  }

  /**
   * Insere produtos no banco
   * Retorna quantidade realmente inserida
   */
  private async inserirProdutos(
    produtosParaInserir: Array<Record<string, unknown>>,
    tiposErro: Record<string, number>,
  ): Promise<number> {
    this.logger.log(
      `💾 Inserindo ${produtosParaInserir.length} produtos novos...`,
    );

    // Remover ID dos produtos novos
    const produtosNovos = produtosParaInserir.map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...produtoSemId } = p;
      return produtoSemId;
    });

    let inseridos = 0;

    try {
      const result = await this.prisma.produto.createMany({
        data: produtosNovos as Prisma.ProdutoCreateManyInput[],
        skipDuplicates: true,
      });

      inseridos = result.count;

      this.logger.log(
        `✅ ${inseridos} produtos novos inseridos (de ${produtosParaInserir.length} tentados)`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`❌ Erro ao inserir produtos novos:`, errorMessage);
      // Se erro de chave duplicada, tentar inserir um por vez
      const errorObj = error as { code?: string };
      if (errorObj.code === 'P2002') {
        this.logger.log(
          `🔍 Tentando inserir produtos um por vez para identificar conflitos...`,
        );
        for (const produto of produtosNovos) {
          try {
            await this.prisma.produto.create({
              data: produto as Prisma.ProdutoCreateInput,
            });
            inseridos++;
          } catch (singleError: unknown) {
            let refStr = 'desconhecido';
            const ref = produto.referencia;
            if (typeof ref === 'string') {
              refStr = ref;
            } else if (typeof ref === 'number' || typeof ref === 'boolean') {
              refStr = String(ref);
            }

            let idProdStr = 'desconhecido';
            const idProd = produto.id_prod;
            if (typeof idProd === 'string') {
              idProdStr = idProd;
            } else if (
              typeof idProd === 'number' ||
              typeof idProd === 'boolean'
            ) {
              idProdStr = String(idProd);
            }
            const errorMsg =
              singleError instanceof Error
                ? singleError.message
                : 'Erro desconhecido';
            this.logger.error(
              `❌ Conflito no produto: ref=${refStr}, id_prod=${idProdStr}`,
              errorMsg,
            );
            tiposErro['duplicate_key'] = (tiposErro['duplicate_key'] || 0) + 1;
          }
        }
      }
    }

    return inseridos;
  }

  /**
   * Atualiza produtos existentes
   * Retorna quantidade realmente atualizada
   */
  private async atualizarProdutos(
    produtosParaAtualizar: any[],
  ): Promise<number> {
    this.logger.log(
      `💾 Atualizando ${produtosParaAtualizar.length} produtos existentes...`,
    );

    let atualizados = 0;

    for (const produto of produtosParaAtualizar) {
      const { id, ...dadosAtualizacao } = produto as {
        id?: unknown;
        [key: string]: unknown;
      };

      try {
        // Buscar dados antigos do produto para comparar
        const produtoAntes = await this.prisma.produto.findUnique({
          where: { id: id as string },
          select: {
            subgrupo: true,
            grupo: true,
            marca: true,
          },
        });

        await this.prisma.produto.update({
          where: { id: id as string },
          data: dadosAtualizacao as Prisma.ProdutoUpdateInput,
        });

        // Verificar se subgrupo, grupo ou marca foram atualizados
        const dadosAtualizados: {
          subgrupo?: string | null;
          grupo?: string | null;
          marca?: string | null;
        } = {};

        if (
          produtoAntes &&
          (dadosAtualizacao.subgrupo !== undefined ||
            dadosAtualizacao.grupo !== undefined ||
            dadosAtualizacao.marca !== undefined)
        ) {
          if (
            dadosAtualizacao.subgrupo !== undefined &&
            dadosAtualizacao.subgrupo !== produtoAntes.subgrupo
          ) {
            dadosAtualizados.subgrupo = dadosAtualizacao.subgrupo as
              | string
              | null;
          }
          if (
            dadosAtualizacao.grupo !== undefined &&
            dadosAtualizacao.grupo !== produtoAntes.grupo
          ) {
            dadosAtualizados.grupo = dadosAtualizacao.grupo as string | null;
          }
          if (
            dadosAtualizacao.marca !== undefined &&
            dadosAtualizacao.marca !== produtoAntes.marca
          ) {
            dadosAtualizados.marca = dadosAtualizacao.marca as string | null;
          }

          // Se algum campo relevante foi atualizado, recalcular vendas e analytics
          if (Object.keys(dadosAtualizados).length > 0) {
            // Chamar de forma assíncrona para não bloquear o sync
            this.vendasUpdateService
              .onProdutoUpdated(id as string, dadosAtualizados)
              .catch((error: unknown) => {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                this.logger.error(
                  `Erro ao atualizar vendas após atualização de produto ${String(id)}: ${errorMessage}`,
                );
              });
          }
        }

        atualizados++;
      } catch (error: unknown) {
        const produtoRef = produto as { referencia?: unknown };
        let refStr = 'desconhecido';
        const ref = produtoRef.referencia;
        if (typeof ref === 'string') {
          refStr = ref;
        } else if (typeof ref === 'number' || typeof ref === 'boolean') {
          refStr = String(ref);
        }
        const errorMsg =
          error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(`❌ Erro ao atualizar produto ${refStr}:`, errorMsg);
      }
    }

    this.logger.log(
      `✅ ${atualizados} produtos existentes atualizados (de ${produtosParaAtualizar.length} tentados)`,
    );

    return atualizados;
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
