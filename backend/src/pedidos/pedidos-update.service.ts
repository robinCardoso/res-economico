import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { PedidosAnalyticsService } from './analytics/pedidos-analytics.service';

export interface RecalcularDadosProdutoOptions {
  produtoId?: string;
  referencia?: string;
  apenasPedidosFuturos?: boolean;
  dataLimite?: Date;
  atualizarMarca?: boolean;
  atualizarGrupo?: boolean;
  atualizarSubgrupo?: boolean;
}

@Injectable()
export class PedidosUpdateService {
  private readonly logger = new Logger(PedidosUpdateService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: PedidosAnalyticsService,
  ) {}

  /**
   * Recalcula dados denormalizados de produto em pedidos relacionados
   *
   * IMPORTANTE: Por padrão, pedidos NÃO são atualizados automaticamente quando
   * um produto é atualizado, pois representam dados históricos. Este método
   * permite atualização manual quando necessário.
   *
   * @param opcoes Opções de recálculo
   * @returns Número de pedidos atualizados
   */
  async recalcularDadosProdutoEmPedidos(
    opcoes: RecalcularDadosProdutoOptions,
  ): Promise<{ atualizadas: number; total: number }> {
    this.logger.log(
      `Recalculando dados de produto em pedidos: ${JSON.stringify(opcoes)}`,
    );

    // Buscar produto
    let produto: {
      id: string;
      referencia: string | null;
      id_prod: string | null;
      marca: string | null;
      grupo: string | null;
      subgrupo: string | null;
    } | null = null;

    if (opcoes.produtoId) {
      produto = await this.prisma.produto.findUnique({
        where: { id: opcoes.produtoId },
        select: {
          id: true,
          referencia: true,
          id_prod: true,
          marca: true,
          grupo: true,
          subgrupo: true,
        },
      });
    } else if (opcoes.referencia) {
      // Buscar produto por referência com id_prod null (única combinação possível)
      produto = await this.prisma.produto.findUnique({
        where: {
          referencia: opcoes.referencia,
          id_prod: null as any,
        },
        select: {
          id: true,
          referencia: true,
          id_prod: true,
          marca: true,
          grupo: true,
          subgrupo: true,
        },
      });
    }

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Construir filtro para buscar pedidos relacionados
    const where: {
      OR: Array<{ referencia?: string; idProd?: string }>;
      dataPedido?: { gte: Date };
    } = {
      OR: [
        { referencia: produto.referencia ?? undefined },
        { idProd: produto.id_prod ?? undefined },
      ],
    };

    // Se apenas pedidos futuros, adicionar filtro de data
    if (opcoes.apenasPedidosFuturos && opcoes.dataLimite) {
      where.dataPedido = { gte: opcoes.dataLimite };
    }

    // Contar total de pedidos que serão afetados
    const total = await this.prisma.pedido.count({ where });

    // Preparar dados de atualização
    const updateData: {
      marca?: string;
      grupo?: string;
      subgrupo?: string;
    } = {};

    if (opcoes.atualizarMarca !== false) {
      updateData.marca = produto.marca ?? 'DESCONHECIDA';
    }

    if (opcoes.atualizarGrupo !== false) {
      updateData.grupo = produto.grupo ?? 'DESCONHECIDO';
    }

    if (opcoes.atualizarSubgrupo !== false) {
      updateData.subgrupo = produto.subgrupo ?? 'DESCONHECIDO';
    }

    // Atualizar pedidos relacionados
    const result = await this.prisma.pedido.updateMany({
      where,
      data: updateData,
    });

    this.logger.log(
      `Recálculo concluído: ${result.count} de ${total} pedidos atualizados`,
    );

    // Recalcular analytics para os pedidos atualizados
    // IMPORTANTE: Isso garante que o analytics seja atualizado com grupo/subgrupo corretos
    if (result.count > 0) {
      try {
        // Verificar se já há um recálculo em andamento
        const statusRecalculo = this.analyticsService.getRecalculoStatus();
        if (statusRecalculo.emAndamento) {
          this.logger.debug(
            `Recálculo de analytics já está em andamento. Pulando recálculo individual para evitar conflito. O recálculo em andamento processará todos os pedidos necessários.`,
          );
          // Retornar sem tentar recalcular - o recálculo em andamento já vai processar tudo
          return {
            atualizadas: result.count,
            total,
          };
        }

        // Buscar todos os períodos únicos dos pedidos atualizados
        const pedidosAtualizados = await this.prisma.pedido.findMany({
          where,
          select: {
            dataPedido: true,
          },
          distinct: ['dataPedido'],
        });

        if (pedidosAtualizados.length > 0) {
          // Agrupar por ano/mês e recalcular analytics para cada período
          const periodos = new Set<string>();
          pedidosAtualizados.forEach((p) => {
            const data = new Date(p.dataPedido);
            const ano = data.getFullYear();
            const mes = data.getMonth() + 1;
            periodos.add(`${ano}-${mes}`);
          });

          // Recalcular analytics para cada período único
          // IMPORTANTE: Verificar novamente antes de cada chamada, pois o status pode mudar
          for (const periodo of periodos) {
            // Verificar novamente se já está em andamento (pode ter mudado entre iterações)
            const statusAtual = this.analyticsService.getRecalculoStatus();
            if (statusAtual.emAndamento) {
              this.logger.debug(
                `Recálculo de analytics iniciado durante processamento. Pulando período ${periodo}.`,
              );
              continue;
            }

            const [ano, mes] = periodo.split('-').map(Number);
            try {
              await this.analyticsService.recalculcarAnalytics(
                new Date(ano, mes - 1, 1),
                new Date(ano, mes, 0, 23, 59, 59, 999),
              );
            } catch (error) {
              // Se o recálculo já está em andamento, apenas logar e continuar
              if (
                error instanceof Error &&
                error.message === 'Recálculo já está em andamento'
              ) {
                this.logger.debug(
                  `Recálculo de analytics já está em andamento para período ${ano}/${mes}. Pulando.`,
                );
                continue;
              }
              // Se for outro erro, relançar
              throw error;
            }
          }

          this.logger.log(
            `Analytics recalculado para ${periodos.size} período(s) após atualização de ${result.count} pedido(s)`,
          );
        }
      } catch (error) {
        // Logar erro mas não interromper o processo
        // Analytics pode ser recalculado manualmente depois se necessário
        this.logger.error(
          `Erro ao recalcular analytics após atualização de pedidos: ${error}`,
        );
      }
    }

    return {
      atualizadas: result.count,
      total,
    };
  }

  /**
   * Recalcula dados de produto em todos os pedidos relacionados a um produto
   * quando o produto é atualizado (chamado opcionalmente)
   *
   * ATUALIZADO: Agora atualiza automaticamente pedidos e analytics quando subgrupo é atualizado
   */
  async onProdutoUpdated(
    produtoId: string,
    dadosAtualizados: {
      subgrupo?: string | null;
      grupo?: string | null;
      marca?: string | null;
    },
  ): Promise<void> {
    // Se subgrupo, grupo ou marca foram atualizados, recalcular pedidos e analytics
    if (
      dadosAtualizados.subgrupo !== undefined ||
      dadosAtualizados.grupo !== undefined ||
      dadosAtualizados.marca !== undefined
    ) {
      this.logger.log(
        `Produto ${produtoId} teve dados atualizados. Recalculando pedidos e analytics...`,
      );

      try {
        await this.recalcularDadosProdutoEmPedidos({
          produtoId,
          atualizarMarca: dadosAtualizados.marca !== undefined,
          atualizarGrupo: dadosAtualizados.grupo !== undefined,
          atualizarSubgrupo: dadosAtualizados.subgrupo !== undefined,
        });

        this.logger.log(
          `Pedidos e analytics atualizados automaticamente para produto ${produtoId}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao atualizar pedidos e analytics para produto ${produtoId}:`,
          error,
        );
      }
    } else {
      this.logger.debug(
        `Produto ${produtoId} foi atualizado, mas não há mudanças que afetem pedidos.`,
      );
    }
  }
}
