import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(file: Express.Multer.File, dto: CreateUploadDto, userId: string) {
    // Verificar se a empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
    });

    if (!empresa) {
      throw new BadRequestException('Empresa não encontrada');
    }

    // Calcular hash do arquivo
    const fileBuffer = fs.readFileSync(file.path);
    const hashArquivo = crypto.createHash('sha256').update(fileBuffer).digest('hex');

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

    // TODO: Adicionar à fila de processamento (BullMQ)
    // Por enquanto, apenas retornar o upload criado

    return upload;
  }
}
