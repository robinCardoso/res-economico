import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FiltrosPerfilClienteDto } from '../dto/cliente-perfil-analytics.dto';

/**
 * Service para gerenciar caching de dados de analytics
 * Implementa estratégia de cache com invalidação inteligente
 *
 * ESTRATÉGIA DE CACHING:
 * - Visão Geral: 1 hora (dados menos frequentes)
 * - Relatórios: 30 minutos (dados médios)
 * - Alertas: 5 minutos (dados críticos, devem ser frescos)
 * - Segmentação: 30 minutos
 *
 * INVALIDAÇÃO:
 * - Ao importar vendas → invalida TODOS os caches
 * - Ao atualizar cliente → invalida cache daquele cliente
 */
@Injectable()
export class CacheAnalyticsService {
  private readonly logger = new Logger(CacheAnalyticsService.name);

  // Armazenamento em memória (para projetos sem Redis)
  // Em produção, usar Redis
  private cache = new Map<string, { data: any; expiresAt: number }>();

  constructor(private prisma: PrismaService) {
    // Limpar cache expirado a cada 5 minutos
    this.startCacheCleanup();
  }

  /**
   * ESTRATÉGIA 1: Cache com TTL (Time To Live)
   *
   * TTL recomendado:
   * - Visão Geral: 3600s (1 hora) - dados agregados, mudam pouco
   * - Relatórios: 1800s (30 min) - dados por cliente
   * - Alertas: 300s (5 min) - dados críticos, devem estar frescos
   * - Segmentação: 1800s (30 min) - dados de RFM
   */
  async getOrSetCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    // Verificar cache em memória
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`✅ Cache HIT: ${cacheKey}`);
      return cached.data as T;
    }

    this.logger.debug(`❌ Cache MISS: ${cacheKey}`);

    // Buscar dados
    const data = await fetcher();

    // Armazenar no cache
    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return data;
  }

  /**
   * ESTRATÉGIA 2: Invalidação de Cache
   *
   * Invalida todos os caches relacionados a um cliente
   */
  invalidateClientCache(nomeFantasia: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(
      (key) =>
        key.includes(nomeFantasia) || // Cache específico do cliente
        key.includes('visao-geral') || // Visão geral é afetada
        key.includes('relatorios'), // Relatórios são afetados
    );

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.logger.log(`🗑️  Cache invalidado: ${key}`);
    });
  }

  /**
   * Invalida TODOS os caches (após importação de vendas)
   */
  invalidateAllCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`🗑️  TODOS os ${size} caches foram invalidados`);
  }

  /**
   * Gera chave de cache padronizada
   */
  generateCacheKey(
    type: 'visao-geral' | 'relatorio' | 'alertas' | 'segmentacao',
    filtros: FiltrosPerfilClienteDto,
  ): string {
    const filtroStr = JSON.stringify(filtros || {})
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 50);

    return `analytics:${type}:${filtroStr}`;
  }

  /**
   * Limpar cache expirado a cada 5 minutos
   */
  private startCacheCleanup(): void {
    setInterval(
      () => {
        const now = Date.now();
        let deleted = 0;

        for (const [key, value] of this.cache.entries()) {
          if (value.expiresAt < now) {
            this.cache.delete(key);
            deleted++;
          }
        }

        if (deleted > 0) {
          this.logger.debug(`🧹 Cache cleanup: ${deleted} entradas removidas`);
        }
      },
      5 * 60 * 1000,
    ); // A cada 5 minutos
  }

  /**
   * Obter estatísticas do cache (para monitoramento)
   */
  getCacheStats() {
    const total = this.cache.size;
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [, value] of this.cache.entries()) {
      if (value.expiresAt > now) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total,
      valid,
      expired,
      hitRate: valid / Math.max(total, 1),
    };
  }
}
