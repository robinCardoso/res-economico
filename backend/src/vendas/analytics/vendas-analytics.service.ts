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
      const key = `${ano}_${mes}_${nomeFantasia}_${marca}_${uf}`;

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
   * Faz UPSERT de uma entrada de analytics
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
      // Buscar registro existente
      const existente = await this.prisma.vendaAnalytics.findFirst({
        where: {
          ano: analytics.ano,
          mes: analytics.mes,
          nomeFantasia: analytics.nomeFantasia,
          marca: analytics.marca,
          uf: analytics.uf,
        },
      });

      if (existente) {
        // Atualizar registro existente (somar valores)
        await this.prisma.vendaAnalytics.update({
          where: { id: existente.id },
          data: {
            grupo: analytics.grupo,
            subgrupo: analytics.subgrupo,
            totalValor: new Decimal(
              (
                parseFloat(existente.totalValor.toString()) +
                analytics.totalValor
              ).toString(),
            ),
            totalQuantidade: new Decimal(
              (
                parseFloat(existente.totalQuantidade.toString()) +
                analytics.totalQuantidade
              ).toString(),
            ),
          },
        });
      } else {
        // Criar novo registro
        await this.prisma.vendaAnalytics.create({
          data: {
            ano: analytics.ano,
            mes: analytics.mes,
            nomeFantasia: analytics.nomeFantasia,
            marca: analytics.marca,
            grupo: analytics.grupo,
            subgrupo: analytics.subgrupo,
            uf: analytics.uf,
            totalValor: new Decimal(analytics.totalValor.toString()),
            totalQuantidade: new Decimal(analytics.totalQuantidade.toString()),
          },
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Erro ao atualizar analytics: ${errorMessage}`,
        errorStack,
      );
      // Não lançar erro para não interromper a importação
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
