import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  FiltrosPerfilClienteDto,
  SegmentacaoCliente,
  SegmentoCliente,
} from './dto/cliente-perfil-analytics.dto';

/**
 * Service para segmentação de clientes usando análise RFM
 * RFM = Recency (Recência), Frequency (Frequência), Monetary (Valor Monetário)
 */
@Injectable()
export class ClienteSegmentacaoService {
  private readonly logger = new Logger(ClienteSegmentacaoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Segmenta todos os clientes usando RFM
   */
  async segmentarClientes(
    filtros: FiltrosPerfilClienteDto = {},
  ): Promise<SegmentacaoCliente[]> {
    this.logger.log('Segmentando clientes com análise RFM...');

    const vendas = await this.buscarVendasClientes(filtros);
    const hoje = new Date();

    // Agrupar por cliente
    const dadosPorCliente = new Map<string, any>();

    for (const venda of vendas) {
      const chave = this.gerarChaveCliente(
        venda.nomeFantasia,
        venda.empresaId ?? undefined,
      );

      if (!dadosPorCliente.has(chave)) {
        dadosPorCliente.set(chave, {
          nomeFantasia: venda.nomeFantasia,
          empresaId: venda.empresaId,
          vendas: [],
          ultimaCompra: new Date(venda.ano, venda.mes - 1),
          valorTotal: 0,
        });
      }

      const dados = dadosPorCliente.get(chave);
      dados.vendas.push(venda);
      dados.valorTotal += Number(venda.totalValor || 0);

      // Atualizar última compra
      const dataVenda = new Date(venda.ano, venda.mes - 1);
      if (dataVenda > dados.ultimaCompra) {
        dados.ultimaCompra = dataVenda;
      }
    }

    // Calcular métricas RFM
    const metricasRFM: Array<{
      nomeFantasia: string;
      empresaId?: string;
      recencia: number;
      frequencia: number;
      valorMonetario: number;
    }> = [];

    for (const [, dados] of dadosPorCliente) {
      // Recência: dias desde a última compra
      const recencia = Math.floor(
        (hoje.getTime() - dados.ultimaCompra.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Frequência: número de meses com compras
      const mesesUnicos = new Set(
        dados.vendas.map((v) => `${v.ano}-${v.mes}`),
      );
      const frequencia = mesesUnicos.size;

      // Valor Monetário: total gasto
      const valorMonetario = dados.valorTotal;

      metricasRFM.push({
        nomeFantasia: dados.nomeFantasia,
        empresaId: dados.empresaId,
        recencia,
        frequencia,
        valorMonetario,
      });
    }

    // Calcular scores RFM (1-5)
    const segmentacoes = this.calcularScoresRFM(metricasRFM);

    this.logger.log(`${segmentacoes.length} clientes segmentados`);

    return segmentacoes;
  }

  /**
   * Calcula scores RFM para cada cliente
   */
  private calcularScoresRFM(
    metricasRFM: Array<{
      nomeFantasia: string;
      empresaId?: string;
      recencia: number;
      frequencia: number;
      valorMonetario: number;
    }>,
  ): SegmentacaoCliente[] {
    // Ordenar por cada métrica para calcular quartis
    const recencias = metricasRFM
      .map((m) => m.recencia)
      .sort((a, b) => a - b);
    const frequencias = metricasRFM
      .map((m) => m.frequencia)
      .sort((a, b) => b - a); // Maior é melhor
    const valores = metricasRFM
      .map((m) => m.valorMonetario)
      .sort((a, b) => b - a); // Maior é melhor

    // Calcular quintis (5 grupos)
    const quintilRecencia = this.calcularQuintis(recencias);
    const quintilFrequencia = this.calcularQuintis(frequencias);
    const quintilValor = this.calcularQuintis(valores);

    const segmentacoes: SegmentacaoCliente[] = [];

    for (const metrica of metricasRFM) {
      // Score de recência (menor é melhor, então invertemos)
      const scoreRecencia = 6 - this.obterScore(metrica.recencia, quintilRecencia);

      // Score de frequência (maior é melhor)
      const scoreFrequencia = this.obterScore(metrica.frequencia, quintilFrequencia);

      // Score de valor monetário (maior é melhor)
      const scoreMonetario = this.obterScore(metrica.valorMonetario, quintilValor);

      // Score RFM combinado (média ponderada)
      const scoreRFM = Math.round(
        (scoreRecencia * 0.3 + scoreFrequencia * 0.3 + scoreMonetario * 0.4),
      );

      // Determinar segmento
      const segmento = this.determinarSegmento(
        scoreRecencia,
        scoreFrequencia,
        scoreMonetario,
      );

      // Calcular potencial de crescimento
      const potencialCrescimento = this.calcularPotencialCrescimento(
        scoreRecencia,
        scoreFrequencia,
        scoreMonetario,
      );

      // Calcular risco de churn
      const { risco, probabilidade } = this.calcularRiscoChurn(
        metrica.recencia,
        scoreRecencia,
        scoreFrequencia,
      );

      // Estimar valor potencial
      const valorPotencial = this.estimarValorPotencial(
        metrica.valorMonetario,
        scoreFrequencia,
        potencialCrescimento,
      );

      segmentacoes.push({
        nomeFantasia: metrica.nomeFantasia,
        empresaId: metrica.empresaId,
        recencia: metrica.recencia,
        frequencia: metrica.frequencia,
        valorMonetario: metrica.valorMonetario,
        scoreRecencia,
        scoreFrequencia,
        scoreMonetario,
        scoreRFM,
        segmento,
        descricaoSegmento: this.obterDescricaoSegmento(segmento),
        potencialCrescimento,
        valorPotencial,
        riscoChurn: risco,
        probabilidadeChurn: probabilidade,
      });
    }

    return segmentacoes;
  }

  /**
   * Calcula quintis (5 grupos) para uma lista de valores
   */
  private calcularQuintis(valores: number[]): number[] {
    const n = valores.length;
    return [
      valores[Math.floor(n * 0.2)],
      valores[Math.floor(n * 0.4)],
      valores[Math.floor(n * 0.6)],
      valores[Math.floor(n * 0.8)],
    ];
  }

  /**
   * Obtém score (1-5) baseado nos quintis
   */
  private obterScore(valor: number, quintis: number[]): number {
    if (valor <= quintis[0]) return 1;
    if (valor <= quintis[1]) return 2;
    if (valor <= quintis[2]) return 3;
    if (valor <= quintis[3]) return 4;
    return 5;
  }

  /**
   * Determina segmento do cliente baseado nos scores RFM
   */
  private determinarSegmento(
    scoreRecencia: number,
    scoreFrequencia: number,
    scoreMonetario: number,
  ): SegmentoCliente {
    // Campeões: Alta recência, frequência e valor
    if (
      scoreRecencia >= 4 &&
      scoreFrequencia >= 4 &&
      scoreMonetario >= 4
    ) {
      return 'campeoes';
    }

    // Fiéis: Alta frequência
    if (scoreFrequencia >= 4 && scoreRecencia >= 3) {
      return 'fieis';
    }

    // Grandes gastadores: Alto valor
    if (scoreMonetario >= 4 && scoreRecencia >= 3) {
      return 'grandes_gastadores';
    }

    // Promissores: Recentes, baixa frequência
    if (scoreRecencia >= 4 && scoreFrequencia <= 2) {
      return 'promissores';
    }

    // Em risco: Gastavam muito, não compram recentemente
    if (
      scoreRecencia <= 2 &&
      (scoreFrequencia >= 3 || scoreMonetario >= 3)
    ) {
      return 'em_risco';
    }

    // Perdidos: Última compra há muito tempo
    if (scoreRecencia === 1) {
      return 'perdidos';
    }

    // Necessitam atenção: Recência média caindo
    if (scoreRecencia === 2 || scoreRecencia === 3) {
      return 'necessitam_atencao';
    }

    // Hibernando: Baixa frequência, última compra antiga
    return 'hibernando';
  }

  /**
   * Obtém descrição do segmento
   */
  private obterDescricaoSegmento(segmento: SegmentoCliente): string {
    const descricoes: Record<SegmentoCliente, string> = {
      campeoes:
        'Clientes VIP: Compram frequentemente, recentemente e gastam muito',
      fieis: 'Clientes fiéis: Compram com alta frequência',
      grandes_gastadores: 'Grandes gastadores: Alto valor de compra',
      promissores:
        'Clientes promissores: Novos clientes com potencial de crescimento',
      necessitam_atencao:
        'Necessitam atenção: Recência moderada, podem estar perdendo interesse',
      em_risco:
        'Em risco: Clientes valiosos que não compram há algum tempo',
      perdidos: 'Perdidos: Última compra há muito tempo, alto risco de churn',
      hibernando:
        'Hibernando: Baixa frequência e última compra antiga',
    };

    return descricoes[segmento];
  }

  /**
   * Calcula potencial de crescimento
   */
  private calcularPotencialCrescimento(
    scoreRecencia: number,
    scoreFrequencia: number,
    scoreMonetario: number,
  ): 'alto' | 'medio' | 'baixo' {
    // Alto potencial: Boa recência, mas frequência ou valor baixo
    if (scoreRecencia >= 4 && (scoreFrequencia <= 3 || scoreMonetario <= 3)) {
      return 'alto';
    }

    // Médio potencial: Scores medianos
    if (
      scoreRecencia >= 3 &&
      scoreFrequencia >= 2 &&
      scoreMonetario >= 2
    ) {
      return 'medio';
    }

    // Baixo potencial: Scores baixos
    return 'baixo';
  }

  /**
   * Calcula risco de churn
   */
  private calcularRiscoChurn(
    diasRecencia: number,
    scoreRecencia: number,
    scoreFrequencia: number,
  ): { risco: 'alto' | 'medio' | 'baixo'; probabilidade: number } {
    // Alto risco: Não compra há muito tempo
    if (scoreRecencia <= 2) {
      const probabilidade = Math.min(
        90,
        50 + (diasRecencia / 30) * 10, // +10% a cada 30 dias
      );
      return { risco: 'alto', probabilidade };
    }

    // Médio risco: Recência moderada e baixa frequência
    if (scoreRecencia === 3 || scoreFrequencia <= 2) {
      const probabilidade = Math.min(50, 20 + (diasRecencia / 30) * 5);
      return { risco: 'medio', probabilidade };
    }

    // Baixo risco: Compra recentemente e com frequência
    const probabilidade = Math.max(5, 20 - scoreRecencia * 3);
    return { risco: 'baixo', probabilidade };
  }

  /**
   * Estima valor potencial (receita adicional estimada)
   */
  private estimarValorPotencial(
    valorAtual: number,
    scoreFrequencia: number,
    potencial: 'alto' | 'medio' | 'baixo',
  ): number {
    let multiplicador = 1;

    if (potencial === 'alto') {
      multiplicador = 1.5; // 50% de crescimento potencial
    } else if (potencial === 'medio') {
      multiplicador = 1.2; // 20% de crescimento potencial
    } else {
      multiplicador = 1.1; // 10% de crescimento potencial
    }

    // Ajustar pelo score de frequência
    const ajusteFrequencia = 1 + (scoreFrequencia / 10);

    return valorAtual * multiplicador * ajusteFrequencia - valorAtual;
  }

  /**
   * Busca vendas dos clientes
   */
  private async buscarVendasClientes(filtros: FiltrosPerfilClienteDto) {
    const where: any = {};

    // Filtros temporais - padrão: ano atual
    const anoAtual = new Date().getFullYear();
    if (filtros.ano && filtros.ano.length > 0) {
      where.ano = { in: filtros.ano };
    } else {
      // Se nenhum ano foi especificado, usa apenas o ano atual
      where.ano = anoAtual;
    }
    
    if (filtros.mes && filtros.mes.length > 0) {
      where.mes = { in: filtros.mes };
    }
    if (filtros.nomeFantasia && filtros.nomeFantasia.length > 0) {
      where.nomeFantasia = { in: filtros.nomeFantasia };
    }
    if (filtros.empresaId && filtros.empresaId.length > 0) {
      where.empresaId = { in: filtros.empresaId };
    }
    if (filtros.uf && filtros.uf.length > 0) {
      where.uf = { in: filtros.uf };
    }

    return this.prisma.vendaAnalytics.findMany({
      where,
      select: {
        nomeFantasia: true,
        empresaId: true,
        ano: true,
        mes: true,
        totalValor: true,
      },
    });
  }

  /**
   * Gera chave única para identificar cliente
   */
  private gerarChaveCliente(nomeFantasia: string, empresaId?: string): string {
    return `${nomeFantasia}|${empresaId || ''}`;
  }
}
