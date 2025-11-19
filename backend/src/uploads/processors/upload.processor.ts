import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ExcelProcessorService } from '../excel-processor.service';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface UploadJobData {
  uploadId: string;
}

@Processor('upload-processing')
export class UploadProcessor {
  private readonly logger = new Logger(UploadProcessor.name);

  constructor(
    private readonly excelProcessor: ExcelProcessorService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('===== UploadProcessor INICIALIZADO =====');
    this.logger.log('Processador de uploads está pronto para processar jobs da fila "upload-processing"');
  }

  @Process('process-upload')
  async process(job: Job<UploadJobData>): Promise<void> {
    const { uploadId } = job.data;
    const startTime = Date.now();
    
    this.logger.log(`[${uploadId}] ===== INICIANDO PROCESSAMENTO DO JOB =====`);
    this.logger.log(`[${uploadId}] Job ID: ${job.id}`);
    this.logger.log(`[${uploadId}] Tentativa: ${job.attemptsMade + 1}/${job.opts.attempts || 1}`);
    
    // Atualizar status do upload
    try {
      await this.prisma.upload.update({
        where: { id: uploadId },
        data: { status: 'PROCESSANDO' },
      });
      this.logger.log(`[${uploadId}] Status atualizado para PROCESSANDO`);
    } catch (err) {
      this.logger.error(`[${uploadId}] Erro ao atualizar status:`, err);
      throw err;
    }
    
    try {
      // Processar arquivo Excel com callback de progresso
      this.logger.log(`[${uploadId}] Chamando excelProcessor.processUpload...`);
      await this.excelProcessor.processUpload(
        uploadId,
        async (progress: number, etapa: string) => {
          // No Bull, progress é uma função, não uma propriedade
          job.progress(progress);
          this.logger.log(`[${uploadId}] Progresso: ${progress}% - ${etapa}`);
        },
      );
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`[${uploadId}] ===== PROCESSAMENTO CONCLUÍDO COM SUCESSO =====`);
      this.logger.log(`[${uploadId}] Tempo total: ${elapsedTime}s`);
      
      // Verificar resultado final
      const uploadFinal = await this.prisma.upload.findUnique({
        where: { id: uploadId },
        include: {
          _count: {
            select: {
              linhas: true,
              alertas: true,
            },
          },
        },
      });
      
      if (uploadFinal) {
        this.logger.log(`[${uploadId}] Resultado final:`);
        this.logger.log(`[${uploadId}]   - Status: ${uploadFinal.status}`);
        this.logger.log(`[${uploadId}]   - Total de linhas: ${uploadFinal._count.linhas}`);
        this.logger.log(`[${uploadId}]   - Total de alertas: ${uploadFinal._count.alertas}`);
      }
    } catch (error) {
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.error(`[${uploadId}] ===== ERRO NO PROCESSAMENTO =====`);
      this.logger.error(`[${uploadId}] Tempo até erro: ${elapsedTime}s`);
      this.logger.error(`[${uploadId}] Erro:`, error);
      this.logger.error(`[${uploadId}] Stack:`, error instanceof Error ? error.stack : 'N/A');
      
      // Atualizar status do upload para erro
      try {
        await this.prisma.upload.update({
          where: { id: uploadId },
          data: { status: 'CANCELADO' },
        });
        this.logger.log(`[${uploadId}] Status atualizado para CANCELADO`);
      } catch (err) {
        this.logger.error(`[${uploadId}] Erro ao atualizar status para CANCELADO:`, err);
      }
      
      throw error;
    }
  }
}

