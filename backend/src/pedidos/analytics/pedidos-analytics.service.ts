import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';

interface PedidoParaAnalytics {
  dataPedido: Date;
  nomeFantasia?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  empresaId?: string;
  valorTotal: Decimal;
  quantidade: Decimal;
}

@Injectable()
export class PedidosAnalyticsService {
  private readonly logger = new Logger(PedidosAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Atualiza analytics para uma lista de pedidos
   * Agrupa por ano, mês, nomeFantasia, marca, grupo, subgrupo
   */
  async atualizarAnalytics(pedidos: PedidoParaAnalytics[]): Promise<void> {
    if (pedidos.length === 0) {
      return;
    }

    this.logger.log(`Atualizando analytics para ${pedidos.length} pedidos`);

    // Agrupar pedidos por chave de analytics
    const analyticsMap = new Map<
      string,
      {
        ano: number;
        mes: number;
        nomeFantasia: string;
        marca: string;
        grupo: string;
        subgrupo: string;
        empresaId: string | null;
        totalValor: number;
        totalQuantidade: number;
      }
    >();

    pedidos.forEach((pedido) => {
      // Garantir que a data seja tratada como UTC
      // Se pedido.dataPedido já for Date, usar diretamente, senão converter
      let data: Date;
      if (pedido.dataPedido instanceof Date) {
        data = pedido.dataPedido;
      } else {
        // Se for string, criar Date e garantir UTC
        data = new Date(pedido.dataPedido);
      }
      
      // Se a data for inválida, pular este pedido
      if (isNaN(data.getTime())) {
        this.logger.warn(`Data inválida para pedido: ${JSON.stringify(pedido)}`);
        return;
      }
      
      // Usar UTC para garantir consistência com o banco de dados
      const ano = data.getUTCFullYear();
      const mes = data.getUTCMonth() + 1; // 1-12 (getUTCMonth retorna 0-11)
      const nomeFantasia = pedido.nomeFantasia || 'DESCONHECIDO';
      const marca = pedido.marca || 'DESCONHECIDA';
      const grupo = pedido.grupo || 'DESCONHECIDO';
      const subgrupo = pedido.subgrupo || 'DESCONHECIDO';
      const empresaId = pedido.empresaId || null;

      // Criar chave única para agrupamento
      const key = `${ano}_${mes}_${nomeFantasia}_${marca}_${grupo}_${subgrupo}_${empresaId || 'NULL'}`;

      if (!analyticsMap.has(key)) {
        analyticsMap.set(key, {
          ano,
          mes,
          nomeFantasia,
          marca,
          grupo,
          subgrupo,
          empresaId,
          totalValor: 0,
          totalQuantidade: 0,
        });
      }

      const analytics = analyticsMap.get(key)!;
      analytics.totalValor += parseFloat(pedido.valorTotal.toString());
      analytics.totalQuantidade += parseFloat(pedido.quantidade.toString());
    });

    this.logger.log(`Agrupadas ${analyticsMap.size} entradas de analytics`);

    // Processar cada entrada de analytics em lotes para evitar esgotar o pool de conexões
    const analyticsArray = Array.from(analyticsMap.values());
    const BATCH_SIZE = 200; // Processar 200 por vez

    // Processar em lotes com tratamento de erro individual para não perder dados
    for (let i = 0; i < analyticsArray.length; i += BATCH_SIZE) {
      const batch = analyticsArray.slice(i, i + BATCH_SIZE);

      // Usar Promise.allSettled para garantir que erros em um item não parem o processamento
      const results = await Promise.allSettled(
        batch.map((analytics) => this.upsertAnalytics(analytics))
      );

      // Contar sucessos e erros para logging
      const sucessos = results.filter((r) => r.status === 'fulfilled').length;
      const erros = results.filter((r) => r.status === 'rejected').length;

      if (erros > 0) {
        this.logger.warn(
          `Lote de analytics: ${sucessos} sucessos, ${erros} erros (lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(analyticsArray.length / BATCH_SIZE)})`,
        );
        // Logar detalhes dos erros
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            this.logger.error(
              `Erro ao processar analytics ${i + index}: ${result.reason}`,
            );
          }
        });
      }
    }

    this.logger.log(`Analytics atualizado com sucesso: ${analyticsArray.length} entradas processadas`);
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
    empresaId: string | null;
    totalValor: number;
    totalQuantidade: number;
  }): Promise<void> {
    const MAX_RETRIES = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Usar SQL raw com ON CONFLICT para fazer upsert atômico
        // IMPORTANTE: Substituir valores em vez de somar para evitar duplicação
        // Quando um pedido é reimportado, os analytics devem refletir o valor mais recente
        await this.prisma.$executeRaw`
          INSERT INTO "PedidoAnalytics" (
            "id", "ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "empresaId",
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
            ${analytics.empresaId}::text,
            ${analytics.totalValor}::decimal,
            ${analytics.totalQuantidade}::decimal,
            NOW(),
            NOW()
          )
          ON CONFLICT ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "empresaId")
          DO UPDATE SET
            "totalValor" = EXCLUDED."totalValor",
            "totalQuantidade" = EXCLUDED."totalQuantidade",
            "updatedAt" = NOW()
        `;
        // Sucesso - sair do loop de retry
        return;
      } catch (error: unknown) {
        lastError = error;
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        const errorCode = (error as { code?: string })?.code;

        // Verificar se é um erro recuperável (timeout, conexão, etc)
        const isRetryableError =
          errorCode === 'P1001' || // Connection timeout
          errorCode === 'P1008' || // Operations timed out
          errorMessage.includes('timeout') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('pool');

        if (isRetryableError && attempt < MAX_RETRIES) {
          // Aguardar antes de tentar novamente (backoff exponencial)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          this.logger.warn(
            `Erro recuperável ao fazer upsert de analytics (tentativa ${attempt}/${MAX_RETRIES}): ${errorMessage}. Tentando novamente em ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Se não for erro recuperável ou esgotou tentativas, lançar erro
        if (attempt === MAX_RETRIES) {
          const errorStack =
            error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Erro ao fazer upsert de analytics após ${MAX_RETRIES} tentativas: ${errorMessage}. Dados: ${JSON.stringify(analytics)}`,
            errorStack,
          );
          throw error;
        }
      }
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

    // Filtros de data (usando ano e mês)
    if (filtros.dataInicio || filtros.dataFim) {
      if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio);
        where.ano = { gte: inicio.getUTCFullYear() };
      }
      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        const anoAtual = where.ano;
        where.ano =
          typeof anoAtual === 'object' && 'gte' in (anoAtual || {})
            ? { ...anoAtual, lte: fim.getUTCFullYear() }
            : { lte: fim.getUTCFullYear() };
      }
    }

    return this.prisma.pedidoAnalytics.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { nomeFantasia: 'asc' }],
    });
  }

  /**
   * Busca analytics com filtros múltiplos (arrays)
   * IMPORTANTE: Este método aceita arrays para permitir seleção múltipla de filtros
   */
  async buscarAnalyticsComFiltros(filtros: {
    ano?: number[];
    mes?: number[];
    nomeFantasia?: string[];
    marca?: string[];
    grupo?: string[];
    subgrupo?: string[];
    empresaId?: string[];
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const where: {
      ano?: number | { in?: number[]; gte?: number; lte?: number };
      mes?: { in: number[] };
      nomeFantasia?: { in: string[] };
      marca?: { in: string[] };
      grupo?: { in: string[] };
      subgrupo?: { in: string[] };
      empresaId?: { in: string[] };
    } = {};

    // Filtros múltiplos (arrays)
    if (filtros.ano && filtros.ano.length > 0) {
      where.ano = { in: filtros.ano };
    }

    if (filtros.mes && filtros.mes.length > 0) {
      where.mes = { in: filtros.mes };
    }

    if (filtros.nomeFantasia && filtros.nomeFantasia.length > 0) {
      where.nomeFantasia = { in: filtros.nomeFantasia };
    }

    if (filtros.marca && filtros.marca.length > 0) {
      where.marca = { in: filtros.marca };
    }

    if (filtros.grupo && filtros.grupo.length > 0) {
      where.grupo = { in: filtros.grupo };
    }

    if (filtros.subgrupo && filtros.subgrupo.length > 0) {
      where.subgrupo = { in: filtros.subgrupo };
    }

    if (filtros.empresaId && filtros.empresaId.length > 0) {
      where.empresaId = { in: filtros.empresaId };
    }

    // Filtros de data (usando ano e mês) - sobrescreve filtro de ano se fornecido
    if (filtros.dataInicio || filtros.dataFim) {
      if (filtros.dataInicio && filtros.dataFim) {
        const inicio = new Date(filtros.dataInicio);
        const fim = new Date(filtros.dataFim);
        where.ano = {
          gte: inicio.getUTCFullYear(),
          lte: fim.getUTCFullYear(),
        };
      } else if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio);
        where.ano = { ...((where.ano as object) || {}), gte: inicio.getUTCFullYear() } as { in?: number[]; gte?: number; lte?: number };
      } else if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        where.ano = { ...((where.ano as object) || {}), lte: fim.getUTCFullYear() } as { in?: number[]; gte?: number; lte?: number };
      }
    }

    return this.prisma.pedidoAnalytics.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { nomeFantasia: 'asc' }],
    });
  }

  // Status do recálculo em memória
  private recalculoStatus: {
    emAndamento: boolean;
    progresso: number;
    totalPedidos: number;
    pedidosProcessados: number;
    inicio?: Date;
    fim?: Date;
    erro?: string;
    etapa?: string;
    registrosDeletados?: number;
  } = {
    emAndamento: false,
    progresso: 0,
    totalPedidos: 0,
    pedidosProcessados: 0,
  };

  /**
   * Retorna o status atual do recálculo
   */
  getRecalculoStatus() {
    return {
      emAndamento: this.recalculoStatus.emAndamento,
      progresso: this.recalculoStatus.progresso,
      totalPedidos: this.recalculoStatus.totalPedidos,
      pedidosProcessados: this.recalculoStatus.pedidosProcessados,
      inicio: this.recalculoStatus.inicio
        ? this.recalculoStatus.inicio.toISOString()
        : undefined,
      fim: this.recalculoStatus.fim
        ? this.recalculoStatus.fim.toISOString()
        : undefined,
      erro: this.recalculoStatus.erro,
      etapa: this.recalculoStatus.etapa,
      registrosDeletados: this.recalculoStatus.registrosDeletados,
    };
  }

  /**
   * Recalcula analytics a partir dos pedidos (útil para correção)
   * Processa de forma assíncrona em lotes para melhor performance
   */
  async recalculcarAnalytics(dataInicio?: Date, dataFim?: Date): Promise<void> {
    // Se já está em andamento, não iniciar outro
    if (this.recalculoStatus.emAndamento) {
      throw new Error('Recálculo já está em andamento');
    }

    // Iniciar processamento assíncrono (não bloquear)
    this.processarRecalculoAsync(dataInicio, dataFim).catch((error) => {
      this.logger.error(`Erro no recálculo assíncrono: ${error}`, error.stack);
      this.recalculoStatus.erro = error.message;
      this.recalculoStatus.emAndamento = false;
    });

    // Retornar imediatamente
    return;
  }

  /**
   * Processa o recálculo de forma assíncrona em lotes
   */
  private async processarRecalculoAsync(
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<void> {
    this.recalculoStatus = {
      emAndamento: true,
      progresso: 0,
      totalPedidos: 0,
      pedidosProcessados: 0,
      inicio: new Date(),
      erro: undefined,
      etapa: 'iniciando',
      registrosDeletados: undefined,
    };

    try {
      this.logger.log('Iniciando recálculo de analytics');

      const where: {
        dataPedido?: { gte?: Date; lte?: Date };
      } = {};
      if (dataInicio || dataFim) {
        where.dataPedido = {};
        if (dataInicio) {
          where.dataPedido.gte = dataInicio;
        }
        if (dataFim) {
          where.dataPedido.lte = dataFim;
        }
      }

      // Contar total de pedidos
      const totalPedidos = await this.prisma.pedido.count({ where });
      this.recalculoStatus.totalPedidos = totalPedidos;

      this.logger.log(`Total de pedidos para recálculo: ${totalPedidos}`);

      if (totalPedidos === 0) {
        this.recalculoStatus.emAndamento = false;
        this.recalculoStatus.progresso = 100;
        this.recalculoStatus.etapa = 'concluido';
        this.recalculoStatus.fim = new Date();
        return;
      }

      // Limpar analytics do período
      this.recalculoStatus.etapa = 'limpeza';
      const registrosDeletados = await this.prisma.pedidoAnalytics.deleteMany({
        where: {
          ano: dataInicio || dataFim
            ? {
                gte: dataInicio ? new Date(dataInicio).getUTCFullYear() : undefined,
                lte: dataFim ? new Date(dataFim).getUTCFullYear() : undefined,
              }
            : undefined,
        },
      });
      this.recalculoStatus.registrosDeletados = registrosDeletados.count;
      this.logger.log(
        `${registrosDeletados.count} registros de analytics deletados`,
      );

      // Processar pedidos em lotes
      this.recalculoStatus.etapa = 'processamento';
      const BATCH_SIZE = 1000;
      let offset = 0;
      let pedidosProcessados = 0;

      while (offset < totalPedidos) {
        const pedidos = await this.prisma.pedido.findMany({
          where,
          take: BATCH_SIZE,
          skip: offset,
          select: {
            dataPedido: true,
            nomeFantasia: true,
            marca: true,
            grupo: true,
            subgrupo: true,
            empresaId: true,
            valorTotal: true,
            quantidade: true,
          },
        });

        if (pedidos.length === 0) {
          break;
        }

        // Converter para formato de analytics
        const pedidosParaAnalytics = pedidos.map((p) => ({
          dataPedido: p.dataPedido,
          nomeFantasia: p.nomeFantasia || undefined,
          marca: p.marca || 'DESCONHECIDA',
          grupo: p.grupo || 'DESCONHECIDO',
          subgrupo: p.subgrupo || 'DESCONHECIDO',
          empresaId: p.empresaId || undefined,
          valorTotal: p.valorTotal,
          quantidade: p.quantidade,
        }));

        // Atualizar analytics
        await this.atualizarAnalytics(pedidosParaAnalytics);

        pedidosProcessados += pedidos.length;
        offset += BATCH_SIZE;

        // Atualizar progresso
        const progresso = Math.round((pedidosProcessados / totalPedidos) * 100);
        this.recalculoStatus.progresso = progresso;
        this.recalculoStatus.pedidosProcessados = pedidosProcessados;

        this.logger.log(
          `Progresso do recálculo: ${progresso}% (${pedidosProcessados}/${totalPedidos})`,
        );
      }

      // Concluído
      this.recalculoStatus.emAndamento = false;
      this.recalculoStatus.progresso = 100;
      this.recalculoStatus.etapa = 'concluido';
      this.recalculoStatus.fim = new Date();

      this.logger.log('Recálculo de analytics concluído com sucesso');
    } catch (error) {
      this.recalculoStatus.emAndamento = false;
      this.recalculoStatus.erro =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro no recálculo de analytics:', error);
      throw error;
    }
  }

  /**
   * Buscar anos únicos da tabela PedidoAnalytics
   */
  async getAnos(): Promise<number[]> {
    const result = await this.prisma.$queryRaw<Array<{ ano: number }>>`
      SELECT DISTINCT "ano"
      FROM "PedidoAnalytics"
      WHERE "ano" IS NOT NULL
      ORDER BY "ano" ASC
    `;
    return result.map((row) => row.ano);
  }

  /**
   * Buscar meses únicos da tabela PedidoAnalytics
   */
  async getMeses(): Promise<number[]> {
    const result = await this.prisma.$queryRaw<Array<{ mes: number }>>`
      SELECT DISTINCT "mes"
      FROM "PedidoAnalytics"
      WHERE "mes" IS NOT NULL
      ORDER BY "mes" ASC
    `;
    return result.map((row) => row.mes);
  }

  /**
   * Construir cláusula WHERE para filtros múltiplos usando Prisma
   */
  private construirWherePrisma(
    filtros: FilterAnalyticsDto,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filtros.ano && Array.isArray(filtros.ano) && filtros.ano.length > 0) {
      where.ano = { in: filtros.ano };
    }

    if (filtros.mes && Array.isArray(filtros.mes) && filtros.mes.length > 0) {
      where.mes = { in: filtros.mes };
    }

    if (
      filtros.marca &&
      Array.isArray(filtros.marca) &&
      filtros.marca.length > 0
    ) {
      where.marca = { in: filtros.marca };
    }

    if (
      filtros.nomeFantasia &&
      Array.isArray(filtros.nomeFantasia) &&
      filtros.nomeFantasia.length > 0
    ) {
      where.nomeFantasia = { in: filtros.nomeFantasia };
    }

    if (
      filtros.grupo &&
      Array.isArray(filtros.grupo) &&
      filtros.grupo.length > 0
    ) {
      where.grupo = { in: filtros.grupo };
    }

    if (
      filtros.subgrupo &&
      Array.isArray(filtros.subgrupo) &&
      filtros.subgrupo.length > 0
    ) {
      where.subgrupo = { in: filtros.subgrupo };
    }

    if (
      filtros.empresaId &&
      Array.isArray(filtros.empresaId) &&
      filtros.empresaId.length > 0
    ) {
      where.empresaId = { in: filtros.empresaId };
    }

    return where;
  }

  /**
   * Análise 1: Crescimento Empresa Mês a Mês e Ano a Ano
   */
  async getCrescimentoEmpresa(filtros: FilterAnalyticsDto): Promise<{
    meses: Array<{
      mes: number;
      nomeMes: string;
      dados: {
        [ano: number]: { pedido: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { pedido: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
  }> {
    const where = this.construirWherePrisma(filtros);

    // Buscar dados agregados por mês e ano
    const resultados = await this.prisma.pedidoAnalytics.groupBy({
      by: ['ano', 'mes'],
      where,
      _sum: {
        totalValor: true,
      },
      orderBy: [{ ano: 'asc' }, { mes: 'asc' }],
    });

    // Organizar dados por mês e ano
    const mesesMap = new Map<number, { [ano: number]: number }>();
    const anosSet = new Set<number>();

    resultados.forEach((row) => {
      const mes = row.mes;
      const ano = row.ano;
      const pedido = parseFloat(
        (row._sum.totalValor || new Decimal(0)).toString(),
      );

      anosSet.add(ano);

      if (!mesesMap.has(mes)) {
        mesesMap.set(mes, {});
      }
      mesesMap.get(mes)![ano] = pedido;
    });

    // Calcular evoluções e organizar resposta
    const anosDisponiveis = Array.from(anosSet).sort();
    const mesesNomes = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const meses = Array.from(mesesMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([mes, dadosAno]) => {
        const dadosComEvolucao: {
          [ano: number]: { pedido: number; evolucao?: number | null };
        } = {};

        anosDisponiveis.forEach((ano) => {
          const pedido = dadosAno[ano] || 0;
          const anoAnterior = ano - 1;
          const pedidoAnterior = dadosAno[anoAnterior] || 0;

          dadosComEvolucao[ano] = {
            pedido,
            evolucao:
              pedidoAnterior > 0
                ? this.calcularEvolucao(pedido, pedidoAnterior)
                : null,
          };
        });

        return {
          mes,
          nomeMes: mesesNomes[mes - 1],
          dados: dadosComEvolucao,
        };
      });

    // Calcular total geral por ano
    const totalGeral: {
      [ano: number]: { pedido: number; evolucao?: number | null };
    } = {};

    anosDisponiveis.forEach((ano) => {
      const totalAno = meses.reduce(
        (sum, m) => sum + (m.dados[ano]?.pedido || 0),
        0,
      );
      const anoAnterior = ano - 1;
      const totalAnoAnterior = meses.reduce(
        (sum, m) => sum + (m.dados[anoAnterior]?.pedido || 0),
        0,
      );

      totalGeral[ano] = {
        pedido: totalAno,
        evolucao:
          totalAnoAnterior > 0
            ? this.calcularEvolucao(totalAno, totalAnoAnterior)
            : null,
      };
    });

    return {
      meses,
      totalGeral,
      anosDisponiveis,
    };
  }

  /**
   * Calcula a evolução percentual entre dois valores
   */
  private calcularEvolucao(valorAtual: number, valorAnterior: number): number {
    if (valorAnterior === 0) {
      return valorAtual > 0 ? 100 : 0;
    }
    return ((valorAtual - valorAnterior) / valorAnterior) * 100;
  }
}

