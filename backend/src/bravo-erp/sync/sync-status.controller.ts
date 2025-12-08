import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { SyncProgressService } from './sync-progress.service';
import { SyncLogService } from './sync-log.service';
import { SyncLockManager } from './sync-lock.manager';
import {
  GetProgressDto,
  GetLogsDto,
  GetLogDetailsDto,
  CancelSyncDto,
  ResumeSyncDto,
} from '../dto/sync-status.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: string[];
  };
}

export interface CleanupResult {
  log_id: string;
  started_at: Date;
  action: string;
}

@Controller('bravo-erp/sync')
@UseGuards(JwtAuthGuard)
export class SyncStatusController {
  constructor(
    private readonly progressService: SyncProgressService,
    private readonly logService: SyncLogService,
    private readonly lockManager: SyncLockManager,
  ) {}

  /**
   * GET /bravo-erp/sync/progress?sync_log_id=xxx
   * Busca o progresso atual de uma sincronização
   */
  @Get('progress')
  async getProgress(@Query() query: GetProgressDto) {
    const { sync_log_id } = query;

    if (!sync_log_id) {
      throw new BadRequestException('sync_log_id é obrigatório');
    }

    // Verificar se é um lock_id (formato: sync_timestamp_random) ou UUID
    const isLockId =
      sync_log_id.startsWith('sync_') &&
      /^sync_\d+_[a-z0-9]+$/i.test(sync_log_id);
    let actualSyncLogId = sync_log_id;

    if (isLockId) {
      // Se for lock_id, buscar o log mais recente em execução
      const runningLog = await this.logService.getLatestRunningLog();

      if (runningLog) {
        actualSyncLogId = runningLog.id;
        console.log(
          `🔍 Lock ID recebido (${sync_log_id}), usando sync_log_id mais recente em execução: ${actualSyncLogId}`,
        );
      } else {
        // Se não encontrar log em execução, buscar o mais recente de qualquer status
        const latestLog = await this.logService.getLatestLog();
        if (latestLog) {
          actualSyncLogId = latestLog.id;
          console.log(
            `🔍 Lock ID recebido (${sync_log_id}), usando sync_log_id mais recente (qualquer status): ${actualSyncLogId}`,
          );
        }
      }
    }

    // Buscar progresso mais recente DA TABELA BRAVOSYNCPROGRESS
    const progressData =
      await this.progressService.getProgress(actualSyncLogId);

    // Buscar informações do log de sincronização DA TABELA BRAVOSYNCLOG
    const logData = await this.logService.getLogById(actualSyncLogId);

    // Log de debug para identificar problemas
    console.log('🔍 DEBUG Progress Endpoint:', {
      sync_log_id_recebido: sync_log_id,
      sync_log_id_usado: actualSyncLogId,
      formato_recebido: isLockId ? 'LOCK_ID' : 'UUID',
      foi_convertido: isLockId && actualSyncLogId !== sync_log_id,
      tabela_progresso: progressData
        ? {
            sync_log_id: progressData.sync_log_id,
            current_page: progressData.current_page,
            products_processed: progressData.products_processed,
            total_produtos_bravo: progressData.total_produtos_bravo,
            progress_percentage: progressData.progress_percentage,
            current_step: progressData.current_step,
            updatedAt: progressData.updatedAt,
          }
        : 'NÃO ENCONTRADO NA TABELA BravoSyncProgress',
      tabela_log: logData
        ? {
            id: logData.id,
            status: logData.status,
            pages_processed: logData.pages_processed,
            produtos_inseridos: logData.produtos_inseridos,
            total_produtos_bravo: logData.total_produtos_bravo,
          }
        : 'NÃO ENCONTRADO NA TABELA BravoSyncLog',
    });

    // Verificar se há logs na tabela para debug
    if (!progressData && !logData) {
      try {
        const prisma = (
          this.progressService as unknown as {
            prisma?: {
              bravoSyncLog?: { findMany: unknown };
              bravoSyncProgress?: { findMany: unknown };
            };
          }
        ).prisma;

        if (
          !prisma?.bravoSyncLog?.findMany ||
          !prisma?.bravoSyncProgress?.findMany
        ) {
          return;
        }

        const allLogs = await (
          prisma.bravoSyncLog.findMany as (args: unknown) => Promise<unknown>
        )({
          orderBy: { started_at: 'desc' },
          take: 3,
          select: { id: true, status: true, started_at: true },
        });

        const allProgress = await (
          prisma.bravoSyncProgress.findMany as (
            args: unknown,
          ) => Promise<unknown>
        )({
          orderBy: { updatedAt: 'desc' },
          take: 3,
          select: { sync_log_id: true, updatedAt: true },
        });
        console.log('🔍 DEBUG - Últimos registros encontrados:', {
          ultimos_logs: allLogs,
          ultimos_progress: allProgress,
          id_buscado: sync_log_id,
        });
      } catch (debugError) {
        console.error('Erro ao buscar registros para debug:', debugError);
      }
    }

    // Se não há progresso nem log, retornar estrutura vazia mas válida
    if (!progressData && !logData) {
      return {
        success: true,
        progress: {
          status: 'iniciando',
          current_step: null,
          current_page: 0,
          products_processed: 0,
          products_inserted_current_page: 0,
          total_produtos_bravo: 0,
          progressPercentage: 0,
          estimated_time_remaining: null,
          current_product: null,
          status_atual: 'iniciando',
          etapa_atual: null,
          productsProcessed: 0,
          totalProducts: 0,
          currentStep: null,
          currentProduct: null,
          estimatedTimeRemaining: null,
          details: {
            pagesProcessed: 0,
            totalPages: 0,
          },
        },
      };
    }

    // Combinar dados do progresso e do log
    const progress = {
      status: logData?.status || progressData?.status_atual || 'processando',
      current_step: progressData?.current_step || null,
      current_page: progressData?.current_page ?? logData?.pages_processed ?? 0,
      products_processed:
        progressData?.products_processed ?? logData?.produtos_inseridos ?? 0,
      products_inserted_current_page:
        progressData?.products_inserted_current_page ?? 0,
      total_produtos_bravo:
        progressData?.total_produtos_bravo ??
        logData?.total_produtos_bravo ??
        0,
      estimated_time_remaining: progressData?.estimated_time_remaining || null,
      current_product: progressData?.current_product || null,
      status_atual:
        progressData?.status_atual || logData?.status || 'processando',
      etapa_atual: progressData?.etapa_atual || null,
    };

    // Calcular progresso percentual
    const totalProducts = progress.total_produtos_bravo || 0;
    const processedProducts = progress.products_processed || 0;
    const progressPercentage =
      totalProducts > 0
        ? Math.min(100, Math.round((processedProducts / totalProducts) * 100))
        : progressData?.progress_percentage
          ? Number(progressData.progress_percentage)
          : 0;

    return {
      success: true,
      progress: {
        ...progress,
        progressPercentage,
        productsProcessed: progress.products_processed,
        totalProducts: progress.total_produtos_bravo,
        currentStep: progress.current_step,
        currentProduct: progress.current_product,
        estimatedTimeRemaining: progress.estimated_time_remaining,
        details: {
          pagesProcessed: progress.current_page,
          totalPages:
            totalProducts > 0 && progress.current_page > 0
              ? Math.ceil(totalProducts / 300)
              : progress.current_page || 0, // 300 produtos por página estimado
        },
      },
    };
  }

  /**
   * GET /bravo-erp/sync/status
   * Verifica status geral de sincronização
   */
  @Get('status')
  async getStatus() {
    const stats = await this.lockManager.getStats();
    const currentSync = await this.lockManager.getCurrentSync();

    if (!currentSync) {
      return {
        success: true,
        isRunning: false,
        message: 'Nenhuma sincronização em andamento',
        stats,
      };
    }

    return {
      success: true,
      isRunning: true,
      currentSync: {
        id: currentSync.id,
        userEmail: currentSync.userEmail,
        type: currentSync.type,
        startedAt: currentSync.startedAt,
        status: currentSync.status,
        duration: Date.now() - currentSync.startedAt.getTime(),
      },
      stats,
    };
  }

  /**
   * DELETE /bravo-erp/sync/status
   * Cancela sincronização em andamento
   */
  @Delete('status')
  async cancelStatus(
    @Body() body: CancelSyncDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { lockId } = body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!lockId) {
      throw new BadRequestException('ID do lock é obrigatório');
    }

    const currentSync = await this.lockManager.getCurrentSync();

    if (!currentSync) {
      throw new NotFoundException('Nenhuma sincronização em andamento');
    }

    // Verificar se o usuário tem permissão para cancelar
    if (currentSync.userId !== userId && currentSync.userEmail !== userEmail) {
      throw new BadRequestException(
        'Você não tem permissão para cancelar esta sincronização',
      );
    }

    const cancelled = await this.lockManager.cancelSync(lockId);

    if (cancelled) {
      return {
        success: true,
        message: 'Sincronização cancelada com sucesso',
      };
    } else {
      throw new BadRequestException('Falha ao cancelar sincronização');
    }
  }

  /**
   * GET /bravo-erp/sync/logs
   * Lista logs de sincronização
   */
  @Get('logs')
  async getLogs(@Query() query: GetLogsDto) {
    const { limit = 10, status, type, can_resume } = query;

    // Converter can_resume se vier como string do query param
    let canResumeBool: boolean | undefined = undefined;
    if (can_resume !== undefined) {
      if (typeof can_resume === 'string') {
        canResumeBool = can_resume.toLowerCase() === 'true';
      } else if (typeof can_resume === 'boolean') {
        canResumeBool = can_resume;
      }
    }

    // Limpar logs órfãos automaticamente antes de listar (silenciosamente)
    this.cleanupOrphanedLogsInternal().catch((err) => {
      // Não bloquear a listagem se a limpeza falhar
      console.error('Erro ao limpar logs órfãos:', err);
    });

    const logs = await this.logService.listLogs({
      limit: limit ? Number(limit) : 10,
      status,
      sync_type: type,
      can_resume: canResumeBool,
    });

    // Formatar logs para resposta
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      sync_type: log.sync_type,
      status: log.status,
      started_at: log.started_at,
      completed_at: log.completed_at,
      tempo_total_segundos: log.tempo_total_segundos,
      total_pages_found: log.total_pages_found,
      pages_processed: log.pages_processed,
      total_produtos_bravo: log.total_produtos_bravo,
      produtos_filtrados: log.produtos_filtrados,
      produtos_analisados: log.produtos_analisados,
      produtos_inseridos: log.produtos_inseridos,
      produtos_atualizados: log.produtos_atualizados,
      produtos_ignorados: log.produtos_ignorados,
      produtos_com_erro: log.produtos_com_erro,
      taxa_otimizacao: log.taxa_otimizacao,
      economia_queries: log.economia_queries,
      can_resume: log.can_resume,
      resume_from_page: log.resume_from_page,
      error_message: log.error_message,
      triggered_by: log.triggered_by,
      user_agent: log.user_agent,
    }));

    return {
      success: true,
      data: {
        logs: formattedLogs,
        total: formattedLogs.length,
        filters: {
          status,
          sync_type: type,
          can_resume,
          limit,
        },
      },
    };
  }

  /**
   * POST /bravo-erp/sync/logs/details
   * Busca detalhes de um log específico
   */
  @Post('logs/details')
  async getLogDetails(@Body() body: GetLogDetailsDto) {
    const { log_id, include_details = false } = body;

    if (!log_id) {
      throw new BadRequestException('ID do log é obrigatório');
    }

    const log = await this.logService.getLogById(log_id);

    if (!log) {
      throw new NotFoundException('Log não encontrado');
    }

    // Buscar progresso relacionado
    const progress = await this.progressService.getProgress(log_id);

    const response: Record<string, unknown> = {
      id: log.id,
      sync_type: log.sync_type,
      status: log.status,
      started_at: log.started_at,
      completed_at: log.completed_at,
      last_activity_at: log.last_activity_at,
      tempo_total_segundos: log.tempo_total_segundos,
      apenas_ativos: log.apenas_ativos,
      limit_requested: log.limit_requested,
      pages_requested: log.pages_requested,
      effective_limit: log.effective_limit,
      total_pages_found: log.total_pages_found,
      pages_processed: log.pages_processed,
      current_page: log.current_page,
      total_produtos_bravo: log.total_produtos_bravo,
      produtos_filtrados: log.produtos_filtrados,
      produtos_analisados: log.produtos_analisados,
      produtos_inseridos: log.produtos_inseridos,
      produtos_atualizados: log.produtos_atualizados,
      produtos_ignorados: log.produtos_ignorados,
      produtos_com_erro: log.produtos_com_erro,
      taxa_otimizacao: log.taxa_otimizacao,
      economia_queries: log.economia_queries,
      can_resume: log.can_resume,
      resume_from_page: log.resume_from_page,
      error_message: log.error_message,
      error_details: log.error_details,
      triggered_by: log.triggered_by,
      user_agent: log.user_agent,
      sync_details: log.sync_details,
    };

    if (progress) {
      const progressObj = progress as {
        progress_percentage?: unknown;
        current_step?: unknown;
        status_atual?: unknown;
        etapa_atual?: unknown;
        estimated_time_remaining?: unknown;
        current_product?: unknown;
      };
      response.progress = {
        progress_percentage: progressObj.progress_percentage
          ? Number(progressObj.progress_percentage)
          : null,
        current_step: progressObj.current_step,
        status_atual: progressObj.status_atual,
        etapa_atual: progressObj.etapa_atual,
        estimated_time_remaining: progressObj.estimated_time_remaining,
        current_product: progressObj.current_product,
      };
    }

    if (include_details) {
      response.full_progress = progress;
    }

    return {
      success: true,
      data: response as unknown,
    };
  }

  /**
   * POST /bravo-erp/sync/cancel
   * Cancela sincronização por syncLogId
   */
  @Post('cancel')
  async cancelSync(
    @Body() body: CancelSyncDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { lockId, syncLogId } = body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    console.log('🛑 Cancelamento solicitado:', {
      lockId,
      syncLogId,
      userId,
      userEmail,
    });

    let effectiveLockId = lockId;
    let logUpdated = false;
    let logAlreadyFinalized = false;

    // Se não forneceu lockId, tentar obter do lock atual
    if (!effectiveLockId) {
      const currentSync = await this.lockManager.getCurrentSync();
      if (currentSync) {
        effectiveLockId = currentSync.id;
        console.log('🔍 Lock ID obtido do sync atual:', effectiveLockId);
      } else {
        console.log('⚠️ Nenhum sync em execução encontrado');
      }
    }

    // Atualizar log se syncLogId fornecido
    if (syncLogId) {
      const existingLog = await this.logService.getLogById(syncLogId);

      if (existingLog) {
        console.log('📋 Log encontrado:', {
          id: existingLog.id,
          status: existingLog.status,
        });

        if (['completed', 'failed', 'cancelled'].includes(existingLog.status)) {
          logAlreadyFinalized = true;
          console.log('ℹ️ Log já estava finalizado');
        } else {
          const updateResult = await this.logService.updateLog(syncLogId, {
            status: 'cancelled',
            status_detalhado: 'cancelled_by_user',
            completed_at: new Date(),
            can_resume: false,
          });
          logUpdated = updateResult.success;
          console.log('✅ Log atualizado:', logUpdated);
        }
      } else {
        console.log('⚠️ Log não encontrado:', syncLogId);
      }
    }

    let cancelled = false;

    // Cancelar lock se existir
    if (effectiveLockId) {
      const hasLock = await this.lockManager.hasLock(effectiveLockId);
      console.log('🔒 Verificando lock:', {
        lockId: effectiveLockId,
        hasLock,
      });

      if (hasLock) {
        cancelled = await this.lockManager.cancelSync(effectiveLockId);
        console.log('✅ Lock cancelado:', cancelled);
      } else {
        console.log('⚠️ Lock não existe mais');
      }
    }

    const success = cancelled || logUpdated || logAlreadyFinalized;
    const message = cancelled
      ? 'Sincronização cancelada com sucesso'
      : logUpdated
        ? 'Sincronização marcada como cancelada'
        : logAlreadyFinalized
          ? 'Sincronização já estava finalizada'
          : 'Não havia sincronização para cancelar';

    console.log('🛑 Resultado do cancelamento:', {
      success,
      message,
      cancelled,
      logUpdated,
      logAlreadyFinalized,
    });

    return {
      success,
      message,
    };
  }

  /**
   * GET /bravo-erp/sync/resume
   * Lista sincronizações que podem ser retomadas
   */
  @Get('resume')
  async listResumableSyncs(@Query('limit') limit?: number) {
    const logs = await this.logService.listResumableLogs(
      limit ? Number(limit) : 10,
    );

    const formattedLogs = logs.map((log) => {
      const pagesProcessed = log.pages_processed || 0;
      const inferredTotalPages =
        log.total_pages_found && log.total_pages_found > 0
          ? log.total_pages_found
          : Math.max(pagesProcessed, (log.resume_from_page || 1) - 1);

      return {
        id: log.id,
        sync_type: log.sync_type,
        status: log.status,
        started_at: log.started_at,
        last_activity_at: log.last_activity_at,
        pages_processed: pagesProcessed,
        total_pages_found: inferredTotalPages,
        resume_from_page: log.resume_from_page || 1,
        total_produtos_bravo: log.total_produtos_bravo || 0,
        produtos_analisados: log.produtos_analisados || 0,
        produtos_inseridos: log.produtos_inseridos || 0,
        produtos_atualizados: log.produtos_atualizados || 0,
        produtos_ignorados: log.produtos_ignorados || 0,
        produtos_com_erro: log.produtos_com_erro || 0,
        error_message: log.error_message,
        triggered_by: log.triggered_by,
        progress_percentage:
          inferredTotalPages > 0
            ? Math.round((pagesProcessed / inferredTotalPages) * 100)
            : 0,
        tempo_desde_inicio: log.started_at
          ? Math.round((Date.now() - new Date(log.started_at).getTime()) / 1000)
          : 0,
      };
    });

    return {
      success: true,
      data: {
        resumable_syncs: formattedLogs,
        total: formattedLogs.length,
      },
    };
  }

  /**
   * POST /bravo-erp/sync/resume
   * Retoma uma sincronização interrompida
   */
  @Post('resume')
  async resumeSync(@Body() body: ResumeSyncDto) {
    const { log_id } = body;

    if (!log_id) {
      throw new BadRequestException('ID do log é obrigatório');
    }

    const log = await this.logService.getLogById(log_id);

    if (!log) {
      throw new NotFoundException('Sincronização não encontrada');
    }

    if (!log.can_resume) {
      throw new BadRequestException(
        'Sincronização não encontrada ou não pode ser retomada',
      );
    }

    if (log.status !== 'failed' && log.status !== 'running') {
      throw new BadRequestException(
        `Sincronização não pode ser retomada. Status atual: ${log.status}`,
      );
    }

    // Atualizar log para indicar que está sendo retomada
    // O last_activity_at é atualizado automaticamente pelo updateLog
    await this.logService.updateLog(log_id, {
      status: 'running',
    });

    // Preparar dados para retomada
    const resumeData = {
      apenas_ativos: log.apenas_ativos,
      limit: log.limit_requested || undefined,
      pages: log.pages_requested || undefined,
      resume_sync_id: log_id,
      resume_from_page: log.resume_from_page || log.current_page || 1,
    };

    return {
      success: true,
      message: 'Sincronização preparada para retomada',
      data: {
        log_id,
        resume_from_page: resumeData.resume_from_page,
        resume_data: resumeData,
        // O frontend deve chamar POST /bravo-erp/sync/sincronizar com resume_data
      },
    };
  }

  /**
   * Método interno para limpar logs órfãos (sem autenticação)
   */
  private async cleanupOrphanedLogsInternal(): Promise<void> {
    try {
      // Buscar todos os logs em "running" há mais de 1 hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const orphanedLogs = await this.logService[
        'prisma'
      ].bravoSyncLog.findMany({
        where: {
          status: 'running',
          started_at: {
            lt: oneHourAgo,
          },
        },
      });

      if (orphanedLogs.length === 0) {
        return; // Nenhum log órfão encontrado
      }

      const currentSync = await this.lockManager.getCurrentSync();
      const activeLockId = currentSync?.id;

      for (const log of orphanedLogs) {
        // Verificar se há lock ativo para este log
        // Se não há lock ativo e o log está há mais de 1 hora em "running", é órfão
        const isOrphaned = !activeLockId || activeLockId !== log.id;

        if (isOrphaned) {
          await this.logService.updateLog(log.id, {
            status: 'failed',
            status_detalhado: 'orphaned_log_cleaned',
            error_message:
              'Sincronização interrompida e não finalizada corretamente (log órfão limpo automaticamente)',
            completed_at: new Date(),
            can_resume: false,
          });

          const startedAtStr =
            log.started_at instanceof Date
              ? log.started_at.toISOString()
              : String(log.started_at);
          console.log(
            `🧹 Log órfão limpo: ${log.id} (iniciado em ${startedAtStr})`,
          );
        }
      }
    } catch (error) {
      // Erro não crítico - apenas logar
      console.error('Erro ao limpar logs órfãos (não crítico):', error);
    }
  }

  /**
   * POST /bravo-erp/sync/cleanup-orphaned
   * Limpa logs órfãos (presos em "running" sem lock ativo)
   */
  @Post('cleanup-orphaned')
  async cleanupOrphanedLogs(): Promise<{
    success: boolean;
    message: string;
    data: {
      total_found: number;
      cleaned: number;
      results: Array<{
        log_id: string;
        started_at: Date;
        action: string;
      }>;
    };
  }> {
    // Buscar todos os logs em "running" há mais de 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const orphanedLogs = await this.logService['prisma'].bravoSyncLog.findMany({
      where: {
        status: 'running',
        started_at: {
          lt: oneHourAgo,
        },
      },
    });

    const currentSync = await this.lockManager.getCurrentSync();
    const activeLockId = currentSync?.id;

    let cleaned = 0;
    const results: CleanupResult[] = [];

    for (const log of orphanedLogs) {
      // Verificar se há lock ativo para este log
      // Se não há lock ativo e o log está há mais de 1 hora em "running", é órfão
      const isOrphaned = !activeLockId || activeLockId !== log.id;

      if (isOrphaned) {
        await this.logService.updateLog(log.id, {
          status: 'failed',
          status_detalhado: 'orphaned_log_cleaned',
          error_message:
            'Sincronização interrompida e não finalizada corretamente (log órfão limpo)',
          completed_at: new Date(),
          can_resume: false,
        });

        cleaned++;
        results.push({
          log_id: log.id,
          started_at: log.started_at,
          action: 'marked_as_failed',
        });
      }
    }

    return {
      success: true,
      message: `${cleaned} log(s) órfão(s) limpo(s)`,
      data: {
        total_found: orphanedLogs.length,
        cleaned,
        results,
      },
    };
  }
}
