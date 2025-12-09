import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface VendaParaAnalytics {
  dataVenda: Date;
  nomeFantasia?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  ufDestino?: string;
  valorTotal: Decimal;
  quantidade: Decimal;
}

@Injectable()
export class VendasAnalyticsService {
  private readonly logger = new Logger(VendasAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Atualiza analytics para uma lista de vendas
   * Agrupa por ano, mês, nomeFantasia, marca, grupo, subgrupo e uf
   * NOTA: grupo e subgrupo foram adicionados à chave de agrupamento para evitar cálculos incorretos
   */
  async atualizarAnalytics(vendas: VendaParaAnalytics[]): Promise<void> {
    if (vendas.length === 0) {
      return;
    }

    this.logger.log(`Atualizando analytics para ${vendas.length} vendas`);

    // Agrupar vendas por chave de analytics
    const analyticsMap = new Map<
      string,
      {
        ano: number;
        mes: number;
        nomeFantasia: string;
        marca: string;
        grupo: string;
        subgrupo: string;
        uf: string;
        totalValor: number;
        totalQuantidade: number;
      }
    >();

    vendas.forEach((venda) => {
      const data = new Date(venda.dataVenda);
      const ano = data.getFullYear();
      const mes = data.getMonth() + 1; // 1-12
      const nomeFantasia = venda.nomeFantasia || 'DESCONHECIDO';
      const marca = venda.marca || 'DESCONHECIDA';
      const grupo = venda.grupo || 'DESCONHECIDO';
      const subgrupo = venda.subgrupo || 'DESCONHECIDO';
      const uf = venda.ufDestino || 'DESCONHECIDO';

      // Criar chave única para agrupamento
      // Incluindo grupo e subgrupo para evitar agrupamento incorreto
      const key = `${ano}_${mes}_${nomeFantasia}_${marca}_${grupo}_${subgrupo}_${uf}`;

      if (!analyticsMap.has(key)) {
        analyticsMap.set(key, {
          ano,
          mes,
          nomeFantasia,
          marca,
          grupo,
          subgrupo,
          uf,
          totalValor: 0,
          totalQuantidade: 0,
        });
      }

      const analytics = analyticsMap.get(key)!;
      analytics.totalValor += parseFloat(venda.valorTotal.toString());
      analytics.totalQuantidade += parseFloat(venda.quantidade.toString());
    });

    this.logger.log(`Agrupadas ${analyticsMap.size} entradas de analytics`);

    // Processar cada entrada de analytics
    const promises = Array.from(analyticsMap.values()).map((analytics) =>
      this.upsertAnalytics(analytics),
    );

    await Promise.all(promises);

    this.logger.log(`Analytics atualizado com sucesso`);
  }

  /**
   * Faz UPSERT de uma entrada de analytics usando SQL ON CONFLICT para evitar race conditions
   */
  private async upsertAnalytics(analytics: {
    ano: number;
    mes: number;
    nomeFantasia: string;
    marca: string;
    grupo: string;
    subgrupo: string;
    uf: string;
    totalValor: number;
    totalQuantidade: number;
  }): Promise<void> {
    try {
      // Usar SQL raw com ON CONFLICT para fazer upsert atômico
      // Isso evita race conditions quando múltiplas requisições processam em paralelo
      // O id é gerado usando gen_random_uuid() (PostgreSQL 13+)
      // IMPORTANTE: Se houver constraint antigo (sem grupo/subgrupo), ele será tratado no catch
      try {
        await this.prisma.$executeRaw`
          INSERT INTO "VendaAnalytics" (
            "id", "ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf", 
            "totalValor", "totalQuantidade", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(),
            ${analytics.ano}::integer,
            ${analytics.mes}::integer,
            ${analytics.nomeFantasia}::text,
            ${analytics.marca}::text,
            ${analytics.grupo}::text,
            ${analytics.subgrupo}::text,
            ${analytics.uf}::text,
            ${analytics.totalValor}::decimal,
            ${analytics.totalQuantidade}::decimal,
            NOW(),
            NOW()
          )
          ON CONFLICT ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf")
          DO UPDATE SET
            "totalValor" = "VendaAnalytics"."totalValor" + ${analytics.totalValor}::decimal,
            "totalQuantidade" = "VendaAnalytics"."totalQuantidade" + ${analytics.totalQuantidade}::decimal,
            "updatedAt" = NOW()
        `;
      } catch (conflictError: any) {
        // Se falhar por constraint antigo (sem grupo/subgrupo), buscar e consolidar registros
        if (
          conflictError?.code === '23505' &&
          conflictError?.message?.includes('already exists') &&
          conflictError?.message?.includes('ano, mes, "nomeFantasia", marca, uf')
        ) {
          // Constraint antigo detectado - buscar TODOS os registros existentes (pode haver múltiplos)
          const registrosExistentes = await this.prisma.vendaAnalytics.findMany({
            where: {
              ano: analytics.ano,
              mes: analytics.mes,
              nomeFantasia: analytics.nomeFantasia,
              marca: analytics.marca,
              uf: analytics.uf,
              // Não filtrar por grupo/subgrupo (constraint antigo)
            },
          });

          if (registrosExistentes.length > 0) {
            // Consolidar todos os registros existentes + novo valor
            let totalValorConsolidado = analytics.totalValor;
            let totalQuantidadeConsolidado = analytics.totalQuantidade;
            
            for (const reg of registrosExistentes) {
              totalValorConsolidado += parseFloat(reg.totalValor.toString());
              totalQuantidadeConsolidado += parseFloat(reg.totalQuantidade.toString());
            }

            // Usar o primeiro registro como base e atualizar
            const primeiroRegistro = registrosExistentes[0];
            const outrosRegistros = registrosExistentes.slice(1);

            // Atualizar o primeiro registro com valores consolidados e novo grupo/subgrupo
            await this.prisma.vendaAnalytics.update({
              where: { id: primeiroRegistro.id },
              data: {
                grupo: analytics.grupo,
                subgrupo: analytics.subgrupo,
                totalValor: new Decimal(totalValorConsolidado.toString()),
                totalQuantidade: new Decimal(totalQuantidadeConsolidado.toString()),
              },
            });

            // Deletar outros registros duplicados se houver
            if (outrosRegistros.length > 0) {
              await this.prisma.vendaAnalytics.deleteMany({
                where: {
                  id: { in: outrosRegistros.map((r) => r.id) },
                },
              });
            }

            this.logger.warn(
              `Constraint antigo detectado. Consolidados ${registrosExistentes.length} registro(s) existente(s) com novo grupo/subgrupo: ${analytics.grupo}/${analytics.subgrupo}`,
            );
          } else {
            // Se não encontrou, pode ser outro tipo de conflito - relançar erro
            throw conflictError;
          }
        } else {
          // Outro tipo de erro - relançar
          throw conflictError;
        }
      }
    } catch (error: any) {
      // Se falhar, logar o erro mas não interromper a importação
      // O SQL ON CONFLICT deve resolver a maioria dos casos de race condition
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Erro ao fazer upsert de analytics: ${errorMessage}. Dados: ${JSON.stringify(analytics)}`,
        errorStack,
      );
      // Não lançar erro para não interromper a importação
      // O analytics pode ser recalculado depois se necessário
    }
  }

  /**
   * Busca analytics com filtros
   */
  async buscarAnalytics(filtros: {
    ano?: number;
    mes?: number;
    nomeFantasia?: string;
    marca?: string;
    grupo?: string;
    subgrupo?: string;
    uf?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const where: {
      ano?: number | { gte?: number; lte?: number };
      mes?: number;
      nomeFantasia?: { contains: string; mode: 'insensitive' };
      marca?: { contains: string; mode: 'insensitive' };
      grupo?: { contains: string; mode: 'insensitive' };
      subgrupo?: { contains: string; mode: 'insensitive' };
      uf?: string;
    } = {};

    if (filtros.ano) {
      where.ano = filtros.ano;
    }

    if (filtros.mes) {
      where.mes = filtros.mes;
    }

    if (filtros.nomeFantasia) {
      where.nomeFantasia = {
        contains: filtros.nomeFantasia,
        mode: 'insensitive',
      };
    }

    if (filtros.marca) {
      where.marca = {
        contains: filtros.marca,
        mode: 'insensitive',
      };
    }

    if (filtros.grupo) {
      where.grupo = {
        contains: filtros.grupo,
        mode: 'insensitive',
      };
    }

    if (filtros.subgrupo) {
      where.subgrupo = {
        contains: filtros.subgrupo,
        mode: 'insensitive',
      };
    }

    if (filtros.uf) {
      where.uf = filtros.uf;
    }

    // Filtros de data (usando ano e mês)
    if (filtros.dataInicio || filtros.dataFim) {
      if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio);
        where.ano = { gte: inicio.getFullYear() };
      }
      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        const anoAtual = where.ano;
        where.ano =
          typeof anoAtual === 'object' && 'gte' in (anoAtual || {})
            ? { ...anoAtual, lte: fim.getFullYear() }
            : { lte: fim.getFullYear() };
      }
    }

    return this.prisma.vendaAnalytics.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { nomeFantasia: 'asc' }],
    });
  }

  /**
   * Recalcula analytics a partir das vendas (útil para correção)
   */
  async recalculcarAnalytics(dataInicio?: Date, dataFim?: Date): Promise<void> {
    this.logger.log('Iniciando recálculo de analytics');

    const where: {
      dataVenda?: { gte?: Date; lte?: Date };
    } = {};
    if (dataInicio || dataFim) {
      where.dataVenda = {};
      if (dataInicio) {
        where.dataVenda.gte = dataInicio;
      }
      if (dataFim) {
        where.dataVenda.lte = dataFim;
      }
    }

    // Buscar todas as vendas
    const vendas = await this.prisma.venda.findMany({
      where,
      select: {
        dataVenda: true,
        nomeFantasia: true,
        marca: true,
        grupo: true,
        subgrupo: true,
        ufDestino: true,
        valorTotal: true,
        quantidade: true,
      },
    });

    this.logger.log(`Recalculando analytics para ${vendas.length} vendas`);

    // Limpar analytics existentes no período
    if (dataInicio || dataFim) {
      // Se há filtro de data, limpar apenas o período
      const anos = new Set(
        vendas.map((v) => new Date(v.dataVenda).getFullYear()),
      );
      const meses = new Set(
        vendas.map((v) => new Date(v.dataVenda).getMonth() + 1),
      );

      await this.prisma.vendaAnalytics.deleteMany({
        where: {
          ano: { in: Array.from(anos) },
          mes: { in: Array.from(meses) },
        },
      });
    } else {
      // Limpar tudo
      await this.prisma.vendaAnalytics.deleteMany({});
    }

    // Recalcular - converter null para undefined para compatibilidade com a interface
    // Nota: marca é tratado como opcional na interface mas sempre terá valor padrão no processamento
    const vendasParaAnalytics: VendaParaAnalytics[] = vendas.map((v) => ({
      dataVenda: v.dataVenda,
      nomeFantasia: v.nomeFantasia ?? undefined,
      marca: v.marca ?? undefined, // Será tratado como 'DESCONHECIDA' no processamento
      grupo: v.grupo ?? undefined,
      subgrupo: v.subgrupo ?? undefined,
      ufDestino: v.ufDestino ?? undefined,
      valorTotal: v.valorTotal,
      quantidade: v.quantidade,
    }));

    await this.atualizarAnalytics(vendasParaAnalytics);

    this.logger.log('Recálculo de analytics concluído');
  }
}
