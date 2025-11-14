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
  ) {}

  @Process('process-upload')
  async process(job: Job<UploadJobData>): Promise<void> {
    const { uploadId } = job.data;
    
    this.logger.log(`Processando upload ${uploadId}...`);
    
    // Atualizar status do upload
    await this.prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSANDO' },
    }).catch((err) => {
      this.logger.error(`Erro ao atualizar status do upload ${uploadId}:`, err);
    });
    
    try {
      // Processar arquivo Excel com callback de progresso
      await this.excelProcessor.processUpload(
        uploadId,
        async (progress: number, etapa: string) => {
          // No Bull, progress é uma função, não uma propriedade
          job.progress(progress);
          this.logger.log(`Upload ${uploadId}: ${etapa} (${progress}%)`);
        },
      );
      
      this.logger.log(`Upload ${uploadId} processado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao processar upload ${uploadId}:`, error);
      
      // Atualizar status do upload para erro
      await this.prisma.upload.update({
        where: { id: uploadId },
        data: { status: 'CANCELADO' },
      }).catch((err) => {
        this.logger.error(`Erro ao atualizar status do upload ${uploadId}:`, err);
      });
      
      throw error;
    }
  }
}

