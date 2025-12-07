import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface SyncLock {
  id: string;
  userId: string;
  userEmail: string;
  startedAt: Date;
  type: 'quick' | 'complete' | 'test';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Gerenciador de locks para sincronização Bravo ERP
 * Usa Redis se disponível, caso contrário usa memória
 */
@Injectable()
export class SyncLockManager implements OnModuleInit {
  private readonly logger = new Logger(SyncLockManager.name);
  private redis: Redis | null = null;
  private readonly locks: Map<string, SyncLock> = new Map();
  private readonly LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  private readonly LOCK_KEY_PREFIX = 'bravo:sync:lock:';
  private readonly useRedis: boolean;

  constructor(private readonly configService: ConfigService) {
    this.useRedis =
      this.configService.get<string>('REDIS_HOST') !== undefined;
  }

  async onModuleInit() {
    if (this.useRedis) {
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
          this.logger.log(`SyncLockManager: Redis conectado: ${host}:${port}`);
        });

        this.redis.on('error', (error) => {
          this.logger.warn(
            `SyncLockManager: Erro no Redis (usando memória): ${error.message}`,
          );
          this.redis = null;
        });
      } catch (error) {
        this.logger.warn(
          'SyncLockManager: Redis não disponível, usando memória',
        );
        this.redis = null;
      }
    }
  }

  /**
   * Verifica se há uma sincronização em andamento
   */
  async isSyncRunning(): Promise<boolean> {
    await this.cleanExpiredLocks();
    if (this.useRedis && this.redis) {
      const keys = await this.redis.keys(`${this.LOCK_KEY_PREFIX}*`);
      return keys.length > 0;
    }
    return this.locks.size > 0;
  }

  /**
   * Obtém informações da sincronização em andamento
   */
  async getCurrentSync(): Promise<SyncLock | null> {
    await this.cleanExpiredLocks();
    if (this.useRedis && this.redis) {
      const keys = await this.redis.keys(`${this.LOCK_KEY_PREFIX}*`);
      if (keys.length === 0) return null;

      const lockData = await this.redis.get(keys[0]);
      if (lockData) {
        return JSON.parse(lockData) as SyncLock;
      }
      return null;
    }
    const locks = Array.from(this.locks.values());
    return locks.length > 0 ? locks[0] : null;
  }

  /**
   * Tenta adquirir um lock para sincronização
   */
  async acquireLock(
    userId: string,
    userEmail: string,
    type: 'quick' | 'complete' | 'test',
  ): Promise<{ success: boolean; lockId?: string; error?: string }> {
    await this.cleanExpiredLocks();

    const isRunning = await this.isSyncRunning();
    if (isRunning) {
      const currentSync = await this.getCurrentSync();
      return {
        success: false,
        error: `Sincronização já em andamento por ${currentSync?.userEmail} (${currentSync?.type}) desde ${currentSync?.startedAt.toLocaleString('pt-BR')}`,
      };
    }

    const lockId = `sync_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const lock: SyncLock = {
      id: lockId,
      userId,
      userEmail,
      startedAt: new Date(),
      type,
      status: 'running',
    };

    if (this.useRedis && this.redis) {
      try {
        const lockKey = `${this.LOCK_KEY_PREFIX}${lockId}`;
        // Usar SET com NX para lock atômico (só cria se não existir)
        // ioredis: SET key value EX seconds NX
        const result = await this.redis.set(
          lockKey,
          JSON.stringify(lock),
          'EX',
          Math.floor(this.LOCK_TIMEOUT / 1000),
          'NX',
        );
        
        if (result === 'OK') {
          this.logger.log(`🔒 Lock adquirido (Redis): ${lockId} por ${userEmail} (${type})`);
          return { success: true, lockId };
        } else {
          // result é null quando NX falha (chave já existe)
          this.logger.warn(`⚠️ Tentativa de adquirir lock quando já existe: ${lockId}`);
          return {
            success: false,
            error: 'Sincronização já em andamento (lock adquirido por outro processo)',
          };
        }
      } catch (error) {
        this.logger.warn('Erro ao salvar lock no Redis, usando memória:', error);
        // Fallback para memória - verificar novamente antes de adicionar
        if (this.locks.size > 0) {
          const existingLock = Array.from(this.locks.values())[0];
          return {
            success: false,
            error: `Sincronização já em andamento por ${existingLock.userEmail} (${existingLock.type}) desde ${existingLock.startedAt.toLocaleString('pt-BR')}`,
          };
        }
        this.locks.set(lockId, lock);
        this.logger.log(`🔒 Lock adquirido (Memória): ${lockId} por ${userEmail} (${type})`);
        return { success: true, lockId };
      }
    } else {
      // Verificar novamente em memória antes de adicionar (dupla verificação)
      if (this.locks.size > 0) {
        const existingLock = Array.from(this.locks.values())[0];
        return {
          success: false,
          error: `Sincronização já em andamento por ${existingLock.userEmail} (${existingLock.type}) desde ${existingLock.startedAt.toLocaleString('pt-BR')}`,
        };
      }
      this.locks.set(lockId, lock);
      this.logger.log(`🔒 Lock adquirido (Memória): ${lockId} por ${userEmail} (${type})`);
      return { success: true, lockId };
    }
  }

  /**
   * Libera um lock de sincronização
   */
  async releaseLock(
    lockId: string,
    status: 'completed' | 'failed' | 'cancelled' = 'completed',
  ): Promise<boolean> {
    if (this.useRedis && this.redis) {
      try {
        const lockKey = `${this.LOCK_KEY_PREFIX}${lockId}`;
        const lockData = await this.redis.get(lockKey);
        if (!lockData) {
          this.logger.warn(`⚠️ Tentativa de liberar lock inexistente: ${lockId}`);
          return false;
        }

        const lock: SyncLock = JSON.parse(lockData);
        lock.status = status;
        await this.redis.set(lockKey, JSON.stringify(lock), 'EX', 300); // 5 minutos para histórico
        await this.redis.del(lockKey);
        this.logger.log(`🔓 Lock liberado (Redis): ${lockId} (${status})`);
        return true;
      } catch (error) {
        this.logger.warn('Erro ao liberar lock no Redis:', error);
        // Tentar remover da memória também
        this.locks.delete(lockId);
        return false;
      }
    } else {
      const lock = this.locks.get(lockId);
      if (!lock) {
        this.logger.warn(`⚠️ Tentativa de liberar lock inexistente: ${lockId}`);
        return false;
      }

      lock.status = status;
      this.locks.delete(lockId);
      this.logger.log(`🔓 Lock liberado (Memória): ${lockId} (${status})`);
      return true;
    }
  }

  /**
   * Cancela uma sincronização em andamento
   */
  async cancelSync(lockId: string): Promise<boolean> {
    return this.releaseLock(lockId, 'cancelled');
  }

  /**
   * Verifica se um lock existe e ainda está ativo
   */
  async hasLock(lockId: string): Promise<boolean> {
    await this.cleanExpiredLocks();
    if (this.useRedis && this.redis) {
      const lockKey = `${this.LOCK_KEY_PREFIX}${lockId}`;
      const exists = await this.redis.exists(lockKey);
      return exists === 1;
    }
    return this.locks.has(lockId);
  }

  /**
   * Obtém estatísticas de sincronização
   */
  async getStats() {
    const isRunning = await this.isSyncRunning();
    const currentSync = await this.getCurrentSync();
    
    return {
      isRunning,
      currentSync: currentSync ? {
        id: currentSync.id,
        userEmail: currentSync.userEmail,
        type: currentSync.type,
        startedAt: currentSync.startedAt,
        status: currentSync.status,
        duration: Date.now() - currentSync.startedAt.getTime(),
      } : null,
    };
  }

  /**
   * Limpa locks expirados
   */
  private async cleanExpiredLocks(): Promise<void> {
    const now = Date.now();

    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.keys(`${this.LOCK_KEY_PREFIX}*`);
        for (const key of keys) {
          const lockData = await this.redis.get(key);
          if (lockData) {
            const lock: SyncLock = JSON.parse(lockData);
            const lockAge = now - new Date(lock.startedAt).getTime();
            if (lockAge > this.LOCK_TIMEOUT) {
              this.logger.log(`🧹 Limpando lock expirado: ${lock.id}`);
              await this.redis.del(key);
            }
          }
        }
      } catch (error) {
        this.logger.warn('Erro ao limpar locks expirados no Redis:', error);
      }
    } else {
      const expiredLocks: string[] = [];

      this.locks.forEach((lock, lockId) => {
        const lockAge = now - lock.startedAt.getTime();
        if (lockAge > this.LOCK_TIMEOUT) {
          expiredLocks.push(lockId);
        }
      });

      expiredLocks.forEach((lockId) => {
        this.logger.log(`🧹 Limpando lock expirado: ${lockId}`);
        this.locks.delete(lockId);
      });
    }
  }
}
