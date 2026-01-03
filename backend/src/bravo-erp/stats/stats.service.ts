import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

interface StatsCache {
  data: {
    success: boolean;
    totalProdutos: number;
    produtosAtivos: number;
    ultimoSync: {
      id: string;
      sync_type: string;
      status: string;
      started_at: string;
      completed_at?: string;
      total_produtos_bravo?: number;
      produtos_inseridos?: number;
      produtos_atualizados?: number;
    } | null;
    ultimosSyncs: Array<{
      id: string;
      status: string;
      started_at: Date;
      completed_at: Date | null;
    }>;
    debug?: Record<string, unknown>;
  };
  timestamp: number;
}

/**
 * Serviço para gerenciar estatísticas do Bravo ERP
 */
@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  private readonly STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private statsCache: StatsCache | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca estatísticas de produtos e sincronização
   */
  async getStats(forceRefresh = false) {
    const startTime = Date.now();

    // Verificar cache primeiro
    if (
      !forceRefresh &&
      this.statsCache &&
      Date.now() - this.statsCache.timestamp < this.STATS_CACHE_DURATION
    ) {
      this.logger.debug('⚡ Retornando dados do cache');
      return {
        ...this.statsCache.data,
        debug: {
          ...this.statsCache.data.debug,
          fromCache: true,
          tempoResposta: Date.now() - startTime,
        },
      } as typeof this.statsCache.data;
    }

    this.logger.log('🚀 Iniciando busca de estatísticas...');

    try {
      // Executar consultas em paralelo para melhor performance
      const [totalProdutos, produtosAtivos, ultimoSync, ultimosSyncs] =
        await Promise.all([
          this.prisma.produto.count(),
          this.prisma.produto.count({ where: { ativo: true } }),
          this.prisma.bravoSyncLog.findFirst({
            orderBy: { started_at: 'desc' },
            select: {
              id: true,
              sync_type: true,
              status: true,
              started_at: true,
              completed_at: true,
              total_produtos_bravo: true,
              produtos_inseridos: true,
              produtos_atualizados: true,
            },
          }),
          this.prisma.bravoSyncLog.findMany({
            orderBy: { started_at: 'desc' },
            take: 10,
            select: {
              id: true,
              sync_type: true,
              status: true,
              started_at: true,
              completed_at: true,
              total_produtos_bravo: true,
            },
          }),
        ]);

      const elapsedTime = Date.now() - startTime;

      // Usar produtosAtivos como fallback para totalProdutos se necessário
      const totalProdutosFinal = totalProdutos || produtosAtivos || 0;

      // Se não há produtos registrados, limpar dados de sincronização
      const ultimoSyncFinal = totalProdutosFinal === 0 ? null : ultimoSync;
      const ultimosSyncsFinal = totalProdutosFinal === 0 ? [] : ultimosSyncs;

      // Formatar ultimoSync para incluir todos os campos necessários
      // Converter null para undefined para compatibilidade com TypeScript
      const ultimoSyncFormatted = ultimoSyncFinal
        ? {
            id: ultimoSyncFinal.id,
            sync_type: ultimoSyncFinal.sync_type || 'N/A',
            status: ultimoSyncFinal.status,
            started_at: ultimoSyncFinal.started_at.toISOString(),
            completed_at: ultimoSyncFinal.completed_at?.toISOString(),
            ...(ultimoSyncFinal.total_produtos_bravo !== null && {
              total_produtos_bravo: ultimoSyncFinal.total_produtos_bravo,
            }),
            ...(ultimoSyncFinal.produtos_inseridos !== null && {
              produtos_inseridos: ultimoSyncFinal.produtos_inseridos,
            }),
            ...(ultimoSyncFinal.produtos_atualizados !== null && {
              produtos_atualizados: ultimoSyncFinal.produtos_atualizados,
            }),
          }
        : null;

      const response = {
        success: true,
        totalProdutos: totalProdutosFinal,
        produtosAtivos: produtosAtivos || 0,
        produtosDoBravo: 0, // Não usado no momento
        totalSincronizados: totalProdutosFinal,
        ultimoSync: ultimoSyncFormatted,
        ultimaSincronizacao: ultimoSyncFinal?.started_at?.toISOString() || '',
        ultimaSincronizacaoData:
          ultimoSyncFinal?.completed_at?.toISOString() || '',
        ultimosSyncs: ultimosSyncsFinal || [],
        debug: {
          totalProdutosOriginal: totalProdutos,
          totalProdutosFinal,
          produtosAtivos,
          ultimoSyncExiste: !!ultimoSyncFinal,
          tempoResposta: elapsedTime,
          fromCache: false,
        },
      };

      // Atualizar cache
      this.statsCache = {
        data: response,
        timestamp: Date.now(),
      };

      this.logger.log(
        `📊 Stats calculados em ${elapsedTime}ms: ${response.totalProdutos} produtos, ${response.produtosAtivos} ativos`,
      );

      return response;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.logger.error('❌ Erro ao buscar estatísticas:', error);

      return {
        success: false,
        totalProdutos: 0,
        produtosAtivos: 0,
        produtosDoBravo: 0,
        totalSincronizados: 0,
        ultimoSync: null,
        ultimaSincronizacao: '',
        ultimaSincronizacaoData: '',
        ultimosSyncs: [],
        debug: {
          totalProdutosOriginal: 0,
          totalProdutosFinal: 0,
          produtosAtivos: 0,
          ultimoSyncExiste: false,
          tempoResposta: elapsedTime,
          fromCache: false,
        },
      };
    }
  }
}
