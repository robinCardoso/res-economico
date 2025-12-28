import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<string>('REDIS_HOST') !== undefined;
  }

  onModuleInit() {
    if (this.enabled) {
      try {
        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);

        this.redis = new Redis({
          host,
          port: Number(port),
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });

        this.redis.on('connect', () => {
          this.logger.log(`Cache Redis conectado: ${host}:${port}`);
        });

        this.redis.on('error', (error) => {
          this.logger.warn(
            `Erro no Redis (cache continuará desabilitado): ${error.message}`,
          );
          this.redis = null;
        });
      } catch {
        this.logger.warn(
          'Redis não disponível para cache, continuando sem cache',
        );
        this.redis = null;
      }
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Obtém valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Erro ao buscar cache para chave ${key}:`, error);
      return null;
    }
  }

  /**
   * Define valor no cache com TTL
   */
  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = 300,
  ): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.warn(`Erro ao definir cache para chave ${key}:`, error);
    }
  }

  /**
   * Remove valor do cache
   */
  async del(key: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.warn(`Erro ao remover cache para chave ${key}:`, error);
    }
  }

  /**
   * Remove todas as chaves que correspondem ao padrão
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.warn(`Erro ao remover cache para padrão ${pattern}:`, error);
    }
  }

  /**
   * Verifica se o cache está disponível
   */
  isAvailable(): boolean {
    return this.redis !== null;
  }
}
