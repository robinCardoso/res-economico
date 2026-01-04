import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { FilterAuditoriaDto } from './dto/filter-auditoria.dto';

@Injectable()
export class AuditoriaLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: FilterAuditoriaDto) {
    const where: Record<string, unknown> = {};

    // Filtro por recurso
    if (filters?.recurso) {
      where.recurso = filters.recurso;
    }

    // Filtro por ação
    if (filters?.acao) {
      where.acao = filters.acao;
    }

    // Filtro por usuário
    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    // Filtro por data
    if (filters?.dataInicio || filters?.dataFim) {
      const createdAtFilter: Record<string, unknown> = {};
      if (filters.dataInicio) {
        createdAtFilter.gte = new Date(filters.dataInicio);
      }
      if (filters.dataFim) {
        createdAtFilter.lte = new Date(filters.dataFim);
      }
      where.createdAt = createdAtFilter;
    }

    // Busca por texto (recurso ou ação)
    if (filters?.busca) {
      where.OR = [
        { recurso: { contains: filters.busca } },
        { acao: { contains: filters.busca } },
      ];
    }

    return this.prisma.logAuditoria.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limitar a 1000 registros por padrão
    });
  }

  async findOne(id: string) {
    return this.prisma.logAuditoria.findUnique({
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
  }

  async getRecursos() {
    const recursos = await this.prisma.logAuditoria.findMany({
      select: { recurso: true },
      distinct: ['recurso'],
    });
    return recursos.map((r) => r.recurso);
  }

  async getAcoes() {
    const acoes = await this.prisma.logAuditoria.findMany({
      select: { acao: true },
      distinct: ['acao'],
    });
    return acoes.map((a) => a.acao);
  }
}
