import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Serviço para gerenciar progresso de sincronização
 */
@Injectable()
export class SyncProgressService {
  private readonly logger = new Logger(SyncProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atualiza ou cria progresso de sincronização
   */
  async updateProgress(
    syncLogId: string,
    progress: {
      progress_percentage?: number;
      current_step?: string;
      current_page?: number;
      total_pages?: number;
      products_processed?: number;
      current_product?: string | null;
      estimated_time_remaining?: string | null;
      status_atual?: string;
      etapa_atual?: string;
    },
  ): Promise<void> {
    try {
      const existingProgress = await this.prisma.bravoSyncProgress.findUnique({
        where: { sync_log_id: syncLogId },
      });

      const progressData = {
        ...progress,
        progress_percentage: progress.progress_percentage
          ? new Decimal(progress.progress_percentage)
          : undefined,
        updatedAt: new Date(),
      };

      if (existingProgress) {
        await this.prisma.bravoSyncProgress.update({
          where: { sync_log_id: syncLogId },
          data: progressData,
        });
      } else {
        await this.prisma.bravoSyncProgress.create({
          data: {
            sync_log_id: syncLogId,
            ...progressData,
            progress_percentage: progress.progress_percentage
              ? new Decimal(progress.progress_percentage)
              : new Decimal(0),
            createdAt: new Date(),
          },
        });
      }

      this.logger.debug(
        `📊 Progresso atualizado: ${progress.current_step} (${progress.progress_percentage}%)`,
      );
    } catch (error) {
      this.logger.error('Erro ao atualizar progresso de sincronização:', error);
      throw error;
    }
  }

  /**
   * Busca progresso de sincronização
   */
  async getProgress(syncLogId: string) {
    return this.prisma.bravoSyncProgress.findUnique({
      where: { sync_log_id: syncLogId },
    });
  }
}
