import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';

interface VendaParaAnalytics {
  dataVenda: Date;
  nomeFantasia?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  tipoOperacao?: string;
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
        tipoOperacao: string | null;
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
      const tipoOperacao = venda.tipoOperacao || null;
      const uf = venda.ufDestino || 'DESCONHECIDO';

      // Criar chave única para agrupamento
      // Incluindo grupo, subgrupo e tipoOperacao para evitar agrupamento incorreto
      const key = `${ano}_${mes}_${nomeFantasia}_${marca}_${grupo}_${subgrupo}_${tipoOperacao || 'NULL'}_${uf}`;

      if (!analyticsMap.has(key)) {
        analyticsMap.set(key, {
          ano,
          mes,
          nomeFantasia,
          marca,
          grupo,
          subgrupo,
          tipoOperacao,
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
    tipoOperacao: string | null;
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
            "id", "ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "tipoOperacao", "uf", 
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
            ${analytics.tipoOperacao}::text,
            ${analytics.uf}::text,
            ${analytics.totalValor}::decimal,
            ${analytics.totalQuantidade}::decimal,
            NOW(),
            NOW()
          )
          ON CONFLICT ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "tipoOperacao", "uf")
          DO UPDATE SET
            "totalValor" = "VendaAnalytics"."totalValor" + ${analytics.totalValor}::decimal,
            "totalQuantidade" = "VendaAnalytics"."totalQuantidade" + ${analytics.totalQuantidade}::decimal,
            "updatedAt" = NOW()
        `;
      } catch (error: unknown) {
        // Se falhar por constraint antigo (sem grupo/subgrupo), buscar e consolidar registros
        const conflictError = error as { code?: string; message?: string };
        if (
          conflictError?.code === '23505' &&
          typeof conflictError?.message === 'string' &&
          conflictError.message.includes('already exists') &&
          conflictError.message.includes('ano, mes, "nomeFantasia", marca, uf')
        ) {
          // Constraint antigo detectado - buscar TODOS os registros existentes (pode haver múltiplos)
          const registrosExistentes = await this.prisma.vendaAnalytics.findMany(
            {
              where: {
                ano: analytics.ano,
                mes: analytics.mes,
                nomeFantasia: analytics.nomeFantasia,
                marca: analytics.marca,
                uf: analytics.uf,
                // Não filtrar por grupo/subgrupo (constraint antigo)
              },
            },
          );

          if (registrosExistentes.length > 0) {
            // Consolidar todos os registros existentes + novo valor
            let totalValorConsolidado = analytics.totalValor;
            let totalQuantidadeConsolidado = analytics.totalQuantidade;

            for (const reg of registrosExistentes) {
              totalValorConsolidado += parseFloat(reg.totalValor.toString());
              totalQuantidadeConsolidado += parseFloat(
                reg.totalQuantidade.toString(),
              );
            }

            // Usar o primeiro registro como base e atualizar
            const primeiroRegistro = registrosExistentes[0];
            const outrosRegistros = registrosExistentes.slice(1);

            // Atualizar o primeiro registro com valores consolidados e novo grupo/subgrupo/tipoOperacao
            await this.prisma.vendaAnalytics.update({
              where: { id: primeiroRegistro.id },
              data: {
                grupo: analytics.grupo,
                subgrupo: analytics.subgrupo,
                tipoOperacao: analytics.tipoOperacao,
                totalValor: new Decimal(totalValorConsolidado.toString()),
                totalQuantidade: new Decimal(
                  totalQuantidadeConsolidado.toString(),
                ),
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
            throw new Error(
              conflictError?.message ||
                'Erro desconhecido ao fazer upsert de analytics',
            );
          }
        } else {
          // Outro tipo de erro - relançar
          throw new Error(
            conflictError?.message ||
              'Erro desconhecido ao fazer upsert de analytics',
          );
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
        tipoOperacao: true,
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

  /**
   * Calcula evolução percentual entre dois valores
   */
  private calcularEvolucao(
    valorAtual: number,
    valorAnterior: number,
  ): number | null {
    if (!valorAnterior || valorAnterior === 0) {
      return null;
    }
    return ((valorAtual - valorAnterior) / valorAnterior) * 100;
  }

  /**
   * Buscar UFs únicos da tabela VendaAnalytics
   */
  async getUfs(): Promise<string[]> {
    const result = await this.prisma.$queryRaw<Array<{ uf: string }>>`
      SELECT DISTINCT "uf"
      FROM "VendaAnalytics"
      WHERE "uf" IS NOT NULL
      ORDER BY "uf" ASC
    `;
    return result.map((row) => row.uf);
  }

  /**
   * Buscar anos únicos da tabela VendaAnalytics
   */
  async getAnos(): Promise<number[]> {
    const result = await this.prisma.$queryRaw<Array<{ ano: number }>>`
      SELECT DISTINCT "ano"
      FROM "VendaAnalytics"
      WHERE "ano" IS NOT NULL
      ORDER BY "ano" ASC
    `;
    return result.map((row) => row.ano);
  }

  /**
   * Buscar meses únicos da tabela VendaAnalytics
   */
  async getMeses(): Promise<number[]> {
    const result = await this.prisma.$queryRaw<Array<{ mes: number }>>`
      SELECT DISTINCT "mes"
      FROM "VendaAnalytics"
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
      filtros.filial &&
      Array.isArray(filtros.filial) &&
      filtros.filial.length > 0
    ) {
      where.uf = { in: filtros.filial };
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
      filtros.tipoOperacao &&
      Array.isArray(filtros.tipoOperacao) &&
      filtros.tipoOperacao.length > 0
    ) {
      where.tipoOperacao = { in: filtros.tipoOperacao };
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
        [ano: number]: { venda: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { venda: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
  }> {
    const where = this.construirWherePrisma(filtros);

    // Buscar dados agregados por mês e ano
    const resultados = await this.prisma.vendaAnalytics.groupBy({
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
      const venda = parseFloat(
        (row._sum.totalValor || new Decimal(0)).toString(),
      );

      anosSet.add(ano);

      if (!mesesMap.has(mes)) {
        mesesMap.set(mes, {});
      }
      mesesMap.get(mes)![ano] = venda;
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
          [ano: number]: { venda: number; evolucao?: number | null };
        } = {};

        anosDisponiveis.forEach((ano) => {
          const venda = dadosAno[ano] || 0;
          const anoAnterior = ano - 1;
          const vendaAnterior = dadosAno[anoAnterior] || 0;

          dadosComEvolucao[ano] = {
            venda,
            evolucao:
              vendaAnterior > 0
                ? this.calcularEvolucao(venda, vendaAnterior)
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
      [ano: number]: { venda: number; evolucao?: number | null };
    } = {};

    anosDisponiveis.forEach((ano) => {
      const totalAno = meses.reduce(
        (sum, m) => sum + (m.dados[ano]?.venda || 0),
        0,
      );
      const anoAnterior = ano - 1;
      const totalAnoAnterior = meses.reduce(
        (sum, m) => sum + (m.dados[anoAnterior]?.venda || 0),
        0,
      );

      totalGeral[ano] = {
        venda: totalAno,
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
   * Análise 2: Crescimento por Filial (UF) Ano a Ano
   */
  async getCrescimentoFilial(filtros: FilterAnalyticsDto): Promise<{
    filiais: Array<{
      uf: string;
      dados: {
        [ano: number]: { vendas: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { vendas: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
  }> {
    const where = this.construirWherePrisma(filtros);

    const resultados = await this.prisma.vendaAnalytics.groupBy({
      by: ['uf', 'ano'],
      where,
      _sum: {
        totalValor: true,
      },
      orderBy: [{ uf: 'asc' }, { ano: 'asc' }],
    });

    // Organizar dados por filial e ano
    const filiaisMap = new Map<string, { [ano: number]: number }>();
    const anosSet = new Set<number>();

    resultados.forEach((row) => {
      const uf = row.uf;
      const ano = row.ano;
      const vendas = parseFloat(
        (row._sum.totalValor || new Decimal(0)).toString(),
      );

      anosSet.add(ano);

      if (!filiaisMap.has(uf)) {
        filiaisMap.set(uf, {});
      }
      filiaisMap.get(uf)![ano] = vendas;
    });

    const anosDisponiveis = Array.from(anosSet).sort();

    const filiais = Array.from(filiaisMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([uf, dadosAno]) => {
        const dadosComEvolucao: {
          [ano: number]: { vendas: number; evolucao?: number | null };
        } = {};

        anosDisponiveis.forEach((ano) => {
          const vendas = dadosAno[ano] || 0;
          const anoAnterior = ano - 1;
          const vendasAnterior = dadosAno[anoAnterior] || 0;

          dadosComEvolucao[ano] = {
            vendas,
            evolucao:
              vendasAnterior > 0
                ? this.calcularEvolucao(vendas, vendasAnterior)
                : null,
          };
        });

        return {
          uf,
          dados: dadosComEvolucao,
        };
      });

    // Calcular total geral
    const totalGeral: {
      [ano: number]: { vendas: number; evolucao?: number | null };
    } = {};

    anosDisponiveis.forEach((ano) => {
      const totalAno = filiais.reduce(
        (sum, f) => sum + (f.dados[ano]?.vendas || 0),
        0,
      );
      const anoAnterior = ano - 1;
      const totalAnoAnterior = filiais.reduce(
        (sum, f) => sum + (f.dados[anoAnterior]?.vendas || 0),
        0,
      );

      totalGeral[ano] = {
        vendas: totalAno,
        evolucao:
          totalAnoAnterior > 0
            ? this.calcularEvolucao(totalAno, totalAnoAnterior)
            : null,
      };
    });

    return {
      filiais,
      totalGeral,
      anosDisponiveis,
    };
  }

  /**
   * Análise 3: Crescimento por Marca Ano a Ano
   */
  async getCrescimentoMarca(filtros: FilterAnalyticsDto): Promise<{
    marcas: Array<{
      marca: string;
      dados: {
        [ano: number]: { venda: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { venda: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
  }> {
    const where = this.construirWherePrisma(filtros);

    const resultados = await this.prisma.vendaAnalytics.groupBy({
      by: ['marca', 'ano'],
      where,
      _sum: {
        totalValor: true,
      },
      orderBy: [{ marca: 'asc' }, { ano: 'asc' }],
    });

    // Organizar dados por marca e ano
    const marcasMap = new Map<string, { [ano: number]: number }>();
    const anosSet = new Set<number>();

    resultados.forEach((row) => {
      const marca = row.marca;
      const ano = row.ano;
      const venda = parseFloat(
        (row._sum.totalValor || new Decimal(0)).toString(),
      );

      anosSet.add(ano);

      if (!marcasMap.has(marca)) {
        marcasMap.set(marca, {});
      }
      marcasMap.get(marca)![ano] = venda;
    });

    const anosDisponiveis = Array.from(anosSet).sort();

    const marcas = Array.from(marcasMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([marca, dadosAno]) => {
        const dadosComEvolucao: {
          [ano: number]: { venda: number; evolucao?: number | null };
        } = {};

        anosDisponiveis.forEach((ano) => {
          const venda = dadosAno[ano] || 0;
          const anoAnterior = ano - 1;
          const vendaAnterior = dadosAno[anoAnterior] || 0;

          dadosComEvolucao[ano] = {
            venda,
            evolucao:
              vendaAnterior > 0
                ? this.calcularEvolucao(venda, vendaAnterior)
                : null,
          };
        });

        return {
          marca,
          dados: dadosComEvolucao,
        };
      });

    // Calcular total geral
    const totalGeral: {
      [ano: number]: { venda: number; evolucao?: number | null };
    } = {};

    anosDisponiveis.forEach((ano) => {
      const totalAno = marcas.reduce(
        (sum, m) => sum + (m.dados[ano]?.venda || 0),
        0,
      );
      const anoAnterior = ano - 1;
      const totalAnoAnterior = marcas.reduce(
        (sum, m) => sum + (m.dados[anoAnterior]?.venda || 0),
        0,
      );

      totalGeral[ano] = {
        venda: totalAno,
        evolucao:
          totalAnoAnterior > 0
            ? this.calcularEvolucao(totalAno, totalAnoAnterior)
            : null,
      };
    });

    return {
      marcas,
      totalGeral,
      anosDisponiveis,
    };
  }

  /**
   * Análise 4: Crescimento por Associado (nomeFantasia) Ano a Ano
   */
  async getCrescimentoAssociado(
    filtros: FilterAnalyticsDto,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    associados: Array<{
      nomeFantasia: string;
      dados: {
        [ano: number]: { venda: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { venda: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where = this.construirWherePrisma(filtros);

    // Contar total de associados únicos
    const totalAssociados = await this.prisma.vendaAnalytics.groupBy({
      by: ['nomeFantasia'],
      where,
    });

    const total = totalAssociados.length;

    // Buscar dados agregados (precisa buscar todos para calcular total geral corretamente)
    const todosResultados = await this.prisma.vendaAnalytics.groupBy({
      by: ['nomeFantasia', 'ano'],
      where,
      _sum: {
        totalValor: true,
      },
      orderBy: [{ nomeFantasia: 'asc' }, { ano: 'asc' }],
    });

    // Organizar dados por associado e ano
    const associadosMap = new Map<string, { [ano: number]: number }>();
    const anosSet = new Set<number>();

    todosResultados.forEach((row) => {
      const nomeFantasia = row.nomeFantasia;
      const ano = row.ano;
      const venda = parseFloat(
        (row._sum.totalValor || new Decimal(0)).toString(),
      );

      anosSet.add(ano);

      if (!associadosMap.has(nomeFantasia)) {
        associadosMap.set(nomeFantasia, {});
      }
      associadosMap.get(nomeFantasia)![ano] = venda;
    });

    const anosDisponiveis = Array.from(anosSet).sort();

    // Aplicar paginação
    const associadosArray = Array.from(associadosMap.entries()).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    const associadosPaginados = associadosArray.slice(
      (page - 1) * limit,
      page * limit,
    );

    const associados = associadosPaginados.map(([nomeFantasia, dadosAno]) => {
      const dadosComEvolucao: {
        [ano: number]: { venda: number; evolucao?: number | null };
      } = {};

      anosDisponiveis.forEach((ano) => {
        const venda = dadosAno[ano] || 0;
        const anoAnterior = ano - 1;
        const vendaAnterior = dadosAno[anoAnterior] || 0;

        dadosComEvolucao[ano] = {
          venda,
          evolucao:
            vendaAnterior > 0
              ? this.calcularEvolucao(venda, vendaAnterior)
              : null,
        };
      });

      return {
        nomeFantasia,
        dados: dadosComEvolucao,
      };
    });

    // Calcular total geral (usando todos os dados, não apenas a página)
    const totalGeral: {
      [ano: number]: { venda: number; evolucao?: number | null };
    } = {};

    anosDisponiveis.forEach((ano) => {
      const totalAno = associadosArray.reduce(
        (sum, [, dadosAno]) => sum + (dadosAno[ano] || 0),
        0,
      );
      const anoAnterior = ano - 1;
      const totalAnoAnterior = associadosArray.reduce(
        (sum, [, dadosAno]) => sum + (dadosAno[anoAnterior] || 0),
        0,
      );

      totalGeral[ano] = {
        venda: totalAno,
        evolucao:
          totalAnoAnterior > 0
            ? this.calcularEvolucao(totalAno, totalAnoAnterior)
            : null,
      };
    });

    return {
      associados,
      totalGeral,
      anosDisponiveis,
      total,
      page,
      limit,
    };
  }
}
