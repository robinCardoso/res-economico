import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { ExcelProcessorService } from './excel-processor.service';
import { AuditoriaService } from '../core/auditoria/auditoria.service';
import * as crypto from 'crypto';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelProcessor: ExcelProcessorService,
    private readonly auditoria: AuditoriaService,
    @InjectQueue('upload-processing')
    private readonly uploadQueue: Queue,
  ) {}

  findAll() {
    return this.prisma.upload.findMany({
      include: {
        empresa: true,
        alertas: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.upload.findUnique({
      where: { id },
      include: {
        linhas: true,
        alertas: true,
        empresa: true,
      },
    });
  }

  async create(
    file: Express.Multer.File,
    dto: CreateUploadDto,
    userId: string,
  ) {
    // Verificar se a empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
    });

    if (!empresa) {
      throw new BadRequestException('Empresa não encontrada');
    }

    // Calcular hash do arquivo
    const fileBuffer = fs.readFileSync(file.path);
    const hashArquivo = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    // Verificar se já existe upload com mesmo hash, empresa, mês e ano
    const uploadExistente = await this.prisma.upload.findFirst({
      where: {
        empresaId: dto.empresaId,
        mes: dto.mes,
        ano: dto.ano,
        hashArquivo,
      },
    });

    if (uploadExistente) {
      // Remover arquivo duplicado
      fs.unlinkSync(file.path);
      throw new BadRequestException(
        'Já existe um upload com este arquivo para esta empresa e período',
      );
    }

    // Criar URL do arquivo (por enquanto local, depois migrar para Supabase)
    const arquivoUrl = `/uploads/${file.filename}`;

    // Criar registro de upload
    const upload = await this.prisma.upload.create({
      data: {
        empresaId: dto.empresaId,
        templateId: dto.templateId,
        mes: dto.mes,
        ano: dto.ano,
        arquivoUrl,
        nomeArquivo: file.originalname || file.filename || 'arquivo.xls', // Salvar nome original do arquivo
        hashArquivo,
        status: 'PROCESSANDO',
        totalLinhas: 0, // Será atualizado durante o processamento
        createdBy: userId,
      },
      include: {
        empresa: true,
        template: true,
      },
    });

    // Adicionar job na fila para processamento assíncrono
    await this.uploadQueue.add(
      'process-upload',
      { uploadId: upload.id },
      {
        jobId: upload.id, // Usar uploadId como jobId para facilitar busca
        attempts: 3, // Tentar até 3 vezes em caso de falha
        backoff: {
          type: 'exponential',
          delay: 2000, // Delay inicial de 2 segundos
        },
      },
    );

    // Registrar auditoria
    await this.auditoria.registrarUpload(userId, upload.id, 'CRIAR');

    return upload;
  }

  async limparProcessamento(uploadId: string) {
    // Deletar linhas e alertas existentes
    await this.prisma.linhaUpload.deleteMany({
      where: { uploadId },
    });

    await this.prisma.alerta.deleteMany({
      where: { uploadId },
    });

    // Resetar status
    await this.prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: 'PROCESSANDO',
        totalLinhas: 0,
      },
    });
  }

  async reprocessar(uploadId: string, userId?: string) {
    // Limpar processamento anterior
    await this.limparProcessamento(uploadId);

    // Adicionar job na fila para reprocessamento
    await this.uploadQueue.add(
      'process-upload',
      { uploadId },
      {
        jobId: uploadId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    // Registrar auditoria
    if (userId) {
      await this.auditoria.registrarUpload(userId, uploadId, 'REPROCESSAR');
    }
  }

  async remove(id: string, userId?: string) {
    // Buscar upload para obter o caminho do arquivo
    const upload = await this.prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      throw new BadRequestException('Upload não encontrado');
    }

    // Remover arquivo físico se existir
    const filePath = upload.arquivoUrl.replace('/uploads/', './uploads/');
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Erro ao remover arquivo ${filePath}:`, error);
        // Continuar mesmo se não conseguir remover o arquivo
      }
    }

    // Deletar upload (Prisma vai deletar em cascata: linhas e alertas)
    // onDelete: Cascade no schema garante que LinhaUpload e Alerta serão deletados automaticamente
    await this.prisma.upload.delete({
      where: { id },
    });

    // Registrar auditoria
    if (userId) {
      await this.auditoria.registrarUpload(userId, id, 'REMOVER');
    }

    return { message: 'Upload removido com sucesso' };
  }

  async getProgress(uploadId: string) {
    try {
      const job = await this.uploadQueue.getJob(uploadId);
      if (!job) {
        return { progress: 0, etapa: 'Aguardando processamento' };
      }

      // No Bull, progress() retorna o valor quando chamada sem argumentos
      const progressValue = (job.progress() as number) || 0;
      
      const state = await job.getState();
      
      return {
        progress: progressValue,
        estado: state,
        etapa: progressValue < 20 ? 'Lendo arquivo...' :
               progressValue < 50 ? 'Processando linhas...' :
               progressValue < 70 ? 'Criando registros...' :
               progressValue < 80 ? 'Atualizando catálogo...' :
               progressValue < 95 ? 'Detectando alertas...' :
               progressValue < 100 ? 'Finalizando...' : 'Concluído',
      };
    } catch (error) {
      console.error(`Erro ao buscar progresso do upload ${uploadId}:`, error);
      return { progress: 0, etapa: 'Erro ao buscar progresso' };
    }
  }
}
