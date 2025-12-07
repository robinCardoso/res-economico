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
      total_produtos_bravo?: number;
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

      // Preparar dados de atualização, preservando valores existentes
      const progressData: any = {
        updatedAt: new Date(),
      };

      // Atualizar apenas os campos fornecidos (preservando os existentes)
      if (progress.progress_percentage !== undefined) {
        progressData.progress_percentage = new Decimal(progress.progress_percentage);
      }
      if (progress.current_step !== undefined) {
        progressData.current_step = progress.current_step;
      }
      if (progress.current_page !== undefined) {
        progressData.current_page = progress.current_page;
      }
      if (progress.total_pages !== undefined) {
        progressData.total_pages = progress.total_pages;
      }
      if (progress.products_processed !== undefined) {
        progressData.products_processed = progress.products_processed;
      }
      if (progress.total_produtos_bravo !== undefined) {
        progressData.total_produtos_bravo = progress.total_produtos_bravo;
      }
      if (progress.current_product !== undefined) {
        progressData.current_product = progress.current_product;
      }
      if (progress.estimated_time_remaining !== undefined) {
        progressData.estimated_time_remaining = progress.estimated_time_remaining;
      }
      if (progress.status_atual !== undefined) {
        progressData.status_atual = progress.status_atual;
      }
      if (progress.etapa_atual !== undefined) {
        progressData.etapa_atual = progress.etapa_atual;
      }

      if (existingProgress) {
        await this.prisma.bravoSyncProgress.update({
          where: { sync_log_id: syncLogId },
          data: progressData,
        });
        
        this.logger.debug(
          `✅ Progresso atualizado (preservando valores existentes): sync_log_id=${syncLogId}`,
        );
      } else {
        // Ao criar, incluir todos os campos fornecidos
        await this.prisma.bravoSyncProgress.create({
          data: {
            sync_log_id: syncLogId,
            ...progressData,
            progress_percentage: progress.progress_percentage !== undefined
              ? new Decimal(progress.progress_percentage)
              : new Decimal(0),
            createdAt: new Date(),
          },
        });
        
        this.logger.debug(
          `✅ Progresso criado: sync_log_id=${syncLogId}`,
        );
      }

      // Buscar valores atuais do banco para o log (para não mostrar 0 quando não passa os valores)
      let currentProgress = existingProgress;
      if (!currentProgress) {
        currentProgress = await this.prisma.bravoSyncProgress.findUnique({
          where: { sync_log_id: syncLogId },
        });
      }
      
      const logPage = progress.current_page !== undefined ? progress.current_page : (currentProgress?.current_page ?? null);
      const logProcessed = progress.products_processed !== undefined ? progress.products_processed : (currentProgress?.products_processed ?? null);
      const logTotal = progress.total_produtos_bravo !== undefined ? progress.total_produtos_bravo : (currentProgress?.total_produtos_bravo ?? null);
      
      this.logger.log(
        `📊 Progresso atualizado: ${progress.current_step || currentProgress?.current_step || 'N/A'} | Página: ${logPage ?? 'mantida'} | Processados: ${logProcessed ?? 'mantidos'} | Total: ${logTotal ?? 'mantido'}`,
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
