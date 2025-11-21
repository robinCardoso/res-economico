import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { ExcelProcessorService } from './excel-processor.service';
import { AuditoriaService } from '../core/auditoria/auditoria.service';
import * as crypto from 'crypto';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly excelProcessor: ExcelProcessorService,
    private readonly auditoria: AuditoriaService,
    private readonly cache: CacheService,
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

  /**
   * Busca uploads com filtros opcionais
   */
  async findWithFilters(empresaId?: string, ano?: number, mes?: number) {
    const where: Record<string, unknown> = {
      status: {
        in: ['CONCLUIDO', 'COM_ALERTAS'],
      },
    };

    if (empresaId) {
      where.empresaId = empresaId;
    }

    if (ano) {
      where.ano = ano;
    }

    if (mes) {
      where.mes = mes;
    }

    return this.prisma.upload.findMany({
      where,
      include: {
        empresa: true,
        alertas: {
          where: {
            status: 'ABERTO',
          },
        },
      },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { createdAt: 'desc' }],
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

  /**
   * Verifica se já existe upload com a mesma empresa, mês e ano
   */
  async verificarDuplicataPeriodo(empresaId: string, mes: number, ano: number) {
    const uploadExistente = await this.prisma.upload.findFirst({
      where: {
        empresaId,
        mes,
        ano,
      },
      include: {
        empresa: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return uploadExistente;
  }

  /**
   * Verifica se já existe upload com o mesmo nome de arquivo
   */
  async verificarDuplicataNomeArquivo(nomeArquivo: string) {
    const uploadExistente = await this.prisma.upload.findFirst({
      where: {
        nomeArquivo,
      },
      include: {
        empresa: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return uploadExistente;
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

    // Corrigir encoding do nome do arquivo (pode vir com encoding incorreto do multipart/form-data)
    let nomeArquivo = file.originalname || file.filename || 'arquivo.xls';
    try {
      // Tentar corrigir encoding: se contém padrões de encoding incorreto (UTF-8 sendo interpretado como Latin-1)
      // Exemplo: "UniÃ£o" → "União"
      if (
        nomeArquivo.includes('Ã') ||
        nomeArquivo.includes('Â') ||
        nomeArquivo.includes('Õ')
      ) {
        const corrected = Buffer.from(nomeArquivo, 'latin1').toString('utf8');
        // Se a correção produz resultado diferente e válido, usar
        if (corrected !== nomeArquivo && !corrected.includes('\uFFFD')) {
          this.logger.log(
            `Nome do arquivo corrigido de encoding: ${file.originalname} → ${corrected}`,
          );
          nomeArquivo = corrected;
        }
      }
    } catch (error) {
      this.logger.warn(
        `Erro ao corrigir encoding do nome do arquivo: ${error}`,
      );
      // Manter o nome original se houver erro
    }

    // Verificar se já existe upload com o mesmo nome de arquivo
    const uploadComMesmoNome =
      await this.verificarDuplicataNomeArquivo(nomeArquivo);
    if (uploadComMesmoNome) {
      // Remover arquivo duplicado
      fs.unlinkSync(file.path);
      throw new BadRequestException(
        `Já existe um upload com o arquivo "${nomeArquivo}". Não é permitido fazer upload de arquivos com o mesmo nome.`,
      );
    }

    // Criar registro de upload
    const upload = await this.prisma.upload.create({
      data: {
        empresaId: dto.empresaId,
        templateId: dto.templateId,
        mes: dto.mes,
        ano: dto.ano,
        arquivoUrl,
        nomeArquivo, // Nome corrigido com encoding UTF-8
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

    // Invalidar cache de anos e meses disponíveis (será atualizado quando o upload for concluído)
    await this.invalidarCacheRelatorios();

    return upload;
  }

  /**
   * Invalida cache de relatórios quando há mudanças nos uploads
   */
  private async invalidarCacheRelatorios(): Promise<void> {
    try {
      await this.cache.delPattern('relatorios:anos-disponiveis');
      await this.cache.delPattern('relatorios:meses-disponiveis:*');
      this.logger.debug('Cache de relatórios invalidado');
    } catch (error) {
      this.logger.warn('Erro ao invalidar cache de relatórios:', error);
    }
  }

  async limparProcessamento(uploadId: string) {
    this.logger.log(
      `[${uploadId}] Iniciando limpeza de processamento anterior...`,
    );

    // Deletar linhas e alertas existentes
    const linhasDeletadas = await this.prisma.linhaUpload.deleteMany({
      where: { uploadId },
    });
    this.logger.log(`[${uploadId}] ${linhasDeletadas.count} linhas deletadas`);

    const alertasDeletados = await this.prisma.alerta.deleteMany({
      where: { uploadId },
    });
    this.logger.log(
      `[${uploadId}] ${alertasDeletados.count} alertas deletados`,
    );

    // Resetar status
    await this.prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: 'PROCESSANDO',
        totalLinhas: 0,
      },
    });
    this.logger.log(`[${uploadId}] Status resetado para PROCESSANDO`);
  }

  async reprocessar(uploadId: string, userId?: string) {
    this.logger.log(`[${uploadId}] ===== INICIANDO REPROCESSAMENTO =====`);
    this.logger.log(`[${uploadId}] Usuário: ${userId || 'system'}`);

    // Verificar se o upload existe
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: { empresa: true },
    });

    if (!upload) {
      this.logger.error(`[${uploadId}] Upload não encontrado!`);
      throw new BadRequestException('Upload não encontrado');
    }

    this.logger.log(
      `[${uploadId}] Upload encontrado: ${upload.nomeArquivo} - ${upload.empresa?.razaoSocial}`,
    );
    this.logger.log(`[${uploadId}] Status atual: ${upload.status}`);
    this.logger.log(`[${uploadId}] Arquivo: ${upload.arquivoUrl}`);

    // Verificar se o arquivo existe
    const filePath = upload.arquivoUrl.replace('/uploads/', './uploads/');
    if (!fs.existsSync(filePath)) {
      this.logger.error(
        `[${uploadId}] Arquivo não encontrado no caminho: ${filePath}`,
      );
      throw new BadRequestException(
        `Arquivo não encontrado: ${upload.nomeArquivo}`,
      );
    }
    this.logger.log(`[${uploadId}] Arquivo encontrado: ${filePath}`);

    // Limpar processamento anterior
    this.logger.log(`[${uploadId}] Limpando dados anteriores...`);
    await this.limparProcessamento(uploadId);

    // Verificar e remover job existente (qualquer estado)
    try {
      const existingJob = await this.uploadQueue.getJob(uploadId);
      if (existingJob) {
        const state = await existingJob.getState();
        this.logger.warn(
          `[${uploadId}] Job existente encontrado com estado: ${state}`,
        );

        // Remover job independente do estado (completed, failed, etc.)
        this.logger.warn(
          `[${uploadId}] Removendo job existente (estado: ${state})...`,
        );
        await existingJob.remove();
        this.logger.log(`[${uploadId}] Job existente removido com sucesso`);

        // Aguardar um pouco para garantir que o Redis processou a remoção
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      this.logger.warn(
        `[${uploadId}] Erro ao verificar/remover job existente: ${error}`,
      );
      // Continuar mesmo se houver erro
    }

    // Adicionar job na fila para reprocessamento
    // Usar um ID único para cada reprocessamento para evitar conflitos
    const jobId = `${uploadId}-${Date.now()}`;
    this.logger.log(
      `[${uploadId}] Adicionando job na fila de processamento com ID: ${jobId}...`,
    );
    const job = await this.uploadQueue.add(
      'process-upload',
      { uploadId },
      {
        jobId: jobId, // ID único para cada reprocessamento
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false, // Manter histórico do job
        removeOnFail: false, // Manter histórico mesmo em caso de falha
      },
    );
    this.logger.log(`[${uploadId}] Job adicionado com ID: ${job.id}`);

    // Verificar estado do job imediatamente após adicionar
    try {
      const jobState = await job.getState();
      this.logger.log(
        `[${uploadId}] Estado do job após adicionar: ${jobState}`,
      );

      // Listar jobs na fila para debug
      const waitingJobs = await this.uploadQueue.getWaiting();
      const activeJobs = await this.uploadQueue.getActive();
      const completedJobs = await this.uploadQueue.getCompleted();
      const failedJobs = await this.uploadQueue.getFailed();

      this.logger.log(`[${uploadId}] Status da fila:`);
      this.logger.log(
        `[${uploadId}]   - Jobs aguardando: ${waitingJobs.length}`,
      );
      this.logger.log(`[${uploadId}]   - Jobs ativos: ${activeJobs.length}`);
      this.logger.log(
        `[${uploadId}]   - Jobs completados: ${completedJobs.length}`,
      );
      this.logger.log(`[${uploadId}]   - Jobs falhados: ${failedJobs.length}`);

      // Se o job está aguardando, verificar se há processador ativo
      if (jobState === 'waiting' || jobState === 'delayed') {
        this.logger.warn(
          `[${uploadId}] ⚠️ Job está aguardando processamento. Verifique se o UploadProcessor está registrado e ativo.`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `[${uploadId}] Erro ao verificar estado do job: ${error}`,
      );
    }

    // Registrar auditoria
    if (userId) {
      await this.auditoria.registrarUpload(userId, uploadId, 'REPROCESSAR');
    }

    this.logger.log(
      `[${uploadId}] ===== REPROCESSAMENTO INICIADO COM SUCESSO =====`,
    );
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
        etapa:
          progressValue < 20
            ? 'Lendo arquivo...'
            : progressValue < 50
              ? 'Processando linhas...'
              : progressValue < 70
                ? 'Criando registros...'
                : progressValue < 80
                  ? 'Atualizando catálogo...'
                  : progressValue < 95
                    ? 'Detectando alertas...'
                    : progressValue < 100
                      ? 'Finalizando...'
                      : 'Concluído',
      };
    } catch (error) {
      console.error(`Erro ao buscar progresso do upload ${uploadId}:`, error);
      return { progress: 0, etapa: 'Erro ao buscar progresso' };
    }
  }
}
