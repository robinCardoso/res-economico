import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreatePedidoAnalyticsFilterDto } from './dto/create-pedido-analytics-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PedidosAnalyticsFilterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos os filtros salvos (globais para todas as empresas)
   */
  async findAll() {
    return this.prisma.pedidoAnalyticsFilter.findMany({
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
    const filter = await this.prisma.pedidoAnalyticsFilter.findUnique({
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
  async create(dto: CreatePedidoAnalyticsFilterDto, userId?: string) {
    // Validar se já existe filtro com o mesmo nome
    const existing = await this.prisma.pedidoAnalyticsFilter.findFirst({
      where: { nome: dto.nome },
    });

    if (existing) {
      throw new BadRequestException(
        `Já existe um filtro com o nome "${dto.nome}"`,
      );
    }

    return this.prisma.pedidoAnalyticsFilter.create({
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
  async update(id: string, dto: Partial<CreatePedidoAnalyticsFilterDto>) {
    await this.findOne(id); // Verificar se existe

    // Se estiver atualizando o nome, verificar se não existe outro com o mesmo nome
    if (dto.nome) {
      const existing = await this.prisma.pedidoAnalyticsFilter.findFirst({
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

    const updateData: Prisma.PedidoAnalyticsFilterUpdateInput = {};

    if (dto.nome) updateData.nome = dto.nome;
    if (dto.filters) updateData.filters = dto.filters as Prisma.InputJsonValue;
    if (dto.descricao !== undefined)
      updateData.descricao = dto.descricao || null;

    return this.prisma.pedidoAnalyticsFilter.update({
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

    await this.prisma.pedidoAnalyticsFilter.delete({
      where: { id },
    });

    return { success: true, message: 'Filtro deletado com sucesso' };
  }
}

