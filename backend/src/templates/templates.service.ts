import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
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
    // Verificar se a empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
    });

    if (!empresa) {
      throw new BadRequestException('Empresa não encontrada');
    }

    return this.prisma.templateImportacao.create({
      data: {
        empresaId: dto.empresaId,
        nome: dto.nome,
        descricao: dto.descricao || null,
        configuracao: {
          columnMapping: dto.columnMapping,
        },
      },
      include: {
        empresa: true,
      },
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id); // Verificar se existe

    if (dto.empresaId) {
      // Verificar se a empresa existe
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: dto.empresaId },
      });

      if (!empresa) {
        throw new BadRequestException('Empresa não encontrada');
      }
    }

    const updateData: any = {};
    if (dto.nome) updateData.nome = dto.nome;
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao || null;
    if (dto.empresaId) updateData.empresaId = dto.empresaId;
    if (dto.columnMapping) {
      updateData.configuracao = {
        columnMapping: dto.columnMapping,
      };
    }

    return this.prisma.templateImportacao.update({
      where: { id },
      data: updateData,
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
