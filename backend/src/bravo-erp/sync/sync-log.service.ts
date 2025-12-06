import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Serviço para gerenciar logs de sincronização
 */
@Injectable()
export class SyncLogService {
  private readonly logger = new Logger(SyncLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria novo log de sincronização
   */
  async createLog(data: {
    sync_type: string;
    apenas_ativos: boolean;
    limit_requested?: number | null;
    pages_requested?: number | null;
    effective_limit?: number | null;
    triggered_by?: string;
    user_agent?: string;
    userId?: string;
  }): Promise<string> {
    try {
      const log = await this.prisma.bravoSyncLog.create({
        data: {
          sync_type: data.sync_type,
          status: 'running',
          apenas_ativos: data.apenas_ativos,
          limit_requested: data.limit_requested,
          pages_requested: data.pages_requested,
          effective_limit: data.effective_limit,
          triggered_by: data.triggered_by || 'admin_user',
          user_agent: data.user_agent || 'unknown',
          userId: data.userId,
          started_at: new Date(),
          last_activity_at: new Date(),
        },
      });

      this.logger.log(`📝 Log de sincronização criado: ${log.id}`);
      return log.id;
    } catch (error) {
      this.logger.error('Erro ao criar log de sincronização:', error);
      throw error;
    }
  }

  /**
   * Atualiza log de sincronização
   */
  async updateLog(
    syncLogId: string,
    updates: {
      status?: string;
      status_detalhado?: string;
      current_page?: number;
      pages_processed?: number;
      total_pages_found?: number;
      resume_from_page?: number;
      total_produtos_bravo?: number;
      produtos_filtrados?: number;
      produtos_analisados?: number;
      produtos_inseridos?: number;
      produtos_atualizados?: number;
      produtos_ignorados?: number;
      produtos_com_erro?: number;
      taxa_otimizacao?: string;
      economia_queries?: number;
      error_message?: string;
      error_details?: Prisma.InputJsonValue;
      tipos_erro?: Prisma.InputJsonValue;
      sugestoes_correcao?: string[];
      tempo_total_segundos?: number;
      percentual_sucesso?: number;
      can_resume?: boolean;
      sync_details?: Prisma.InputJsonValue;
      completed_at?: Date;
    },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar se o log existe
      const existingLog = await this.prisma.bravoSyncLog.findUnique({
        where: { id: syncLogId },
      });

      if (!existingLog) {
        this.logger.warn(`⚠️ updateLog: Log ${syncLogId} não encontrado`);
        return { success: false, error: 'Log não encontrado' };
      }

      // Preparar dados de atualização com tipos corretos
      const updateData: Prisma.BravoSyncLogUpdateInput = {};

      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }
      if (updates.status_detalhado !== undefined) {
        updateData.status_detalhado = updates.status_detalhado;
      }
      if (updates.current_page !== undefined) {
        updateData.current_page = updates.current_page;
      }
      if (updates.pages_processed !== undefined) {
        updateData.pages_processed = updates.pages_processed;
      }
      if (updates.total_pages_found !== undefined) {
        updateData.total_pages_found = updates.total_pages_found;
      }
      if (updates.resume_from_page !== undefined) {
        updateData.resume_from_page = updates.resume_from_page;
      }
      if (updates.total_produtos_bravo !== undefined) {
        updateData.total_produtos_bravo = updates.total_produtos_bravo;
      }
      if (updates.produtos_filtrados !== undefined) {
        updateData.produtos_filtrados = updates.produtos_filtrados;
      }
      if (updates.produtos_analisados !== undefined) {
        updateData.produtos_analisados = updates.produtos_analisados;
      }
      if (updates.produtos_inseridos !== undefined) {
        updateData.produtos_inseridos = updates.produtos_inseridos;
      }
      if (updates.produtos_atualizados !== undefined) {
        updateData.produtos_atualizados = updates.produtos_atualizados;
      }
      if (updates.produtos_ignorados !== undefined) {
        updateData.produtos_ignorados = updates.produtos_ignorados;
      }
      if (updates.produtos_com_erro !== undefined) {
        updateData.produtos_com_erro = updates.produtos_com_erro;
      }
      if (updates.taxa_otimizacao !== undefined) {
        updateData.taxa_otimizacao = updates.taxa_otimizacao;
      }
      if (updates.economia_queries !== undefined) {
        updateData.economia_queries = updates.economia_queries;
      }
      if (updates.error_message !== undefined) {
        updateData.error_message = updates.error_message;
      }
      if (updates.error_details !== undefined) {
        updateData.error_details = updates.error_details;
      }
      if (updates.tipos_erro !== undefined) {
        updateData.tipos_erro = updates.tipos_erro;
      }
      if (updates.sugestoes_correcao !== undefined) {
        updateData.sugestoes_correcao = updates.sugestoes_correcao;
      }
      if (updates.tempo_total_segundos !== undefined) {
        updateData.tempo_total_segundos = updates.tempo_total_segundos;
      }
      if (updates.percentual_sucesso !== undefined) {
        updateData.percentual_sucesso = updates.percentual_sucesso;
      }
      if (updates.can_resume !== undefined) {
        updateData.can_resume = updates.can_resume;
      }
      if (updates.sync_details !== undefined) {
        updateData.sync_details = updates.sync_details;
      }
      if (updates.completed_at !== undefined) {
        updateData.completed_at = updates.completed_at;
      }

      updateData.last_activity_at = new Date();

      // Atualizar o log
      await this.prisma.bravoSyncLog.update({
        where: { id: syncLogId },
        data: updateData,
      });

      if (
        updates.status === 'completed' ||
        updates.status === 'failed' ||
        updates.status === 'cancelled'
      ) {
        this.logger.log(
          `✅ updateLog: Log ${syncLogId} atualizado com sucesso - Status: ${updates.status}`,
        );
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `❌ updateLog: Erro ao atualizar log ${syncLogId}:`,
        errorMessage,
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Busca log por ID
   */
  async getLogById(syncLogId: string) {
    return this.prisma.bravoSyncLog.findUnique({
      where: { id: syncLogId },
    });
  }

  /**
   * Verifica se sincronização foi cancelada
   */
  async isCancelled(syncLogId: string): Promise<boolean> {
    const log = await this.getLogById(syncLogId);
    return log?.status === 'cancelled';
  }

  /**
   * Lista logs de sincronização com filtros
   */
  async listLogs(filters: {
    limit?: number;
    status?: string;
    sync_type?: string;
    can_resume?: boolean;
  }) {
    const { limit = 10, status, sync_type, can_resume } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (sync_type) {
      where.sync_type = sync_type;
    }

    if (can_resume !== undefined) {
      where.can_resume = can_resume;
    }

    return this.prisma.bravoSyncLog.findMany({
      where,
      orderBy: { started_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Lista sincronizações que podem ser retomadas
   */
  async listResumableLogs(limit = 10) {
    return this.prisma.bravoSyncLog.findMany({
      where: {
        can_resume: true,
        status: {
          in: ['failed', 'cancelled'],
        },
      },
      orderBy: { started_at: 'desc' },
      take: limit,
      select: {
        id: true,
        sync_type: true,
        status: true,
        started_at: true,
        last_activity_at: true,
        pages_processed: true,
        total_pages_found: true,
        total_produtos_bravo: true,
        produtos_analisados: true,
        produtos_inseridos: true,
        produtos_atualizados: true,
        produtos_ignorados: true,
        produtos_com_erro: true,
        error_message: true,
        resume_from_page: true,
        triggered_by: true,
      },
    });
  }
}
