import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateVendaColumnMappingDto } from './dto/create-venda-column-mapping.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendasColumnMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos os mapeamentos (globais para todas as empresas)
   */
  async findAll() {
    return this.prisma.vendaColumnMapping.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Busca um mapeamento por ID
   */
  async findOne(id: string) {
    const mapping = await this.prisma.vendaColumnMapping.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException('Mapeamento não encontrado');
    }

    return mapping;
  }

  /**
   * Cria um novo mapeamento
   */
  async create(
    dto: CreateVendaColumnMappingDto,
    userId?: string,
  ) {
    // Validar se já existe mapeamento com o mesmo nome
    const existing = await this.prisma.vendaColumnMapping.findFirst({
      where: { nome: dto.nome },
    });

    if (existing) {
      throw new BadRequestException(
        `Já existe um mapeamento com o nome "${dto.nome}"`,
      );
    }

    return this.prisma.vendaColumnMapping.create({
      data: {
        nome: dto.nome,
        columnMapping: dto.columnMapping as Prisma.InputJsonValue,
        filters: dto.filters
          ? (dto.filters as Prisma.InputJsonValue)
          : undefined,
        descricao: dto.descricao || null,
        usuarioId: userId || null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Atualiza um mapeamento existente
   */
  async update(
    id: string,
    dto: Partial<CreateVendaColumnMappingDto>,
  ) {
    await this.findOne(id); // Verificar se existe

    // Se estiver atualizando o nome, verificar se não existe outro com o mesmo nome
    if (dto.nome) {
      const existing = await this.prisma.vendaColumnMapping.findFirst({
        where: {
          nome: dto.nome,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Já existe um mapeamento com o nome "${dto.nome}"`,
        );
      }
    }

    const updateData: Prisma.VendaColumnMappingUpdateInput = {};

    if (dto.nome) updateData.nome = dto.nome;
    if (dto.columnMapping)
      updateData.columnMapping = dto.columnMapping as Prisma.InputJsonValue;
    if (dto.filters !== undefined)
      updateData.filters = dto.filters
        ? (dto.filters as Prisma.InputJsonValue)
        : undefined;
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao || null;

    return this.prisma.vendaColumnMapping.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Deleta um mapeamento
   */
  async remove(id: string) {
    await this.findOne(id); // Verificar se existe

    await this.prisma.vendaColumnMapping.delete({
      where: { id },
    });

    return { success: true, message: 'Mapeamento deletado com sucesso' };
  }
}
