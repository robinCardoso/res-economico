import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreatePrazoAcaoDto } from './dto/create-prazo-acao.dto';
import { UpdatePrazoAcaoDto } from './dto/update-prazo-acao.dto';
import { Prisma, StatusPrazo } from '@prisma/client';

@Injectable()
export class PrazoAcaoService {
  private readonly logger = new Logger(PrazoAcaoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo prazo
   */
  async create(ataId: string, dto: CreatePrazoAcaoDto, userId: string) {
    this.logger.log(`Criando prazo para ata ${ataId}: ${dto.titulo}`);

    // Verificar se a ata existe
    const ata = await this.prisma.ataReuniao.findUnique({
      where: { id: ataId },
      select: { id: true },
    });

    if (!ata) {
      throw new NotFoundException(`Ata com ID ${ataId} não encontrada`);
    }

    const dataPrazo = new Date(dto.dataPrazo);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Verificar se a data não é no passado (permitir apenas se for hoje ou futuro)
    if (dataPrazo < hoje) {
      throw new BadRequestException('A data do prazo não pode ser no passado');
    }

    // Determinar status inicial baseado na data
    let statusInicial: StatusPrazo = StatusPrazo.PENDENTE;
    if (dataPrazo.getTime() === hoje.getTime()) {
      statusInicial = StatusPrazo.EM_ANDAMENTO;
    }

    const prazo = await this.prisma.prazoAcao.create({
      data: {
        ataId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        dataPrazo,
        acaoId: dto.acaoId,
        status: dto.status || statusInicial,
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
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    // Agendar lembrete (será implementado depois)
    // await this.agendarLembrete(prazo.id);

    return prazo;
  }

  /**
   * Lista prazos de uma ata
   */
  async findByAta(ataId: string) {
    const prazos = await this.prisma.prazoAcao.findMany({
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
        dataPrazo: 'asc',
      },
    });

    return prazos;
  }

  /**
   * Busca um prazo específico
   */
  async findOne(id: string) {
    const prazo = await this.prisma.prazoAcao.findUnique({
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
        lembretes: {
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
        },
      },
    });

    if (!prazo) {
      throw new NotFoundException(`Prazo com ID ${id} não encontrado`);
    }

    return prazo;
  }

  /**
   * Atualiza um prazo
   */
  async update(id: string, dto: UpdatePrazoAcaoDto) {
    await this.findOne(id);

    const updateData: Prisma.PrazoAcaoUpdateInput = {};

    if (dto.titulo !== undefined) updateData.titulo = dto.titulo;
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao;
    if (dto.dataPrazo !== undefined) {
      const dataPrazo = new Date(dto.dataPrazo);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataPrazo < hoje) {
        throw new BadRequestException(
          'A data do prazo não pode ser no passado',
        );
      }

      updateData.dataPrazo = dataPrazo;
    }
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.concluido !== undefined) {
      updateData.concluido = dto.concluido;
      if (dto.concluido) {
        updateData.status = StatusPrazo.CONCLUIDO;
        updateData.dataConclusao = dto.dataConclusao
          ? new Date(dto.dataConclusao)
          : new Date();
      }
    }
    if (dto.dataConclusao !== undefined) {
      updateData.dataConclusao = dto.dataConclusao
        ? new Date(dto.dataConclusao)
        : null;
    }

    const prazoAtualizado = await this.prisma.prazoAcao.update({
      where: { id },
      data: updateData,
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

    return prazoAtualizado;
  }

  /**
   * Remove um prazo
   */
  async remove(id: string, userId: string) {
    const prazo = await this.findOne(id);

    // Verificar permissão
    if (prazo.criadoPor !== userId) {
      throw new NotFoundException(
        'Você não tem permissão para remover este prazo',
      );
    }

    await this.prisma.prazoAcao.delete({
      where: { id },
    });

    return { message: 'Prazo removido com sucesso' };
  }

  /**
   * Verifica prazos vencidos
   */
  async verificarPrazosVencidos() {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const prazosVencidos = await this.prisma.prazoAcao.findMany({
      where: {
        dataPrazo: { lt: hoje },
        concluido: false,
        status: { not: StatusPrazo.CONCLUIDO },
      },
      include: {
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    // Atualizar status para VENCIDO
    for (const prazo of prazosVencidos) {
      if (prazo.status !== StatusPrazo.VENCIDO) {
        await this.prisma.prazoAcao.update({
          where: { id: prazo.id },
          data: { status: StatusPrazo.VENCIDO },
        });
      }
    }

    return prazosVencidos;
  }

  /**
   * Verifica prazos próximos (3 dias antes)
   */
  async verificarPrazosProximos() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const tresDiasDepois = new Date(hoje);
    tresDiasDepois.setDate(tresDiasDepois.getDate() + 3);
    tresDiasDepois.setHours(23, 59, 59, 999);

    const prazosProximos = await this.prisma.prazoAcao.findMany({
      where: {
        dataPrazo: {
          gte: hoje,
          lte: tresDiasDepois,
        },
        concluido: false,
        status: { not: StatusPrazo.CONCLUIDO },
      },
      include: {
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return prazosProximos;
  }

  /**
   * Lista todos os prazos do usuário
   */
  async findByUsuario(usuarioId: string) {
    return this.prisma.prazoAcao.findMany({
      where: {
        criadoPor: usuarioId,
      },
      include: {
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
      orderBy: {
        dataPrazo: 'asc',
      },
    });
  }
}
