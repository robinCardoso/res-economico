import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { VendasAnalyticsService } from './vendas-analytics.service';

@Injectable()
export class VendasAnalyticsSyncService {
  private readonly logger = new Logger(VendasAnalyticsSyncService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: VendasAnalyticsService,
  ) {}

  /**
   * Valida se os dados de analytics estão sincronizados com as vendas
   * Compara totais agregados entre Venda e VendaAnalytics
   */
  async validarSincronizacao(opcoes?: {
    ano?: number;
    mes?: number;
    apenasErros?: boolean;
  }): Promise<{
    sincronizado: boolean;
    erros: Array<{
      ano: number;
      mes: number;
      nomeFantasia: string;
      marca: string;
      grupo: string | null;
      subgrupo: string | null;
      uf: string;
      totalVendas: number;
      totalAnalytics: number;
      diferenca: number;
    }>;
    resumo: {
      totalVerificados: number;
      totalErros: number;
      totalSincronizado: number;
    };
  }> {
    this.logger.log('Iniciando validação de sincronização...');

    const where: {
      ano?: number;
      mes?: number;
    } = {};

    if (opcoes?.ano) {
      where.ano = opcoes.ano;
    }
    if (opcoes?.mes) {
      where.mes = opcoes.mes;
    }

    // Buscar todos os analytics
    const analytics = await this.prisma.vendaAnalytics.findMany({
      where,
    });

    const erros: Array<{
      ano: number;
      mes: number;
      nomeFantasia: string;
      marca: string;
      grupo: string | null;
      subgrupo: string | null;
      uf: string;
      totalVendas: number;
      totalAnalytics: number;
      diferenca: number;
    }> = [];

    // Para cada entrada de analytics, verificar se os totais batem com as vendas
    for (const entry of analytics) {
      const dataInicio = new Date(entry.ano, entry.mes - 1, 1);
      const dataFim = new Date(entry.ano, entry.mes, 0, 23, 59, 59, 999);

      // Buscar vendas correspondentes
      const vendas = await this.prisma.venda.findMany({
        where: {
          dataVenda: {
            gte: dataInicio,
            lte: dataFim,
          },
          nomeFantasia: entry.nomeFantasia,
          marca: entry.marca,
          grupo: entry.grupo,
          subgrupo: entry.subgrupo,
          ufDestino: entry.uf,
        },
        select: {
          valorTotal: true,
          quantidade: true,
        },
      });

      // Calcular totais das vendas
      const totalValorVendas = vendas.reduce(
        (sum, v) => sum + parseFloat(v.valorTotal.toString()),
        0,
      );
      const totalQuantidadeVendas = vendas.reduce(
        (sum, v) => sum + parseFloat(v.quantidade.toString()),
        0,
      );

      // Comparar com analytics
      const totalValorAnalytics = parseFloat(entry.totalValor.toString());
      const totalQuantidadeAnalytics = parseFloat(
        entry.totalQuantidade.toString(),
      );

      const diferencaValor = Math.abs(totalValorVendas - totalValorAnalytics);
      const diferencaQuantidade = Math.abs(
        totalQuantidadeVendas - totalQuantidadeAnalytics,
      );

      // Tolerância de 0.01 para diferenças de arredondamento
      const tolerancia = 0.01;

      if (diferencaValor > tolerancia || diferencaQuantidade > tolerancia) {
        erros.push({
          ano: entry.ano,
          mes: entry.mes,
          nomeFantasia: entry.nomeFantasia,
          marca: entry.marca,
          grupo: entry.grupo,
          subgrupo: entry.subgrupo,
          uf: entry.uf,
          totalVendas: totalValorVendas,
          totalAnalytics: totalValorAnalytics,
          diferenca: diferencaValor,
        });
      }
    }

    const totalVerificados = analytics.length;
    const totalErros = erros.length;
    const totalSincronizado = totalVerificados - totalErros;

    this.logger.log(
      `Validação concluída: ${totalSincronizado}/${totalVerificados} sincronizados, ${totalErros} erros encontrados`,
    );

    return {
      sincronizado: totalErros === 0,
      erros: opcoes?.apenasErros ? erros : erros,
      resumo: {
        totalVerificados,
        totalErros,
        totalSincronizado,
      },
    };
  }

  /**
   * Corrige dados de analytics que estão dessincronizados
   */
  async corrigirSincronizacao(opcoes?: {
    ano?: number;
    mes?: number;
  }): Promise<{
    corrigidos: number;
    erros: number;
  }> {
    this.logger.log('Iniciando correção de sincronização...');

    const validacao = await this.validarSincronizacao({
      ...opcoes,
      apenasErros: true,
    });

    if (validacao.erros.length === 0) {
      this.logger.log('Nenhum erro encontrado. Analytics está sincronizado.');
      return {
        corrigidos: 0,
        erros: 0,
      };
    }

    // Recalcular analytics para os períodos com erros
    const periodosUnicos = new Set<string>();
    validacao.erros.forEach((erro) => {
      periodosUnicos.add(`${erro.ano}_${erro.mes}`);
    });

    let corrigidos = 0;
    let erros = 0;

    for (const periodo of periodosUnicos) {
      const [ano, mes] = periodo.split('_').map(Number);

      try {
        await this.analyticsService.recalculcarAnalytics(
          new Date(ano, mes - 1, 1),
          new Date(ano, mes, 0, 23, 59, 59, 999),
        );
        corrigidos++;
      } catch (error) {
        this.logger.error(
          `Erro ao corrigir analytics para ${mes}/${ano}:`,
          error,
        );
        erros++;
      }
    }

    this.logger.log(
      `Correção concluída: ${corrigidos} períodos corrigidos, ${erros} erros`,
    );

    return {
      corrigidos,
      erros,
    };
  }
}
