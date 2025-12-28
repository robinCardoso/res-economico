import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  FiltrosPerfilClienteDto,
  MetricasFinanceirasCliente,
  ReceitaMensalCliente,
  ReceitaTrimestralCliente,
  ReceitaAnualCliente,
} from './dto/cliente-perfil-analytics.dto';

/**
 * Service para análise de métricas financeiras de clientes
 * Calcula receita média, LTV, tendências e outras métricas financeiras
 */
@Injectable()
export class ClienteMetricasFinanceirasService {
  private readonly logger = new Logger(ClienteMetricasFinanceirasService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calcula métricas financeiras completas para todos os clientes
   */
  async calcularMetricasFinanceiras(
    filtros: FiltrosPerfilClienteDto = {},
  ): Promise<MetricasFinanceirasCliente[]> {
    this.logger.log('Calculando métricas financeiras de clientes...');

    // Buscar dados agregados de vendas
    const vendas = await this.buscarVendasClientes(filtros);

    // Agrupar por cliente
    const metricasPorCliente = new Map<string, any>();

    for (const venda of vendas) {
      const chave = this.gerarChaveCliente(
        venda.nomeFantasia,
        venda.empresaId ?? undefined,
        venda.uf ?? undefined,
      );

      if (!metricasPorCliente.has(chave)) {
        metricasPorCliente.set(chave, {
          nomeFantasia: venda.nomeFantasia,
          empresaId: venda.empresaId,
          uf: venda.uf,
          vendas: [],
        });
      }

      metricasPorCliente.get(chave).vendas.push(venda);
    }

    // Calcular métricas para cada cliente
    const metricas: MetricasFinanceirasCliente[] = [];

    for (const [, dados] of metricasPorCliente) {
      const metrica = await this.calcularMetricasCliente(dados);
      metricas.push(metrica);
    }

    // Ordenar por receita total (maior para menor)
    metricas.sort((a, b) => b.receitaTotal - a.receitaTotal);

    this.logger.log(`Métricas calculadas para ${metricas.length} clientes`);

    return metricas;
  }

  /**
   * Calcula métricas financeiras para um cliente específico
   */
  async calcularMetricasCliente(
    dados: any,
  ): Promise<MetricasFinanceirasCliente> {
    const vendas = dados.vendas;

    // Receita total
    const receitaTotal = vendas.reduce(
      (sum, v) => sum + Number(v.totalValor || 0),
      0,
    );

    // Quantidade total de compras
    const quantidadeCompras = vendas.reduce(
      (sum, v) => sum + Number(v.totalQuantidade || 0),
      0,
    );

    // Datas - Buscar primeira e última compra EXATAS da tabela Venda
    const nomeFantasiaCliente = dados.nomeFantasia;
    const vendasReais = await this.prisma.venda.findMany({
      where: {
        nomeFantasia: nomeFantasiaCliente,
        ...(dados.empresaId ? { empresaId: dados.empresaId } : {}),
      },
      select: {
        dataVenda: true,
      },
      orderBy: {
        dataVenda: 'asc',
      },
    });

    let primeiraCompra: Date;
    let ultimaCompra: Date;

    if (vendasReais && vendasReais.length > 0) {
      // Usar datas EXATAS das vendas reais
      primeiraCompra = new Date(vendasReais[0].dataVenda);
      ultimaCompra = new Date(vendasReais[vendasReais.length - 1].dataVenda);
    } else {
      // Fallback: usar primeiro e último dia dos meses (se não houver vendas reais)
      const datasCompra = vendas.map((v) => ({
        inicio: new Date(v.ano, v.mes - 1, 1),
        fim: new Date(v.ano, v.mes, 0),
      }));
      primeiraCompra = new Date(
        Math.min(...datasCompra.map((d) => d.inicio.getTime())),
      );
      ultimaCompra = new Date(
        Math.max(...datasCompra.map((d) => d.fim.getTime())),
      );
    }

    // Meses ativo
    const mesesAtivo = this.calcularMesesAtivo(primeiraCompra, ultimaCompra);

    // Receita média
    const receitaMedia =
      quantidadeCompras > 0 ? receitaTotal / quantidadeCompras : 0;
    const receitaMediaMensal = mesesAtivo > 0 ? receitaTotal / mesesAtivo : 0;
    const receitaMediaAnual = receitaMediaMensal * 12;

    // Ticket médio
    const ticketMedio = vendas.length > 0 ? receitaTotal / vendas.length : 0;

    // Frequência de compra (compras por mês)
    const frequenciaCompra = mesesAtivo > 0 ? vendas.length / mesesAtivo : 0;

    // Customer Lifetime Value (LTV)
    const lifetimeValue = receitaTotal;
    const lifetimeValueProjetado = this.calcularLTVProjetado(
      receitaMediaMensal,
      frequenciaCompra,
    );

    // Tendências
    const { tendencia, crescimento } = this.calcularTendenciaReceita(vendas);

    // Receita mensal
    const receitaMensal = this.agruparReceitaMensal(vendas);

    // Receita trimestral
    const receitaTrimestral = this.agruparReceitaTrimestral(vendas);

    // Receita anual
    const receitaAnual = this.agruparReceitaAnual(vendas);

    return {
      nomeFantasia: dados.nomeFantasia,
      empresaId: dados.empresaId,
      uf: dados.uf,
      receitaTotal,
      receitaMedia,
      receitaMediaMensal,
      receitaMediaAnual,
      ticketMedio,
      lifetimeValue,
      lifetimeValueProjetado,
      tendenciaReceita: tendencia,
      crescimentoPercentual: crescimento,
      primeiraCompra,
      ultimaCompra,
      mesesAtivo,
      frequenciaCompra,
      receitaMensal,
      receitaTrimestral,
      receitaAnual,
    };
  }

  /**
   * Busca vendas agregadas dos clientes
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

    // Filtros de cliente
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
      orderBy: [{ ano: 'asc' }, { mes: 'asc' }],
    });
  }

  /**
   * Gera chave única para identificar cliente
   */
  private gerarChaveCliente(
    nomeFantasia: string,
    empresaId?: string,
    uf?: string,
  ): string {
    return `${nomeFantasia}|${empresaId || ''}|${uf || ''}`;
  }

  /**
   * Calcula quantidade de meses entre duas datas
   */
  private calcularMesesAtivo(inicio: Date, fim: Date): number {
    const meses =
      (fim.getFullYear() - inicio.getFullYear()) * 12 +
      (fim.getMonth() - inicio.getMonth()) +
      1;
    return Math.max(1, meses);
  }

  /**
   * Calcula LTV projetado para 12 meses
   */
  private calcularLTVProjetado(
    receitaMediaMensal: number,
    frequenciaCompra: number,
  ): number {
    // LTV projetado = receita média mensal * 12 meses
    // Ajustado pela frequência de compra (quanto mais frequente, maior o LTV)
    const fatorFrequencia = Math.min(frequenciaCompra * 1.2, 2); // Limitado a 2x
    return receitaMediaMensal * 12 * fatorFrequencia;
  }

  /**
   * Calcula tendência de receita (crescente, estável, decrescente)
   */
  private calcularTendenciaReceita(vendas: any[]): {
    tendencia: 'crescente' | 'estavel' | 'decrescente';
    crescimento: number;
  } {
    if (vendas.length < 2) {
      return { tendencia: 'estavel', crescimento: 0 };
    }

    // Ordenar por data
    const vendasOrdenadas = [...vendas].sort((a, b) => {
      const dataA = a.ano * 12 + a.mes;
      const dataB = b.ano * 12 + b.mes;
      return dataA - dataB;
    });

    // Dividir em duas metades
    const meio = Math.floor(vendasOrdenadas.length / 2);
    const primeiraMetade = vendasOrdenadas.slice(0, meio);
    const segundaMetade = vendasOrdenadas.slice(meio);

    // Somar receita de cada metade
    const receitaPrimeiraMetade = primeiraMetade.reduce(
      (sum, v) => sum + Number(v.totalValor || 0),
      0,
    );
    const receitaSegundaMetade = segundaMetade.reduce(
      (sum, v) => sum + Number(v.totalValor || 0),
      0,
    );

    // Calcular crescimento percentual
    const crescimento =
      receitaPrimeiraMetade > 0
        ? ((receitaSegundaMetade - receitaPrimeiraMetade) /
            receitaPrimeiraMetade) *
          100
        : 0;

    // Definir tendência
    let tendencia: 'crescente' | 'estavel' | 'decrescente';
    if (crescimento > 5) {
      tendencia = 'crescente';
    } else if (crescimento < -5) {
      tendencia = 'decrescente';
    } else {
      tendencia = 'estavel';
    }

    return { tendencia, crescimento };
  }

  /**
   * Agrupa receita por mês
   */
  private agruparReceitaMensal(vendas: any[]): ReceitaMensalCliente[] {
    const porMes = new Map<string, any>();

    for (const venda of vendas) {
      const chave = `${venda.ano}-${venda.mes}`;

      if (!porMes.has(chave)) {
        porMes.set(chave, {
          ano: venda.ano,
          mes: venda.mes,
          receita: 0,
          quantidadeCompras: 0,
        });
      }

      const dados = porMes.get(chave);
      dados.receita += Number(venda.totalValor || 0);
      dados.quantidadeCompras += Number(venda.totalQuantidade || 0);
    }

    const resultado: ReceitaMensalCliente[] = [];
    for (const [, dados] of porMes) {
      resultado.push({
        ano: dados.ano,
        mes: dados.mes,
        receita: dados.receita,
        quantidadeCompras: dados.quantidadeCompras,
        ticketMedio:
          dados.quantidadeCompras > 0
            ? dados.receita / dados.quantidadeCompras
            : 0,
      });
    }

    // Ordenar por data
    resultado.sort((a, b) => {
      const dataA = a.ano * 12 + a.mes;
      const dataB = b.ano * 12 + b.mes;
      return dataA - dataB;
    });

    return resultado;
  }

  /**
   * Agrupa receita por trimestre
   */
  private agruparReceitaTrimestral(vendas: any[]): ReceitaTrimestralCliente[] {
    const porTrimestre = new Map<string, any>();

    for (const venda of vendas) {
      const trimestre = Math.ceil(venda.mes / 3);
      const chave = `${venda.ano}-T${trimestre}`;

      if (!porTrimestre.has(chave)) {
        porTrimestre.set(chave, {
          ano: venda.ano,
          trimestre,
          receita: 0,
          quantidadeCompras: 0,
        });
      }

      const dados = porTrimestre.get(chave);
      dados.receita += Number(venda.totalValor || 0);
      dados.quantidadeCompras += Number(venda.totalQuantidade || 0);
    }

    const resultado: ReceitaTrimestralCliente[] = [];
    for (const [, dados] of porTrimestre) {
      resultado.push({
        ano: dados.ano,
        trimestre: dados.trimestre,
        receita: dados.receita,
        quantidadeCompras: dados.quantidadeCompras,
        ticketMedio:
          dados.quantidadeCompras > 0
            ? dados.receita / dados.quantidadeCompras
            : 0,
      });
    }

    // Ordenar por data
    resultado.sort((a, b) => {
      const dataA = a.ano * 4 + a.trimestre;
      const dataB = b.ano * 4 + b.trimestre;
      return dataA - dataB;
    });

    return resultado;
  }

  /**
   * Agrupa receita por ano
   */
  private agruparReceitaAnual(vendas: any[]): ReceitaAnualCliente[] {
    const porAno = new Map<number, any>();

    for (const venda of vendas) {
      if (!porAno.has(venda.ano)) {
        porAno.set(venda.ano, {
          ano: venda.ano,
          receita: 0,
          quantidadeCompras: 0,
        });
      }

      const dados = porAno.get(venda.ano);
      dados.receita += Number(venda.totalValor || 0);
      dados.quantidadeCompras += Number(venda.totalQuantidade || 0);
    }

    const resultado: ReceitaAnualCliente[] = [];
    for (const [, dados] of porAno) {
      resultado.push({
        ano: dados.ano,
        receita: dados.receita,
        quantidadeCompras: dados.quantidadeCompras,
        ticketMedio:
          dados.quantidadeCompras > 0
            ? dados.receita / dados.quantidadeCompras
            : 0,
      });
    }

    // Ordenar por ano
    resultado.sort((a, b) => a.ano - b.ano);

    return resultado;
  }
}
