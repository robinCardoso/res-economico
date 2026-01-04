import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { VendasAnalyticsService } from './analytics/vendas-analytics.service';

export interface RecalcularDadosProdutoOptions {
  produtoId?: string;
  referencia?: string;
  apenasVendasFuturas?: boolean;
  dataLimite?: Date;
  atualizarMarca?: boolean;
  atualizarGrupo?: boolean;
  atualizarSubgrupo?: boolean;
}

@Injectable()
export class VendasUpdateService {
  private readonly logger = new Logger(VendasUpdateService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: VendasAnalyticsService,
  ) {}

  /**
   * Recalcula dados denormalizados de produto em vendas relacionadas
   *
   * IMPORTANTE: Por padrão, vendas NÃO são atualizadas automaticamente quando
   * um produto é atualizado, pois representam dados históricos. Este método
   * permite atualização manual quando necessário.
   *
   * @param opcoes Opções de recálculo
   * @returns Número de vendas atualizadas
   */
  async recalcularDadosProdutoEmVendas(
    opcoes: RecalcularDadosProdutoOptions,
  ): Promise<{ atualizadas: number; total: number }> {
    this.logger.log(
      `Recalculando dados de produto em vendas: ${JSON.stringify(opcoes)}`,
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

    // Construir filtro para buscar vendas relacionadas
    const where: {
      OR: Array<{ referencia?: string; idProd?: string }>;
      dataVenda?: { gte: Date };
    } = {
      OR: [
        { referencia: produto.referencia ?? undefined },
        { idProd: produto.id_prod ?? undefined },
      ],
    };

    // Se apenas vendas futuras, adicionar filtro de data
    if (opcoes.apenasVendasFuturas && opcoes.dataLimite) {
      where.dataVenda = { gte: opcoes.dataLimite };
    }

    // Contar total de vendas que serão afetadas
    const total = await this.prisma.venda.count({ where });

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

    // Atualizar vendas relacionadas
    const result = await this.prisma.venda.updateMany({
      where,
      data: updateData,
    });

    this.logger.log(
      `Recálculo concluído: ${result.count} de ${total} vendas atualizadas`,
    );

    // Recalcular analytics para as vendas atualizadas
    // IMPORTANTE: Isso garante que o analytics seja atualizado com grupo/subgrupo corretos
    if (result.count > 0) {
      try {
        // Verificar se já há um recálculo em andamento
        const statusRecalculo = this.analyticsService.getRecalculoStatus();
        if (statusRecalculo.emAndamento) {
          this.logger.debug(
            `Recálculo de analytics já está em andamento. Pulando recálculo individual para evitar conflito. O recálculo em andamento processará todas as vendas necessárias.`,
          );
          // Retornar sem tentar recalcular - o recálculo em andamento já vai processar tudo
          return {
            atualizadas: result.count,
            total,
          };
        }

        // Buscar todos os períodos únicos das vendas atualizadas
        const vendasAtualizadas = await this.prisma.venda.findMany({
          where,
          select: {
            dataVenda: true,
          },
          distinct: ['dataVenda'],
        });

        if (vendasAtualizadas.length > 0) {
          // Agrupar por ano/mês e recalcular analytics para cada período
          const periodos = new Set<string>();
          vendasAtualizadas.forEach((v) => {
            const data = new Date(v.dataVenda);
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
            `Analytics recalculado para ${periodos.size} período(s) após atualização de ${result.count} venda(s)`,
          );
        }
      } catch (error) {
        // Se o erro for "Recálculo já está em andamento", apenas logar como debug
        if (
          error instanceof Error &&
          error.message === 'Recálculo já está em andamento'
        ) {
          this.logger.debug(
            `Recálculo de analytics já está em andamento. O recálculo em andamento processará todas as vendas necessárias.`,
          );
        } else {
          this.logger.error(
            `Erro ao recalcular analytics após atualização de produto:`,
            error,
          );
        }
        // Não falhar se o analytics falhar
      }
    }

    return {
      atualizadas: result.count,
      total,
    };
  }

  /**
   * Recalcula dados de produto em todas as vendas relacionadas a um produto
   * quando o produto é atualizado (chamado opcionalmente)
   *
   * ATUALIZADO: Agora atualiza automaticamente vendas e analytics quando subgrupo é atualizado
   */
  async onProdutoUpdated(
    produtoId: string,
    dadosAtualizados: {
      subgrupo?: string | null;
      grupo?: string | null;
      marca?: string | null;
    },
  ): Promise<void> {
    // Se subgrupo, grupo ou marca foram atualizados, recalcular vendas e analytics
    if (
      dadosAtualizados.subgrupo !== undefined ||
      dadosAtualizados.grupo !== undefined ||
      dadosAtualizados.marca !== undefined
    ) {
      this.logger.log(
        `Produto ${produtoId} teve dados atualizados. Recalculando vendas e analytics...`,
      );

      try {
        await this.recalcularDadosProdutoEmVendas({
          produtoId,
          atualizarMarca: dadosAtualizados.marca !== undefined,
          atualizarGrupo: dadosAtualizados.grupo !== undefined,
          atualizarSubgrupo: dadosAtualizados.subgrupo !== undefined,
        });

        this.logger.log(
          `Vendas e analytics atualizados automaticamente para produto ${produtoId}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao atualizar vendas e analytics para produto ${produtoId}:`,
          error,
        );
      }
    } else {
      this.logger.debug(
        `Produto ${produtoId} foi atualizado, mas não há mudanças que afetem vendas.`,
      );
    }
  }
}
