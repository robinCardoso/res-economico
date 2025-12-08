import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { FilterVendasDto } from './dto/filter-vendas.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';

@Injectable()
export class VendasService {
  constructor(private prisma: PrismaService) {}

  async create(createVendaDto: CreateVendaDto) {
    return this.prisma.venda.create({
      data: createVendaDto,
    });
  }

  async findAll(filterDto: FilterVendasDto) {
    const {
      page = 1,
      limit = 50,
      dataInicio,
      dataFim,
      nfe,
      razaoSocial,
      referencia,
      marca,
      grupo,
      subgrupo,
      empresaId,
    } = filterDto;

    const skip = (page - 1) * limit;

    const where: {
      dataVenda?: { gte?: Date; lte?: Date };
      nfe?: { contains: string; mode: 'insensitive' };
      razaoSocial?: { contains: string; mode: 'insensitive' };
      referencia?: { contains: string; mode: 'insensitive' };
      marca?: { contains: string; mode: 'insensitive' };
      grupo?: { contains: string; mode: 'insensitive' };
      subgrupo?: { contains: string; mode: 'insensitive' };
      empresaId?: string;
    } = {};

    if (dataInicio || dataFim) {
      where.dataVenda = {};
      if (dataInicio) {
        where.dataVenda.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataVenda.lte = new Date(dataFim);
      }
    }

    if (nfe) {
      where.nfe = { contains: nfe, mode: 'insensitive' };
    }

    if (razaoSocial) {
      where.razaoSocial = { contains: razaoSocial, mode: 'insensitive' };
    }

    if (referencia) {
      where.referencia = { contains: referencia, mode: 'insensitive' };
    }

    if (marca) {
      where.marca = { contains: marca, mode: 'insensitive' };
    }

    if (grupo) {
      where.grupo = { contains: grupo, mode: 'insensitive' };
    }

    if (subgrupo) {
      where.subgrupo = { contains: subgrupo, mode: 'insensitive' };
    }

    if (empresaId) {
      where.empresaId = empresaId;
    }

    const [vendas, total] = await Promise.all([
      this.prisma.venda.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataVenda: 'desc' },
        include: {
          empresa: {
            select: {
              id: true,
              razaoSocial: true,
              filial: true,
            },
          },
          produto: {
            select: {
              id: true,
              referencia: true,
              descricao: true,
            },
          },
        },
      }),
      this.prisma.venda.count({ where }),
    ]);

    return {
      data: vendas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const venda = await this.prisma.venda.findUnique({
      where: { id },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            filial: true,
          },
        },
        produto: {
          select: {
            id: true,
            referencia: true,
            descricao: true,
            marca: true,
            grupo: true,
            subgrupo: true,
          },
        },
      },
    });

    if (!venda) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada`);
    }

    return venda;
  }

  async update(id: string, updateVendaDto: UpdateVendaDto) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.venda.update({
      where: { id },
      data: updateVendaDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.venda.delete({
      where: { id },
    });
  }

  async getStats(filterDto: FilterVendasDto) {
    const { dataInicio, dataFim, empresaId } = filterDto;

    const where: {
      dataVenda?: { gte?: Date; lte?: Date };
      empresaId?: string;
    } = {};

    if (dataInicio || dataFim) {
      where.dataVenda = {};
      if (dataInicio) {
        where.dataVenda.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataVenda.lte = new Date(dataFim);
      }
    }

    if (empresaId) {
      where.empresaId = empresaId;
    }

    const [totalVendas, totalValorResult, totalQuantidadeResult] =
      await Promise.all([
        this.prisma.venda.count({ where }),
        this.prisma.venda.aggregate({
          where,
          _sum: {
            valorTotal: true,
          },
        }),
        this.prisma.venda.aggregate({
          where,
          _sum: {
            quantidade: true,
          },
        }),
      ]);

    return {
      total: totalVendas,
      valorTotal: totalValorResult._sum.valorTotal || 0,
      quantidadeTotal: totalQuantidadeResult._sum.quantidade || 0,
    };
  }

  async getImportLogs() {
    return this.prisma.vendaImportacaoLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Últimos 100 logs
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nome: true,
          },
        },
      },
    });
  }
}
