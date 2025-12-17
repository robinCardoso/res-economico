import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateVendaAnalyticsFilterDto } from './dto/create-venda-analytics-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendasAnalyticsFilterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos os filtros salvos (globais para todas as empresas)
   */
  async findAll() {
    return this.prisma.vendaAnalyticsFilter.findMany({
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
   * Busca um filtro por ID
   */
  async findOne(id: string) {
    const filter = await this.prisma.vendaAnalyticsFilter.findUnique({
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

    if (!filter) {
      throw new NotFoundException('Filtro não encontrado');
    }

    return filter;
  }

  /**
   * Cria um novo filtro
   */
  async create(dto: CreateVendaAnalyticsFilterDto, userId?: string) {
    // Validar se já existe filtro com o mesmo nome
    const existing = await this.prisma.vendaAnalyticsFilter.findFirst({
      where: { nome: dto.nome },
    });

    if (existing) {
      throw new BadRequestException(
        `Já existe um filtro com o nome "${dto.nome}"`,
      );
    }

    return this.prisma.vendaAnalyticsFilter.create({
      data: {
        nome: dto.nome,
        filters: dto.filters as Prisma.InputJsonValue,
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
   * Atualiza um filtro existente
   */
  async update(id: string, dto: Partial<CreateVendaAnalyticsFilterDto>) {
    await this.findOne(id); // Verificar se existe

    // Se estiver atualizando o nome, verificar se não existe outro com o mesmo nome
    if (dto.nome) {
      const existing = await this.prisma.vendaAnalyticsFilter.findFirst({
        where: {
          nome: dto.nome,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Já existe um filtro com o nome "${dto.nome}"`,
        );
      }
    }

    const updateData: Prisma.VendaAnalyticsFilterUpdateInput = {};

    if (dto.nome) updateData.nome = dto.nome;
    if (dto.filters) updateData.filters = dto.filters as Prisma.InputJsonValue;
    if (dto.descricao !== undefined)
      updateData.descricao = dto.descricao || null;

    return this.prisma.vendaAnalyticsFilter.update({
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
   * Deleta um filtro
   */
  async remove(id: string) {
    await this.findOne(id); // Verificar se existe

    await this.prisma.vendaAnalyticsFilter.delete({
      where: { id },
    });

    return { success: true, message: 'Filtro deletado com sucesso' };
  }
}
