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

      // Verificar e adquirir lock
      if (!modo_teste) {
        const syncType = pages === 999 ? 'complete' : 'quick';
        const lockResult = await this.lockManager.acquireLock(
          userId,
          userEmail,
          syncType,
        );

        if (!lockResult.success) {
          throw new ConflictException(
            lockResult.error || 'Sincronização já em andamento',
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
        return await this.executarTesteDuplicatas();
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

        await this.progressService.updateProgress(syncLogId, {
          progress_percentage: 5,
          current_step: 'Conectando com API do Bravo ERP...',
          products_processed: 0,
        });
      }

      // Buscar e processar produtos página por página
      const resultado = await this.processarPaginas(
        {
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
        },
        startTime,
      );

      // Finalizar sincronização
      if (!modo_teste && syncLogId) {
        await this.finalizarSincronizacao(
          syncLogId,
          resultado,
          metodoFiltro,
          dataFiltro,
          operadorFiltro,
          startTime,
        );
      }

      const tempoTotal = Math.round((Date.now() - startTime) / 1000);

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

      if (syncLogId) {
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
      }

      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Erro interno do servidor',
      );
    } finally {
      // Liberar lock
      if (lockId) {
        await this.lockManager.releaseLock(lockId, lockStatus);
        this.logger.log(`🔓 Lock liberado: ${lockId}`);
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
  private async processarPaginas(
    params: {
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
    },
    startTime: number,
  ): Promise<{
    totalProdutos: number;
    totalPagesProcessed: number;
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

    let allProdutos: any[] = [];
    let totalPagesProcessed = 0;
    let maxPages = isCompleteSync ? 999 : pages;
    let currentPage = 1;

    // Se for retomada, começar da página salva
    if (isResumeSync && syncLogId && realmenteRetomando) {
      const existingLog = await this.logService.getLogById(syncLogId!);
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
    while (currentPage <= maxPages) {
      // Verificar cancelamento
      if (!modo_teste && syncLogId) {
        const isCancelled = await this.logService.isCancelled(syncLogId);
        if (isCancelled) {
          await this.cancelarSincronizacao(syncLogId, currentPage, allProdutos.length);
          throw new BadRequestException('Sincronização cancelada pelo usuário');
        }
      }

      // Atualizar progresso
      if (!modo_teste && syncLogId) {
        const progressPercentage = Math.min(10 + currentPage * 15, 85);
        await this.progressService.updateProgress(syncLogId, {
          progress_percentage: progressPercentage,
          current_step: `Processando página ${currentPage} de ${maxPages}...`,
          current_page: currentPage,
          products_processed: allProdutos.length,
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
        this.logger.error(`❌ Erro na página ${currentPage}:`, response.error?.message);
        break;
      }

      const produtosPagina = response.data || [];

      if (produtosPagina.length === 0) {
        this.logger.log(`📄 Página ${currentPage} está vazia - fim dos produtos`);
        break;
      }

      allProdutos = [...allProdutos, ...produtosPagina];
      totalPagesProcessed = currentPage;

      this.logger.log(
        `✅ Página ${currentPage}: ${produtosPagina.length} produtos encontrados`,
      );

      // Atualizar log
      if (!modo_teste && syncLogId) {
        await this.logService.updateLog(syncLogId, {
          pages_processed: totalPagesProcessed,
          total_produtos_bravo: allProdutos.length,
          current_page: currentPage,
          resume_from_page: currentPage + 1,
          can_resume: true,
        });
      }

      // Processar lote de produtos
      if (!modo_teste && syncLogId) {
        await this.progressService.updateProgress(syncLogId, {
          progress_percentage: Math.min(10 + currentPage * 15 + 5, 85),
          current_step: `Processando ${produtosPagina.length} produtos da página ${currentPage}...`,
          products_processed: allProdutos.length,
        });
      }

      await this.processorService.processarLoteProdutos(
        produtosPagina,
        apenas_ativos,
        syncLogId,
        verificar_duplicatas,
        modo_teste,
      );

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
          await this.progressService.updateProgress(syncLogId, {
            current_step: 'Aguardando 10 segundos...',
            etapa_atual: `Rate limiting - próxima página: ${currentPage + 1}`,
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
    };
  }

  /**
   * Cancela sincronização
   */
  private async cancelarSincronizacao(
    syncLogId: string,
    currentPage: number,
    produtosProcessados: number,
  ): Promise<void> {
    const cancelPercentage = Math.min(10 + currentPage * 15, 95);
    await this.logService.updateLog(syncLogId, {
      status: 'cancelled',
      status_detalhado: 'cancelled_by_user',
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
    resultado: { totalProdutos: number; totalPagesProcessed: number },
    metodoFiltro: string,
    dataFiltro: string | null,
    operadorFiltro: string,
    startTime: number,
  ): Promise<void> {
    await this.progressService.updateProgress(syncLogId, {
      progress_percentage: 90,
      current_step: 'Atualizando tabelas de marcas, grupos e subgrupos...',
      products_processed: resultado.totalProdutos,
    });

    // Atualizar tabelas agregadas
    await this.processorService.atualizarTabelasAgregadas();

    // Atualizar progresso final
    const tempoTotal = Math.round((Date.now() - startTime) / 1000);
    await this.progressService.updateProgress(syncLogId, {
      progress_percentage: 100,
      current_step: 'Sincronização concluída com sucesso!',
      products_processed: resultado.totalProdutos,
    });

    // Atualizar log final
    await this.logService.updateLog(syncLogId, {
      status: 'completed',
      total_pages_found: resultado.totalPagesProcessed,
      pages_processed: resultado.totalPagesProcessed,
      total_produtos_bravo: resultado.totalProdutos,
      produtos_filtrados: resultado.totalProdutos,
      produtos_analisados: resultado.totalProdutos,
      tempo_total_segundos: tempoTotal,
      completed_at: new Date(),
      sync_details: {
        metodo_filtro_data: metodoFiltro,
        data_filtro_usada: dataFiltro,
        operador_filtro: operadorFiltro,
      } as Prisma.InputJsonValue,
      can_resume: false,
    });
  }

  /**
   * Executa teste de duplicatas (5 páginas)
   */
  private async executarTesteDuplicatas(): Promise<SyncResponseDto> {
    // TODO: Implementar teste de duplicatas se necessário
    throw new BadRequestException(
      'Teste de duplicatas ainda não implementado',
    );
  }
}
