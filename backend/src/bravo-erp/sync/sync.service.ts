import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BravoErpClientV2Service } from '../client/bravo-erp-client-v2.service';
import { SyncLockManager } from './sync-lock.manager';
import { SyncLogService } from './sync-log.service';
import { SyncProgressService } from './sync-progress.service';
import { SyncProcessorService } from './sync-processor.service';
import { SyncDateFilterService } from './sync-date-filter.service';
import { SyncRequestDto, SyncResponseDto } from '../dto/sync-request.dto';
import { Prisma } from '@prisma/client';

/**
 * Serviço principal de sincronização de produtos do Bravo ERP
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';
  private readonly RATE_LIMIT_DELAY = 10000; // 10 segundos entre páginas

  constructor(
    private readonly prisma: PrismaService,
    private readonly bravoClient: BravoErpClientV2Service,
    private readonly lockManager: SyncLockManager,
    private readonly logService: SyncLogService,
    private readonly progressService: SyncProgressService,
    private readonly processorService: SyncProcessorService,
    private readonly dateFilterService: SyncDateFilterService,
  ) {}

  /**
   * Executa sincronização de produtos
   */
  async sincronizar(
    dto: SyncRequestDto,
    userId: string,
    userEmail: string,
  ): Promise<SyncResponseDto> {
    const startTime = Date.now();
    let syncLogId: string | null = null;
    let lockId: string | null = null;
    let lockStatus: 'completed' | 'failed' | 'cancelled' = 'completed';

    const {
      apenas_ativos = true,
      limit,
      pages = 1,
      resume_sync_id = null,
      verificar_duplicatas = true,
      usar_data_ult_modif = true,
      modo_teste = false,
      teste_duplicatas = false,
    } = dto;

    try {
      this.logger.log(
        `🚀 Iniciando sincronização - Limit: ${limit}, Páginas: ${pages}, Apenas ativos: ${apenas_ativos}`,
      );

      // Limpar logs órfãos antes de verificar lock (prevenir falsos positivos)
      await this.cleanupOrphanedLogsIfNeeded();

      // Verificar e adquirir lock
      if (!modo_teste) {
        const syncType = pages === 999 ? 'complete' : 'quick';

        // Verificar se já existe sync rodando ANTES de tentar adquirir lock
        const isRunning = await this.lockManager.isSyncRunning();
        if (isRunning) {
          const currentSync = await this.lockManager.getCurrentSync();
          throw new ConflictException(
            `Sincronização já em andamento por ${currentSync?.userEmail || 'outro usuário'} (${currentSync?.type || 'desconhecido'}) desde ${currentSync?.startedAt ? currentSync.startedAt.toLocaleString('pt-BR') : 'desconhecido'}`,
          );
        }

        const lockResult = await this.lockManager.acquireLock(
          userId,
          userEmail,
          syncType,
        );

        if (!lockResult.success) {
          throw new ConflictException(
            lockResult.error ||
              'Sincronização já em andamento (não foi possível adquirir lock)',
          );
        }

        lockId = lockResult.lockId!;
      }

      const isCompleteSync = pages === 999;
      const isResumeSync = resume_sync_id !== null;
      const effectiveLimit = isCompleteSync ? undefined : limit || 50;
      const aplicarFiltroData = usar_data_ult_modif !== false;

      // Teste de duplicatas (se solicitado)
      if (teste_duplicatas) {
        return this.executarTesteDuplicatas();
      }

      // Determinar data de filtro
      const { dataFiltro, operadorFiltro, metodoFiltro } =
        await this.dateFilterService.determinarDataFiltro(
          isCompleteSync,
          aplicarFiltroData,
          modo_teste,
        );

      // Criar ou retomar log de sincronização
      let realmenteRetomando = false;
      if (!modo_teste) {
        if (isResumeSync) {
          const resultado = await this.prepararRetomada(resume_sync_id);
          syncLogId = resultado.syncLogId;
          realmenteRetomando = resultado.realmenteRetomando;
        }

        if (!syncLogId) {
          syncLogId = await this.logService.createLog({
            sync_type: isCompleteSync ? 'complete' : 'quick',
            apenas_ativos,
            limit_requested: limit,
            pages_requested: pages,
            effective_limit: effectiveLimit,
            triggered_by: 'admin_user',
            userId,
          });
        }

        // Criar progresso inicial imediatamente
        await this.progressService.updateProgress(syncLogId, {
          progress_percentage: 5,
          current_step: 'Conectando com API do Bravo ERP...',
          current_page: 0,
          products_processed: 0,
          total_produtos_bravo: 0,
          status_atual: 'iniciando',
        });
      }

      // Buscar e processar produtos página por página
      const resultado = await this.processarPaginas({
        isCompleteSync,
        isResumeSync,
        realmenteRetomando,
        pages,
        effectiveLimit,
        dataFiltro,
        operadorFiltro,
        apenas_ativos,
        verificar_duplicatas,
        modo_teste,
        syncLogId,
      });

      const tempoTotal = Math.round((Date.now() - startTime) / 1000);

      // Finalizar sincronização
      if (!modo_teste && syncLogId) {
        await this.finalizarSincronizacao(
          syncLogId,
          resultado,
          metodoFiltro,
          dataFiltro,
          operadorFiltro,
          tempoTotal,
        );
      }

      return {
        success: true,
        message: `Sincronização concluída: ${resultado.totalProdutos} produtos processados em ${resultado.totalPagesProcessed} páginas`,
        sync_log_id: syncLogId || undefined,
        lock_id: lockId || undefined,
        data: {
          filtro_aplicado: apenas_ativos
            ? 'Apenas produtos ativos'
            : 'Todos os produtos',
          total_produtos_bravo: resultado.totalProdutos,
          produtos_filtrados: resultado.totalProdutos,
          paginas_processadas: resultado.totalPagesProcessed,
          tempo_total_segundos: tempoTotal,
        },
      };
    } catch (error) {
      lockStatus = 'failed';
      this.logger.error('❌ Erro na sincronização:', error);

      // Sempre tentar atualizar o log, mesmo se houver erro
      if (syncLogId) {
        try {
          await this.logService.updateLog(syncLogId, {
            status: 'failed',
            error_message:
              error instanceof Error ? error.message : 'Erro desconhecido',
            error_details: {
              error: String(error),
              stack: error instanceof Error ? error.stack : null,
            } as Prisma.InputJsonValue,
            completed_at: new Date(),
            can_resume: true,
          });
        } catch (logError) {
          // Se falhar ao atualizar log, apenas logar (não bloquear)
          this.logger.error('❌ Erro ao atualizar log após falha:', logError);
        }
      }

      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Erro interno do servidor',
      );
    } finally {
      // SEMPRE liberar lock, mesmo se houver erro
      if (lockId) {
        try {
          await this.lockManager.releaseLock(lockId, lockStatus);
          this.logger.log(
            `🔓 Lock liberado: ${lockId} (status: ${lockStatus})`,
          );
        } catch (releaseError) {
          // Se falhar ao liberar lock, logar mas não bloquear
          this.logger.error(`❌ Erro ao liberar lock ${lockId}:`, releaseError);
        }
      }
    }
  }

  /**
   * Prepara retomada de sincronização
   */
  private async prepararRetomada(
    resume_sync_id: string,
  ): Promise<{ syncLogId: string | null; realmenteRetomando: boolean }> {
    const existingLog = await this.logService.getLogById(resume_sync_id);

    if (!existingLog) {
      throw new BadRequestException(
        `Sincronização ${resume_sync_id} não encontrada`,
      );
    }

    if (!existingLog.can_resume) {
      if (existingLog.status === 'completed') {
        this.logger.log(
          `ℹ️ Sincronização ${resume_sync_id} já completada - iniciando nova`,
        );
        return { syncLogId: null, realmenteRetomando: false };
      }
      throw new BadRequestException(
        `Sincronização ${resume_sync_id} não pode ser retomada (status: ${existingLog.status})`,
      );
    }

    this.logger.log(
      `🔄 Retomando sincronização ${resume_sync_id} da página ${existingLog.resume_from_page || 1}`,
    );
    return { syncLogId: resume_sync_id, realmenteRetomando: true };
  }

  /**
   * Processa páginas de produtos
   */
  private async processarPaginas(params: {
    isCompleteSync: boolean;
    isResumeSync: boolean;
    realmenteRetomando: boolean;
    pages: number;
    effectiveLimit?: number;
    dataFiltro: string | null;
    operadorFiltro: string;
    apenas_ativos: boolean;
    verificar_duplicatas: boolean;
    modo_teste: boolean;
    syncLogId: string | null;
  }): Promise<{
    totalProdutos: number;
    totalPagesProcessed: number;
    totalInseridos: number;
    totalAtualizados: number;
    totalIgnorados: number;
    totalComErro: number;
  }> {
    const {
      isCompleteSync,
      isResumeSync,
      realmenteRetomando,
      pages,
      effectiveLimit,
      dataFiltro,
      operadorFiltro,
      apenas_ativos,
      verificar_duplicatas,
      modo_teste,
      syncLogId,
    } = params;

    let allProdutos: Array<Record<string, unknown>> = [];
    let totalPagesProcessed = 0;
    const maxPages = isCompleteSync ? 999 : pages;
    let currentPage = 1;

    // Contadores acumulados de inseridos/atualizados
    let totalInseridos = 0;
    let totalAtualizados = 0;
    let totalIgnorados = 0;
    let totalComErro = 0;

    // Se for retomada, começar da página salva
    if (isResumeSync && syncLogId && realmenteRetomando) {
      const existingLog = await this.logService.getLogById(syncLogId);
      if (existingLog?.resume_from_page) {
        currentPage = existingLog.resume_from_page;
      }
    }

    if (!modo_teste && syncLogId) {
      await this.progressService.updateProgress(syncLogId, {
        progress_percentage: 10,
        current_step: 'Buscando produtos do Bravo ERP...',
        current_page: currentPage,
      });
    }

    // Processar página por página
    const MAX_SYNC_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas máximo
    const syncStartTime = Date.now();

    while (currentPage <= maxPages) {
      // Verificar timeout (máximo 2 horas)
      if (!modo_teste && Date.now() - syncStartTime > MAX_SYNC_DURATION_MS) {
        const errorMsg =
          'Sincronização excedeu o tempo máximo permitido (2 horas)';
        this.logger.error(`⏱️ ${errorMsg}`);

        if (syncLogId) {
          await this.logService.updateLog(syncLogId, {
            status: 'failed',
            error_message: errorMsg,
            completed_at: new Date(),
            can_resume: true,
          });
        }

        throw new BadRequestException(errorMsg);
      }

      // Verificar cancelamento
      if (!modo_teste && syncLogId) {
        const isCancelled = await this.logService.isCancelled(syncLogId);
        if (isCancelled) {
          await this.cancelarSincronizacao(
            syncLogId,
            currentPage,
            allProdutos.length,
            totalInseridos,
            totalAtualizados,
          );
          throw new BadRequestException('Sincronização cancelada pelo usuário');
        }
      }

      // Atualizar progresso ANTES de buscar a página
      if (!modo_teste && syncLogId) {
        const progressPercentage = Math.min(10 + currentPage * 15, 85);
        await this.progressService.updateProgress(syncLogId, {
          progress_percentage: progressPercentage,
          current_step: `Buscando página ${currentPage} de ${maxPages}...`,
          current_page: currentPage,
          products_processed: allProdutos.length, // Produtos já encontrados até agora
          total_produtos_bravo:
            allProdutos.length > 0 ? allProdutos.length : undefined, // Total acumulado (undefined se ainda não encontrou nada)
          estimated_time_remaining: `${Math.max(1, maxPages - currentPage)} páginas restantes`,
        });
      }

      // Buscar produtos da página
      const filterDate = dataFiltro
        ? `${operadorFiltro} ${dataFiltro}`
        : undefined;

      const response = await this.bravoClient.consultarProdutosCompleto({
        page: currentPage,
        useNewSorting: true,
        limit: effectiveLimit,
        filterDate,
      });

      if (response.status !== 'success') {
        this.logger.error(
          `❌ Erro na página ${currentPage}:`,
          response.error?.message,
        );
        break;
      }

      const produtosPagina = response.data || [];

      if (produtosPagina.length === 0) {
        this.logger.log(
          `📄 Página ${currentPage} está vazia - fim dos produtos`,
        );
        break;
      }

      allProdutos = [
        ...allProdutos,
        ...(produtosPagina as Array<Record<string, unknown>>),
      ];
      totalPagesProcessed = currentPage;

      this.logger.log(
        `✅ Página ${currentPage}: ${produtosPagina.length} produtos encontrados (Total acumulado: ${allProdutos.length})`,
      );

      // Atualizar log e progresso ANTES de processar
      if (!modo_teste && syncLogId) {
        await this.logService.updateLog(syncLogId, {
          pages_processed: totalPagesProcessed,
          total_produtos_bravo: allProdutos.length,
          current_page: currentPage,
          resume_from_page: currentPage + 1,
          can_resume: true,
        });

        // Atualizar progresso COM o total de produtos acumulados
        await this.progressService.updateProgress(syncLogId, {
          progress_percentage: Math.min(10 + currentPage * 15 + 5, 85),
          current_step: `Processando ${produtosPagina.length} produtos da página ${currentPage}...`,
          current_page: currentPage,
          products_processed: allProdutos.length,
          total_produtos_bravo: allProdutos.length, // Total acumulado de produtos encontrados
          estimated_time_remaining: `${Math.max(1, maxPages - currentPage)} páginas restantes`,
        });
      }

      // Processar lote e acumular estatísticas
      const stats = await this.processorService.processarLoteProdutos(
        produtosPagina,
        apenas_ativos,
        syncLogId,
        verificar_duplicatas,
        modo_teste,
      );

      // Acumular contadores
      totalInseridos += stats.inseridos;
      totalAtualizados += stats.atualizados;
      totalIgnorados += stats.ignorados;
      totalComErro += stats.comErro;

      // Atualizar log com valores acumulados após cada página
      if (!modo_teste && syncLogId) {
        this.logger.debug(
          `📝 Atualizando log: inseridos=${totalInseridos}, atualizados=${totalAtualizados}, ignorados=${totalIgnorados}, comErro=${totalComErro}`,
        );
        await this.logService.updateLog(syncLogId, {
          produtos_inseridos: totalInseridos,
          produtos_atualizados: totalAtualizados,
          produtos_ignorados: totalIgnorados,
          produtos_com_erro: totalComErro,
          produtos_analisados: allProdutos.length,
        });
      }

      // Se a página retornou menos produtos que o limite, é a última
      if (effectiveLimit && produtosPagina.length < effectiveLimit) {
        this.logger.log(
          `📄 Página ${currentPage} é a última (${produtosPagina.length} < ${effectiveLimit})`,
        );
        break;
      }

      // Rate limiting entre páginas
      if (currentPage < maxPages) {
        if (!modo_teste && syncLogId) {
          // Preservar valores existentes ao atualizar apenas o step
          await this.progressService.updateProgress(syncLogId, {
            current_step: 'Aguardando 10 segundos...',
            etapa_atual: `Rate limiting - próxima página: ${currentPage + 1}`,
            // Não passar outros campos para preservar valores existentes
          });
        }
        await new Promise((resolve) =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY),
        );
      }

      currentPage++;
    }

    return {
      totalProdutos: allProdutos.length,
      totalPagesProcessed,
      totalInseridos,
      totalAtualizados,
      totalIgnorados,
      totalComErro,
    };
  }

  /**
   * Cancela sincronização
   */
  private async cancelarSincronizacao(
    syncLogId: string,
    currentPage: number,
    produtosProcessados: number,
    totalInseridos: number = 0,
    totalAtualizados: number = 0,
  ): Promise<void> {
    const cancelPercentage = Math.min(10 + currentPage * 15, 95);
    await this.logService.updateLog(syncLogId, {
      status: 'cancelled',
      status_detalhado: 'cancelled_by_user',
      produtos_inseridos: totalInseridos,
      produtos_atualizados: totalAtualizados,
      completed_at: new Date(),
      can_resume: false,
    });

    await this.progressService.updateProgress(syncLogId, {
      progress_percentage: cancelPercentage,
      current_step: 'Sincronização cancelada pelo usuário',
      current_page: currentPage,
      products_processed: produtosProcessados,
    });
  }

  /**
   * Finaliza sincronização com sucesso
   */
  private async finalizarSincronizacao(
    syncLogId: string,
    resultado: {
      totalProdutos: number;
      totalPagesProcessed: number;
      totalInseridos: number;
      totalAtualizados: number;
      totalIgnorados: number;
      totalComErro: number;
    },
    metodoFiltro: string,
    dataFiltro: string | null,
    operadorFiltro: string,
    tempoTotal: number,
  ): Promise<void> {
    await this.progressService.updateProgress(syncLogId, {
      progress_percentage: 90,
      current_step: 'Atualizando tabelas de marcas, grupos e subgrupos...',
      products_processed: resultado.totalProdutos,
      total_produtos_bravo: resultado.totalProdutos,
    });

    // Atualizar tabelas agregadas
    await this.processorService.atualizarTabelasAgregadas();

    // Atualizar progresso final
    await this.progressService.updateProgress(syncLogId, {
      progress_percentage: 100,
      current_step: 'Sincronização concluída com sucesso!',
      products_processed: resultado.totalProdutos,
      total_produtos_bravo: resultado.totalProdutos,
    });

    // Atualizar log final com todos os valores corretos
    this.logger.log(
      `📊 Finalizando sincronização: inseridos=${resultado.totalInseridos}, atualizados=${resultado.totalAtualizados}, ignorados=${resultado.totalIgnorados}, comErro=${resultado.totalComErro}, páginas=${resultado.totalPagesProcessed}`,
    );
    await this.logService.updateLog(syncLogId, {
      status: 'completed',
      total_pages_found: resultado.totalPagesProcessed,
      pages_processed: resultado.totalPagesProcessed,
      total_produtos_bravo: resultado.totalProdutos,
      produtos_filtrados: resultado.totalProdutos,
      produtos_analisados: resultado.totalProdutos,
      produtos_inseridos: resultado.totalInseridos,
      produtos_atualizados: resultado.totalAtualizados,
      produtos_ignorados: resultado.totalIgnorados,
      produtos_com_erro: resultado.totalComErro,
      tempo_total_segundos: Number(tempoTotal),
      completed_at: new Date(),
      sync_details: {
        metodo_filtro_data: metodoFiltro,
        data_filtro_usada: dataFiltro,
        operador_filtro: operadorFiltro,
      } as Prisma.InputJsonValue,
      can_resume: false,
    });

    this.logger.log(
      `✅ Sincronização finalizada: ${resultado.totalInseridos} inseridos, ${resultado.totalAtualizados} atualizados, ${resultado.totalPagesProcessed} páginas processadas`,
    );
  }

  /**
   * Executa teste de duplicatas (5 páginas)
   */
  private executarTesteDuplicatas(): SyncResponseDto {
    // TODO: Implementar teste de duplicatas se necessário
    throw new BadRequestException('Teste de duplicatas ainda não implementado');
  }

  /**
   * Limpa logs órfãos se necessário (logs presos em "running" há mais de 1 hora)
   */
  private async cleanupOrphanedLogsIfNeeded(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Usar o PrismaService através do logService

      const prisma = (
        this.logService as unknown as {
          prisma?: { bravoSyncLog?: { findMany: unknown } };
        }
      ).prisma;
      if (!prisma?.bravoSyncLog?.findMany) {
        return;
      }

      const orphanedLogs = await (
        prisma.bravoSyncLog.findMany as (
          args: unknown,
        ) => Promise<Array<{ id: string }>>
      )({
        where: {
          status: 'running',
          started_at: {
            lt: oneHourAgo,
          },
        },
        take: 10, // Limitar a 10 por vez para não sobrecarregar
      });

      if (orphanedLogs.length === 0) {
        return;
      }

      const currentSync = await this.lockManager.getCurrentSync();
      const activeLockId = currentSync?.id;

      for (const log of orphanedLogs) {
        // Se não há lock ativo ou o lock não corresponde a este log, é órfão
        const isOrphaned = !activeLockId || activeLockId !== log.id;

        if (isOrphaned) {
          try {
            await this.logService.updateLog(log.id, {
              status: 'failed',
              status_detalhado: 'orphaned_log_cleaned',
              error_message:
                'Sincronização interrompida e não finalizada corretamente (log órfão limpo automaticamente)',
              completed_at: new Date(),
              can_resume: false,
            });
            this.logger.log(`🧹 Log órfão limpo automaticamente: ${log.id}`);
          } catch (error) {
            // Não bloquear se falhar ao limpar um log específico
            this.logger.warn(`⚠️ Erro ao limpar log órfão ${log.id}:`, error);
          }
        }
      }
    } catch (error) {
      // Não bloquear a sincronização se a limpeza falhar
      this.logger.warn('⚠️ Erro ao limpar logs órfãos (não crítico):', error);
    }
  }
}
