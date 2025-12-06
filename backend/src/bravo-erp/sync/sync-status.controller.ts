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
import { Decimal } from '@prisma/client/runtime/library';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: string[];
  };
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

    // Buscar progresso mais recente
    const progressData = await this.progressService.getProgress(sync_log_id);

    // Buscar informações do log de sincronização
    const logData = await this.logService.getLogById(sync_log_id);

    // Combinar dados do progresso e do log
    const progress = {
      status: logData?.status || progressData?.status_atual || 'idle',
      current_step: progressData?.current_step || null,
      current_page:
        progressData?.current_page || logData?.pages_processed || 0,
      products_processed:
        progressData?.products_processed || logData?.produtos_inseridos || 0,
      products_inserted_current_page:
        progressData?.products_inserted_current_page || 0,
      total_produtos_bravo:
        progressData?.total_produtos_bravo || logData?.total_produtos_bravo || 0,
      estimated_time_remaining:
        progressData?.estimated_time_remaining || null,
      current_product: progressData?.current_product || null,
      status_atual: progressData?.status_atual || null,
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
            progress.current_page > 0
              ? Math.ceil(totalProducts / 300)
              : 0, // 300 produtos por página estimado
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
    if (
      currentSync.userId !== userId &&
      currentSync.userEmail !== userEmail
    ) {
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

    const response: any = {
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
      response.progress = {
        progress_percentage: progress.progress_percentage
          ? Number(progress.progress_percentage)
          : null,
        current_step: progress.current_step,
        status_atual: progress.status_atual,
        etapa_atual: progress.etapa_atual,
        estimated_time_remaining: progress.estimated_time_remaining,
        current_product: progress.current_product,
      };
    }

    if (include_details) {
      response.full_progress = progress;
    }

    return {
      success: true,
      data: response,
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

    let effectiveLockId = lockId;
    let logUpdated = false;
    let logAlreadyFinalized = false;

    // Se não forneceu lockId, tentar obter do lock atual
    if (!effectiveLockId) {
      const currentSync = await this.lockManager.getCurrentSync();
      if (currentSync) {
        effectiveLockId = currentSync.id;
      }
    }

    // Atualizar log se syncLogId fornecido
    if (syncLogId) {
      const existingLog = await this.logService.getLogById(syncLogId);

      if (existingLog) {
        if (['completed', 'failed', 'cancelled'].includes(existingLog.status)) {
          logAlreadyFinalized = true;
        } else {
          const updateResult = await this.logService.updateLog(syncLogId, {
            status: 'cancelled',
            status_detalhado: 'cancelled_by_user',
            completed_at: new Date(),
            can_resume: false,
          });
          logUpdated = updateResult.success;
        }
      }
    }

    let cancelled = false;

    // Cancelar lock se existir
    if (effectiveLockId) {
      const hasLock = await this.lockManager.hasLock(effectiveLockId);
      if (hasLock) {
        cancelled = await this.lockManager.cancelSync(effectiveLockId);
      }
    }

    const success = cancelled || logUpdated || logAlreadyFinalized;
    const message = cancelled
      ? 'Sincronização cancelada com sucesso'
      : logUpdated
        ? 'Sincronização marcada como cancelada.'
        : logAlreadyFinalized
          ? 'Sincronização já estava finalizada.'
          : 'Não havia sincronização para cancelar';

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
          ? Math.round(
              (Date.now() - new Date(log.started_at).getTime()) / 1000,
            )
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
}
