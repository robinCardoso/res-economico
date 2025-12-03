import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateHistoricoAndamentoDto } from './dto/create-historico-andamento.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class HistoricoAndamentoService {
  private readonly logger = new Logger(HistoricoAndamentoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma nova entrada no histórico
   */
  async create(
    ataId: string,
    dto: CreateHistoricoAndamentoDto,
    userId: string,
  ) {
    this.logger.log(`Adicionando histórico à ata ${ataId}: ${dto.acao}`);

    // Verificar se a ata existe
    const ata = await this.prisma.ataReuniao.findUnique({
      where: { id: ataId },
      select: { id: true },
    });

    if (!ata) {
      throw new NotFoundException(`Ata com ID ${ataId} não encontrada`);
    }

    const historico = await this.prisma.historicoAndamento.create({
      data: {
        ataId,
        acao: dto.acao,
        descricao: dto.descricao,
        responsavel: dto.responsavel,
        data: dto.data ? new Date(dto.data) : new Date(),
        criadoPor: userId,
      },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return historico;
  }

  /**
   * Lista histórico de uma ata
   */
  async findByAta(ataId: string) {
    const historico = await this.prisma.historicoAndamento.findMany({
      where: { ataId },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        data: 'desc',
      },
    });

    return historico;
  }

  /**
   * Busca uma entrada específica
   */
  async findOne(id: string) {
    const historico = await this.prisma.historicoAndamento.findUnique({
      where: { id },
      include: {
        criador: {
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

    if (!historico) {
      throw new NotFoundException(`Histórico com ID ${id} não encontrado`);
    }

    return historico;
  }

  /**
   * Remove uma entrada do histórico
   */
  async remove(id: string, userId: string) {
    const historico = await this.findOne(id);

    // Verificar se o usuário tem permissão (pode ser o criador ou admin)
    // Por enquanto, permitir remoção se for o criador
    if (historico.criadoPor !== userId) {
      throw new NotFoundException(
        'Você não tem permissão para remover este histórico',
      );
    }

    await this.prisma.historicoAndamento.delete({
      where: { id },
    });

    return { message: 'Histórico removido com sucesso' };
  }
}
