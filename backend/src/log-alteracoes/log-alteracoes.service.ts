import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import { FilterLogsDto } from './dto/filter-logs.dto';
import { TipoAlteracaoAta, Prisma } from '@prisma/client';

@Injectable()
export class LogAlteracoesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um log de alteração
   */
  async create(dto: CreateLogDto) {
    return this.prisma.logAlteracaoAta.create({
      data: {
        ...dto,
        metadata: dto.metadata
          ? (dto.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });
  }

  /**
   * Lista logs com filtros
   */
  async findAll(filters: FilterLogsDto) {
    const where: Prisma.LogAlteracaoAtaWhereInput = {};

    if (filters.ataId) {
      where.ataId = filters.ataId;
    }

    if (filters.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    if (filters.tipoAlteracao) {
      where.tipoAlteracao = filters.tipoAlteracao;
    }

    if (filters.dataInicio || filters.dataFim) {
      where.createdAt = {};
      if (filters.dataInicio) {
        where.createdAt.gte = new Date(filters.dataInicio);
      }
      if (filters.dataFim) {
        where.createdAt.lte = new Date(filters.dataFim);
      }
    }

    if (filters.busca) {
      where.OR = [
        { descricao: { contains: filters.busca, mode: 'insensitive' } },
        { campo: { contains: filters.busca, mode: 'insensitive' } },
      ];
    }

    return this.prisma.logAlteracaoAta.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limitar a 100 resultados
    });
  }

  /**
   * Busca logs de uma ata específica
   */
  async findByAta(ataId: string) {
    return this.prisma.logAlteracaoAta.findMany({
      where: { ataId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Busca um log específico
   */
  async findOne(id: string) {
    return this.prisma.logAlteracaoAta.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });
  }

  /**
   * Registra uma alteração de forma simplificada
   */
  async registrarAlteracao(
    ataId: string,
    usuarioId: string,
    tipoAlteracao: TipoAlteracaoAta,
    options?: {
      campo?: string;
      valorAnterior?: string;
      valorNovo?: string;
      descricao?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.create({
      ataId,
      usuarioId,
      tipoAlteracao,
      campo: options?.campo,
      valorAnterior: options?.valorAnterior,
      valorNovo: options?.valorNovo,
      descricao: options?.descricao,
      metadata: options?.metadata,
    });
  }
}
