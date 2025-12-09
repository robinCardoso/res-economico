import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { FilterVendasDto } from './dto/filter-vendas.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import { VendasAnalyticsService } from './analytics/vendas-analytics.service';

@Injectable()
export class VendasService {
  private readonly logger = new Logger(VendasService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: VendasAnalyticsService,
  ) {}

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
    const vendaAntes = await this.findOne(id); // Verifica se existe

    const vendaAtualizada = await this.prisma.venda.update({
      where: { id },
      data: updateVendaDto,
    });

    // Recalcular analytics para esta venda
    try {
      await this.recalcularAnalyticsParaVenda(vendaAtualizada);
    } catch (error) {
      this.logger.error(
        `Erro ao recalcular analytics após atualização de venda ${id}:`,
        error,
      );
      // Não falhar a atualização se o analytics falhar
    }

    return vendaAtualizada;
  }

  async remove(id: string) {
    const venda = await this.findOne(id); // Verifica se existe

    const vendaDeletada = await this.prisma.venda.delete({
      where: { id },
    });

    // Recalcular analytics após deletar venda
    try {
      await this.recalcularAnalyticsParaVenda(venda);
    } catch (error) {
      this.logger.error(
        `Erro ao recalcular analytics após deleção de venda ${id}:`,
        error,
      );
      // Não falhar a deleção se o analytics falhar
    }

    return vendaDeletada;
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

  async getMappingFields() {
    // Retorna os campos do modelo Venda baseado no schema Prisma
    // Campos mapeados para importação (excluindo id, createdAt, updatedAt, relacionamentos)
    return [
      // Identificação da Venda
      { value: 'nfe', label: 'Nota Fiscal Eletrônica (NFE)', dataType: 'text', required: true },
      { value: 'idDoc', label: 'ID do Documento', dataType: 'text', required: false },
      { value: 'data', label: 'Data da Venda', dataType: 'date', required: true }, // dataVenda no banco
      
      // Cliente
      { value: 'razaoSocial', label: 'Razão Social (Cliente)', dataType: 'text', required: true },
      { value: 'nomeFantasia', label: 'Nome Fantasia (Cliente)', dataType: 'text', required: false },
      { value: 'cnpjCliente', label: 'CNPJ do Cliente', dataType: 'text', required: false },
      { value: 'ufDestino', label: 'UF de Destino', dataType: 'text', required: false },
      { value: 'ufOrigem', label: 'UF de Origem', dataType: 'text', required: false },
      
      // Produto
      { value: 'idProd', label: 'ID do Produto', dataType: 'text', required: false },
      { value: 'referencia', label: 'Referência do Produto', dataType: 'text', required: false },
      { value: 'prodCodMestre', label: 'Código Mestre do Produto', dataType: 'text', required: false },
      { value: 'descricaoProduto', label: 'Descrição do Produto', dataType: 'text', required: false },
      { value: 'marca', label: 'Marca do Produto', dataType: 'text', required: false },
      { value: 'grupo', label: 'Grupo do Produto', dataType: 'text', required: false },
      { value: 'subgrupo', label: 'Subgrupo do Produto', dataType: 'text', required: false },
      
      // Operação
      { value: 'tipoOperacao', label: 'Tipo de Operação', dataType: 'text', required: false },
      
      // Valores
      { value: 'qtd', label: 'Quantidade', dataType: 'integer', required: false }, // quantidade no banco
      { value: 'valorUnit', label: 'Valor Unitário', dataType: 'currency', required: false }, // valorUnitario no banco
      { value: 'valorTotal', label: 'Valor Total', dataType: 'currency', required: false }, // valorTotal no banco
    ];
  }

  /**
   * Recalcula analytics para uma venda específica
   * Busca todas as vendas do mesmo período e recalcula o analytics
   */
  private async recalcularAnalyticsParaVenda(venda: {
    dataVenda: Date;
    nomeFantasia?: string | null;
    marca?: string | null;
    grupo?: string | null;
    subgrupo?: string | null;
    ufDestino?: string | null;
  }): Promise<void> {
    const data = new Date(venda.dataVenda);
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;

    // Buscar todas as vendas do mesmo período (ano/mês) que possam afetar o analytics
    const vendasDoPeriodo = await this.prisma.venda.findMany({
      where: {
        dataVenda: {
          gte: new Date(ano, mes - 1, 1),
          lt: new Date(ano, mes, 1),
        },
      },
      select: {
        dataVenda: true,
        nomeFantasia: true,
        marca: true,
        grupo: true,
        subgrupo: true,
        ufDestino: true,
        valorTotal: true,
        quantidade: true,
      },
    });

    // Recalcular analytics para o período
    await this.analyticsService.recalculcarAnalytics(
      new Date(ano, mes - 1, 1),
      new Date(ano, mes, 0, 23, 59, 59, 999),
    );
  }
}
