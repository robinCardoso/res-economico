import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.templateImportacao.findMany({
      include: {
        empresa: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.templateImportacao.findUnique({
      where: { id },
      include: {
        empresa: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return template;
  }

  async create(dto: CreateTemplateDto) {
    // Normalizar empresaId: string vazia ou null = template global
    const empresaId =
      dto.empresaId && dto.empresaId.trim() !== '' ? dto.empresaId : null;

    // Se empresaId foi fornecido, verificar se a empresa existe
    if (empresaId) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
      });

      if (!empresa) {
        throw new BadRequestException('Empresa não encontrada');
      }
    }

    return this.prisma.templateImportacao.create({
      data: {
        empresaId, // null = template global
        nome: dto.nome,
        descricao: dto.descricao || null,
        configuracao: {
          columnMapping: dto.columnMapping as Record<string, unknown>,
        } as unknown as Prisma.InputJsonValue, // Prisma JSON type
      },
      include: {
        empresa: true,
      },
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id); // Verificar se existe

    // Normalizar empresaId: string vazia ou null = template global
    let empresaId: string | null = null;
    if (dto.empresaId !== undefined && dto.empresaId !== null) {
      empresaId = dto.empresaId.trim() !== '' ? dto.empresaId : null;
    }

    // Se empresaId foi fornecido, verificar se a empresa existe
    if (dto.empresaId !== undefined && empresaId) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
      });

      if (!empresa) {
        throw new BadRequestException('Empresa não encontrada');
      }
    }

    const updateData: {
      nome?: string;
      descricao?: string | null;
      empresaId?: string | null;
      configuracao?: Prisma.InputJsonValue; // Prisma JSON type
    } = {};

    if (dto.nome) updateData.nome = dto.nome;
    if (dto.descricao !== undefined)
      updateData.descricao = dto.descricao || null;
    // Permite definir empresaId como null (template global) ou uma empresa específica
    if (dto.empresaId !== undefined) {
      updateData.empresaId = empresaId;
    }
    if (dto.columnMapping) {
      updateData.configuracao = {
        columnMapping: dto.columnMapping as Record<string, unknown>,
      } as Prisma.InputJsonValue;
    }

    return this.prisma.templateImportacao.update({
      where: { id },
      data: updateData as unknown as Prisma.TemplateImportacaoUpdateInput, // Prisma types with nullable empresaId
      include: {
        empresa: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verificar se existe

    // Verificar se há uploads usando este template
    const uploads = await this.prisma.upload.count({
      where: { templateId: id },
    });

    if (uploads > 0) {
      throw new BadRequestException(
        'Não é possível excluir template com uploads associados',
      );
    }

    return this.prisma.templateImportacao.delete({
      where: { id },
    });
  }
}
