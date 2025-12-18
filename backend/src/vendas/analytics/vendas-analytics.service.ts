import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import { FilialAssociadoAnalyticsDto } from './dto/filial-associado-analytics.dto';
import {
  FilialAssociadoResponse,
  UFData,
  AssociadoData,
} from './dto/filial-associado-response.dto';

interface VendaParaAnalytics {
  dataVenda: Date;
  nomeFantasia?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  tipoOperacao?: string;
  ufDestino?: string;
  empresaId?: string;
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
        empresaId: string | null;
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
      const empresaId = venda.empresaId || null;

      // Criar chave única para agrupamento
      // Incluindo grupo, subgrupo, tipoOperacao e empresaId para evitar agrupamento incorreto
      const key = `${ano}_${mes}_${nomeFantasia}_${marca}_${grupo}_${subgrupo}_${tipoOperacao || 'NULL'}_${uf}_${empresaId || 'NULL'}`;

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
          empresaId,
          totalValor: 0,
          totalQuantidade: 0,
        });
      }

      const analytics = analyticsMap.get(key)!;
      analytics.totalValor += parseFloat(venda.valorTotal.toString());
      analytics.totalQuantidade += parseFloat(venda.quantidade.toString());
    });

    this.logger.log(`Agrupadas ${analyticsMap.size} entradas de analytics`);

    // Processar cada entrada de analytics em lotes para evitar esgotar o pool de conexões
    // Aumentado para 200 para melhor performance com grandes volumes
    const analyticsArray = Array.from(analyticsMap.values());
    const BATCH_SIZE = 200; // Processar 200 por vez (otimizado para grandes volumes)
    
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
   * Inclui retry logic para casos de timeout ou problemas temporários de conexão
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
    empresaId: string | null;
    totalValor: number;
    totalQuantidade: number;
  }): Promise<void> {
    const MAX_RETRIES = 3;
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Usar SQL raw com ON CONFLICT para fazer upsert atômico
        // Isso evita race conditions quando múltiplas requisições processam em paralelo
        // O id é gerado usando gen_random_uuid() (PostgreSQL 13+)
        // IMPORTANTE: Se houver constraint antigo (sem grupo/subgrupo), ele será tratado no catch
        try {
          await this.prisma.$executeRaw`
            INSERT INTO "VendaAnalytics" (
              "id", "ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "tipoOperacao", "uf", "empresaId",
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
              ${analytics.empresaId}::text,
              ${analytics.totalValor}::decimal,
              ${analytics.totalQuantidade}::decimal,
              NOW(),
              NOW()
            )
            ON CONFLICT ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "tipoOperacao", "uf", "empresaId")
            DO UPDATE SET
              "totalValor" = "VendaAnalytics"."totalValor" + ${analytics.totalValor}::decimal,
              "totalQuantidade" = "VendaAnalytics"."totalQuantidade" + ${analytics.totalQuantidade}::decimal,
              "updatedAt" = NOW()
          `;
          // Sucesso - sair do loop de retry
          return;
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
              return; // Sucesso após consolidação
            } else {
              // Se não encontrou, pode ser outro tipo de conflito - relançar erro
              throw error;
            }
          } else {
            // Outro tipo de erro - relançar para tratamento no catch externo
            throw error;
          }
        }
      } catch (innerError: unknown) {
        // Tratar erros do SQL ou do tratamento de constraint antigo
        lastError = innerError;
        const errorMessage =
          innerError instanceof Error ? innerError.message : 'Erro desconhecido';
        const errorCode = (innerError as { code?: string })?.code;
        
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
            innerError instanceof Error ? innerError.stack : undefined;
          this.logger.error(
            `Erro ao fazer upsert de analytics após ${MAX_RETRIES} tentativas: ${errorMessage}. Dados: ${JSON.stringify(analytics)}`,
            errorStack,
          );
          // Lançar erro para que o Promise.allSettled capture
          throw innerError;
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

  // Status do recálculo em memória (pode ser melhorado com Redis ou banco de dados)
  private recalculoStatus: {
    emAndamento: boolean;
    progresso: number;
    totalVendas: number;
    vendasProcessadas: number;
    inicio?: Date;
    fim?: Date;
    erro?: string;
    etapa?: string; // Etapa atual: 'limpeza', 'processamento', 'concluido'
    registrosDeletados?: number; // Número de registros deletados na limpeza
  } = {
    emAndamento: false,
    progresso: 0,
    totalVendas: 0,
    vendasProcessadas: 0,
  };

  /**
   * Retorna o status atual do recálculo
   */
  getRecalculoStatus() {
    return {
      emAndamento: this.recalculoStatus.emAndamento,
      progresso: this.recalculoStatus.progresso,
      totalVendas: this.recalculoStatus.totalVendas,
      vendasProcessadas: this.recalculoStatus.vendasProcessadas,
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
   * Recalcula analytics a partir das vendas (útil para correção)
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
      totalVendas: 0,
      vendasProcessadas: 0,
      inicio: new Date(),
      erro: undefined,
      etapa: 'iniciando',
      registrosDeletados: undefined,
    };

    try {
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

      // Contar total de vendas primeiro
      const totalVendas = await this.prisma.venda.count({ where });
      this.recalculoStatus.totalVendas = totalVendas;
      this.logger.log(`Total de vendas para recalcular: ${totalVendas}`);

      // ETAPA 1: Limpar analytics existentes no período
      this.recalculoStatus.etapa = 'limpeza';
      this.logger.log('Iniciando limpeza da tabela VendaAnalytics...');
      
      let registrosDeletados = 0;
      
      if (dataInicio || dataFim) {
        // Se há filtro de data, calcular o período exato baseado nas datas
        // e deletar apenas os registros que correspondem exatamente ao período
        const inicio = dataInicio ? new Date(dataInicio) : null;
        const fim = dataFim ? new Date(dataFim) : null;
        
        // Calcular anos e meses únicos do período filtrado
        const anos = new Set<number>();
        const meses = new Set<number>();
        
        if (inicio && fim) {
          // Iterar por todos os meses no intervalo
          const dataAtual = new Date(inicio);
          while (dataAtual <= fim) {
            anos.add(dataAtual.getFullYear());
            meses.add(dataAtual.getMonth() + 1);
            // Avançar para o próximo mês
            dataAtual.setMonth(dataAtual.getMonth() + 1);
          }
        } else if (inicio) {
          // Apenas data início: incluir o mês de início
          anos.add(inicio.getFullYear());
          meses.add(inicio.getMonth() + 1);
        } else if (fim) {
          // Apenas data fim: incluir o mês de fim
          anos.add(fim.getFullYear());
          meses.add(fim.getMonth() + 1);
        }

        // Deletar registros que correspondem aos anos/meses do período
        // IMPORTANTE: Isso deleta TODOS os registros daqueles meses, não apenas do período exato
        // Isso é necessário porque VendaAnalytics não armazena a data exata, apenas ano/mês
        // Durante o recálculo, vamos recriar todos os registros baseados nas vendas atuais do período
        if (anos.size > 0 && meses.size > 0) {
          const anosArray = Array.from(anos);
          const mesesArray = Array.from(meses);
          
          // Contar registros antes de deletar para confirmar
          const countBefore = await this.prisma.vendaAnalytics.count({
            where: {
              ano: { in: anosArray },
              mes: { in: mesesArray },
            },
          });
          
          // Deletar e aguardar confirmação
          const deleteResult = await this.prisma.vendaAnalytics.deleteMany({
            where: {
              ano: { in: anosArray },
              mes: { in: mesesArray },
            },
          });
          
          registrosDeletados = deleteResult.count;
          
          this.logger.log(
            `Limpeza de analytics concluída: ${registrosDeletados} registros deletados dos anos ${anosArray.join(', ')} e meses ${mesesArray.join(', ')} (esperado: ${countBefore})`,
          );
          
          // Verificar se a limpeza foi bem-sucedida
          if (registrosDeletados !== countBefore) {
            this.logger.warn(
              `Aviso: Número de registros deletados (${registrosDeletados}) difere do esperado (${countBefore})`,
            );
          }
        }
      } else {
        // Limpar tudo - contar antes de deletar
        const countBefore = await this.prisma.vendaAnalytics.count({});
        
        // Deletar e aguardar confirmação
        const deleteResult = await this.prisma.vendaAnalytics.deleteMany({});
        registrosDeletados = deleteResult.count;
        
        this.logger.log(
          `Limpeza de analytics concluída: ${registrosDeletados} registros deletados de toda a tabela (esperado: ${countBefore})`,
        );
        
        // Verificar se a limpeza foi bem-sucedida
        if (registrosDeletados !== countBefore) {
          this.logger.warn(
            `Aviso: Número de registros deletados (${registrosDeletados}) difere do esperado (${countBefore})`,
          );
        }
      }
      
      // Atualizar status com confirmação da limpeza
      this.recalculoStatus.registrosDeletados = registrosDeletados;
      this.logger.log(`✅ Limpeza confirmada: ${registrosDeletados} registros removidos da tabela VendaAnalytics`);
      
      // ETAPA 2: Iniciar processamento das vendas
      this.recalculoStatus.etapa = 'processamento';
      this.logger.log('Iniciando processamento das vendas...');

      // Processar vendas em lotes para melhor performance e controle de progresso
      const BATCH_SIZE = 5000; // Processar 5000 vendas por vez
      let vendasProcessadas = 0;

      for (let skip = 0; skip < totalVendas; skip += BATCH_SIZE) {
        // Buscar lote de vendas
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
            empresaId: true,
            valorTotal: true,
            quantidade: true,
          },
          skip,
          take: BATCH_SIZE,
        });

        // Converter para formato de analytics
        const vendasParaAnalytics: VendaParaAnalytics[] = vendas.map((v) => ({
          dataVenda: v.dataVenda,
          nomeFantasia: v.nomeFantasia ?? undefined,
          marca: v.marca ?? undefined,
          grupo: v.grupo ?? undefined,
          subgrupo: v.subgrupo ?? undefined,
          tipoOperacao: v.tipoOperacao ?? undefined,
          ufDestino: v.ufDestino ?? undefined,
          empresaId: v.empresaId ?? undefined,
          valorTotal: v.valorTotal,
          quantidade: v.quantidade,
        }));

        // Atualizar analytics para este lote
        await this.atualizarAnalytics(vendasParaAnalytics);

        // Atualizar progresso
        vendasProcessadas += vendas.length;
        this.recalculoStatus.vendasProcessadas = vendasProcessadas;
        this.recalculoStatus.progresso = Math.round(
          (vendasProcessadas / totalVendas) * 100,
        );

        // Calcular valor total do lote para debug
        const valorTotalLote = vendas.reduce(
          (sum, v) => sum + parseFloat(v.valorTotal.toString()),
          0,
        );

        this.logger.log(
          `Progresso do recálculo: ${this.recalculoStatus.progresso}% (${vendasProcessadas}/${totalVendas}). Valor total do lote: R$ ${valorTotalLote.toFixed(2)}`,
        );
      }

      // Verificar valor total após recálculo para debug
      const valorTotalRecalculado = await this.prisma.vendaAnalytics.aggregate({
        _sum: {
          totalValor: true,
        },
      });
      const totalValor = valorTotalRecalculado._sum.totalValor
        ? parseFloat(valorTotalRecalculado._sum.totalValor.toString())
        : 0;

      this.recalculoStatus.etapa = 'concluido';
      this.recalculoStatus.emAndamento = false;
      this.recalculoStatus.fim = new Date();
      this.recalculoStatus.progresso = 100;

      this.logger.log(
        `✅ Recálculo de analytics concluído. Total de vendas processadas: ${vendasProcessadas}. Valor total em analytics: R$ ${totalValor.toFixed(2)}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.recalculoStatus.erro = errorMessage;
      this.recalculoStatus.emAndamento = false;
      throw error;
    }
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

    if (
      filtros.empresaId &&
      Array.isArray(filtros.empresaId) &&
      filtros.empresaId.length > 0
    ) {
      where.empresaId = { in: filtros.empresaId };
    }
    // Se não há filtro de empresaId, não adicionar ao where (busca todas, incluindo null)

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

  /**
   * Análise 5: Estatística por Filial e Associado (agrupado por UF e Nome Fantasia, com meses)
   */
  async getFilialAssociadoAnalytics(
    filtros: FilialAssociadoAnalyticsDto,
  ): Promise<FilialAssociadoResponse> {
    // Construir cláusula WHERE
    const where: Record<string, unknown> = {};

    if (filtros.ano) {
      where.ano = filtros.ano;
    }

    if (filtros.marca && filtros.marca.length > 0) {
      where.marca = { in: filtros.marca };
    }

    if (filtros.tipoOperacao && filtros.tipoOperacao.length > 0) {
      where.tipoOperacao = { in: filtros.tipoOperacao };
    }

    if (filtros.ufDestino && filtros.ufDestino.length > 0) {
      where.uf = { in: filtros.ufDestino };
    }

    if (filtros.nomeFantasia && filtros.nomeFantasia.length > 0) {
      where.nomeFantasia = { in: filtros.nomeFantasia };
    }

    // Buscar dados agregados por UF, NomeFantasia e Mês
    const resultados = await this.prisma.vendaAnalytics.groupBy({
      by: ['uf', 'nomeFantasia', 'mes'],
      where,
      _sum: {
        totalValor: true,
      },
      orderBy: [{ uf: 'asc' }, { nomeFantasia: 'asc' }, { mes: 'asc' }],
    });

    // Processar e agrupar dados
    const ufMap = new Map<string, UFData>();
    const mesesSet = new Set<number>();

    resultados.forEach((row) => {
      const uf = row.uf || 'DESCONHECIDO';
      const nomeFantasia = row.nomeFantasia || 'DESCONHECIDO';
      const mes = row.mes;
      const valor = parseFloat(
        (row._sum.totalValor || new Decimal(0)).toString(),
      );

      mesesSet.add(mes);

      // Inicializar UF se não existir
      if (!ufMap.has(uf)) {
        ufMap.set(uf, {
          uf,
          totalGeral: 0,
          monthlyTotals: {},
          associados: [],
        });
      }

      const ufData = ufMap.get(uf)!;

      // Inicializar ou atualizar total mensal da UF
      ufData.monthlyTotals[mes] = (ufData.monthlyTotals[mes] || 0) + valor;
      ufData.totalGeral += valor;

      // Encontrar ou criar associado
      let associado = ufData.associados.find(
        (a) => a.nomeFantasia === nomeFantasia,
      );
      if (!associado) {
        associado = {
          nomeFantasia,
          totalGeral: 0,
          monthlySales: {},
        };
        ufData.associados.push(associado);
      }

      // Atualizar vendas mensais do associado
      associado.monthlySales[mes] =
        (associado.monthlySales[mes] || 0) + valor;
      associado.totalGeral += valor;
    });

    // Calcular total geral
    const totalGeral: { [mes: number]: number; total: number } = {
      total: 0,
    };

    ufMap.forEach((ufData) => {
      Object.keys(ufData.monthlyTotals).forEach((mesStr) => {
        const mes = parseInt(mesStr);
        totalGeral[mes] = (totalGeral[mes] || 0) + ufData.monthlyTotals[mes];
        totalGeral.total += ufData.monthlyTotals[mes];
      });
    });

    // Ordenar UFs e Associados
    const ufs = Array.from(ufMap.values()).sort((a, b) =>
      a.uf.localeCompare(b.uf),
    );

    ufs.forEach((ufData) => {
      ufData.associados.sort((a, b) =>
        a.nomeFantasia.localeCompare(b.nomeFantasia),
      );
    });

    // Identificar meses disponíveis (ordenados)
    const mesesDisponiveis = Array.from(mesesSet).sort((a, b) => a - b);

    return {
      ufs,
      totalGeral,
      mesesDisponiveis,
    };
  }

  /**
   * Método de diagnóstico: Compara valores entre Venda e VendaAnalytics
   */
  async diagnosticarDiscrepancia(filtros: {
    ano?: number;
    mes?: number;
    tipoOperacao?: string;
    empresaId?: string;
  }): Promise<{
    totalVenda: number;
    totalAnalytics: number;
    diferenca: number;
    vendasSemEmpresaId: number;
    analyticsComEmpresaIdNull: number;
    detalhes: {
      totalVendas: number;
      totalAnalytics: number;
      vendasComEmpresaId: number;
      vendasSemEmpresaId: number;
      analyticsComEmpresaId: number;
      analyticsSemEmpresaId: number;
    };
  }> {
    // Construir where para Venda
    const whereVenda: Record<string, unknown> = {};
    if (filtros.ano) {
      whereVenda.dataVenda = {
        gte: new Date(filtros.ano, filtros.mes ? filtros.mes - 1 : 0, 1),
        lt: new Date(filtros.ano, filtros.mes ? filtros.mes : 12, 1),
      };
    }
    if (filtros.tipoOperacao) {
      // Usar match exato para tipoOperacao - "Venda" não deve pegar "Venda Imobilizado"
      whereVenda.tipoOperacao = filtros.tipoOperacao;
    }
    if (filtros.empresaId) {
      whereVenda.empresaId = filtros.empresaId;
    }

    // Construir where para VendaAnalytics
    const whereAnalytics: Record<string, unknown> = {};
    if (filtros.ano) {
      whereAnalytics.ano = filtros.ano;
    }
    if (filtros.mes) {
      whereAnalytics.mes = filtros.mes;
    }
    if (filtros.tipoOperacao) {
      whereAnalytics.tipoOperacao = filtros.tipoOperacao;
    }
    if (filtros.empresaId) {
      whereAnalytics.empresaId = filtros.empresaId;
    }

    // Buscar totais
    const [totalVendaResult, totalAnalyticsResult, vendasSemEmpresaId, analyticsComEmpresaIdNull] = await Promise.all([
      this.prisma.venda.aggregate({
        where: whereVenda,
        _sum: { valorTotal: true },
      }),
      this.prisma.vendaAnalytics.aggregate({
        where: whereAnalytics,
        _sum: { totalValor: true },
      }),
      this.prisma.venda.count({
        where: {
          ...whereVenda,
          empresaId: null,
        },
      }),
      this.prisma.vendaAnalytics.count({
        where: {
          ...whereAnalytics,
          empresaId: null,
        },
      }),
    ]);

    const totalVenda = parseFloat((totalVendaResult._sum.valorTotal || new Decimal(0)).toString());
    const totalAnalytics = parseFloat((totalAnalyticsResult._sum.totalValor || new Decimal(0)).toString());
    const diferenca = totalVenda - totalAnalytics;

    // Detalhes adicionais
    const [totalVendas, totalAnalyticsCount, vendasComEmpresaId] = await Promise.all([
      this.prisma.venda.count({ where: whereVenda }),
      this.prisma.vendaAnalytics.count({ where: whereAnalytics }),
      this.prisma.venda.count({
        where: {
          ...whereVenda,
          empresaId: { not: null },
        },
      }),
    ]);

    const analyticsComEmpresaId = await this.prisma.vendaAnalytics.count({
      where: {
        ...whereAnalytics,
        empresaId: { not: null },
      },
    });

    return {
      totalVenda,
      totalAnalytics,
      diferenca,
      vendasSemEmpresaId,
      analyticsComEmpresaIdNull,
      detalhes: {
        totalVendas,
        totalAnalytics: totalAnalyticsCount,
        vendasComEmpresaId,
        vendasSemEmpresaId,
        analyticsComEmpresaId,
        analyticsSemEmpresaId: analyticsComEmpresaIdNull,
      },
    };
  }

  /**
   * Consulta direta na tabela VendaAnalytics com filtros específicos
   */
  async consultarTotalAnalytics(filtros: {
    ano?: number;
    mes?: number;
    tipoOperacao?: string;
    empresaId?: string;
  }): Promise<{
    totalRegistros: number;
    totalValor: number;
    totalQuantidade: number;
    detalhes: Array<{
      ano: number;
      mes: number;
      tipoOperacao: string | null;
      empresaId: string | null;
      totalValor: number;
      totalQuantidade: number;
    }>;
  }> {
    const where: Record<string, unknown> = {};

    if (filtros.ano) {
      where.ano = filtros.ano;
    }

    if (filtros.mes) {
      where.mes = filtros.mes;
    }

    if (filtros.tipoOperacao) {
      where.tipoOperacao = filtros.tipoOperacao;
    }

    if (filtros.empresaId) {
      where.empresaId = filtros.empresaId;
    }

    // Buscar registros
    const registros = await this.prisma.vendaAnalytics.findMany({
      where,
      select: {
        ano: true,
        mes: true,
        tipoOperacao: true,
        empresaId: true,
        totalValor: true,
        totalQuantidade: true,
      },
    });

    // Calcular totais
    const totalValor = registros.reduce(
      (sum, r) => sum + parseFloat(r.totalValor.toString()),
      0,
    );
    const totalQuantidade = registros.reduce(
      (sum, r) => sum + parseFloat(r.totalQuantidade.toString()),
      0,
    );

    return {
      totalRegistros: registros.length,
      totalValor,
      totalQuantidade,
      detalhes: registros.map((r) => ({
        ano: r.ano,
        mes: r.mes,
        tipoOperacao: r.tipoOperacao,
        empresaId: r.empresaId,
        totalValor: parseFloat(r.totalValor.toString()),
        totalQuantidade: parseFloat(r.totalQuantidade.toString()),
      })),
    };
  }
}
