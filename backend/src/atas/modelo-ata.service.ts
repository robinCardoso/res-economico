import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateModeloAtaDto } from './dto/create-modelo-ata.dto';
import { UpdateModeloAtaDto } from './dto/update-modelo-ata.dto';
import { FilterModeloAtaDto } from './dto/filter-modelo-ata.dto';
import { Prisma, TipoReuniao } from '@prisma/client';

@Injectable()
export class ModeloAtaService {
  private readonly logger = new Logger(ModeloAtaService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo modelo de ata
   */
  async create(dto: CreateModeloAtaDto, userId: string) {
    this.logger.log(`Criando novo modelo de ata: ${dto.nome}`);

    const modelo = await this.prisma.modeloAta.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        tipoReuniao: dto.tipoReuniao,
        estrutura: dto.estrutura,
        exemplo: dto.exemplo,
        instrucoes: dto.instrucoes,
        ativo: dto.ativo ?? true,
        criadoPor: userId,
        empresaId: dto.empresaId,
      },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            filial: true,
          },
        },
      },
    });

    return modelo;
  }

  /**
   * Lista modelos de atas com filtros
   */
  async findAll(filters: FilterModeloAtaDto) {
    const where: Prisma.ModeloAtaWhereInput = {};

    if (filters.tipoReuniao) {
      where.tipoReuniao = filters.tipoReuniao;
    }

    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    if (filters.empresaId) {
      where.empresaId = filters.empresaId;
    }

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const modelos = await this.prisma.modeloAta.findMany({
      where,
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            filial: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return modelos;
  }

  /**
   * Busca um modelo por ID
   */
  async findOne(id: string) {
    const modelo = await this.prisma.modeloAta.findUnique({
      where: { id },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            filial: true,
          },
        },
      },
    });

    if (!modelo) {
      throw new NotFoundException(`Modelo de ata com ID ${id} não encontrado`);
    }

    return modelo;
  }

  /**
   * Busca modelo por tipo de reunião
   */
  async findByTipoReuniao(tipoReuniao: TipoReuniao, empresaId?: string) {
    const where: Prisma.ModeloAtaWhereInput = {
      tipoReuniao,
      ativo: true,
    };

    if (empresaId) {
      where.OR = [
        { empresaId },
        { empresaId: null }, // Modelos globais
      ];
    } else {
      where.empresaId = null; // Apenas modelos globais
    }

    const modelo = await this.prisma.modeloAta.findFirst({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return modelo;
  }

  /**
   * Atualiza um modelo
   */
  async update(id: string, dto: UpdateModeloAtaDto) {
    await this.findOne(id);

    const updateData: Prisma.ModeloAtaUpdateInput = {};

    if (dto.nome !== undefined) updateData.nome = dto.nome;
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao;
    if (dto.tipoReuniao !== undefined) updateData.tipoReuniao = dto.tipoReuniao;
    if (dto.estrutura !== undefined) updateData.estrutura = dto.estrutura;
    if (dto.exemplo !== undefined) updateData.exemplo = dto.exemplo;
    if (dto.instrucoes !== undefined) updateData.instrucoes = dto.instrucoes;
    if (dto.ativo !== undefined) updateData.ativo = dto.ativo;
    if (dto.empresaId !== undefined) {
      updateData.empresa = dto.empresaId
        ? { connect: { id: dto.empresaId } }
        : { disconnect: true };
    }

    const modelo = await this.prisma.modeloAta.update({
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
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            filial: true,
          },
        },
      },
    });

    return modelo;
  }

  /**
   * Remove um modelo
   */
  async remove(id: string) {
    await this.findOne(id);

    // Verificar se há atas usando este modelo
    const atasComModelo = await this.prisma.ataReuniao.count({
      where: { modeloAtaId: id },
    });

    if (atasComModelo > 0) {
      throw new BadRequestException(
        `Não é possível excluir o modelo pois existem ${atasComModelo} atas utilizando-o. ` +
          `Desative o modelo ao invés de excluí-lo.`,
      );
    }

    await this.prisma.modeloAta.delete({
      where: { id },
    });

    return { message: 'Modelo removido com sucesso' };
  }
}
