import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { FilterPedidosDto } from './dto/filter-pedidos.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PedidosAnalyticsService } from './analytics/pedidos-analytics.service';

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: PedidosAnalyticsService,
  ) {}

  async create(createPedidoDto: CreatePedidoDto) {
    return this.prisma.pedido.create({
      data: createPedidoDto,
    });
  }

  async findAll(filterDto: FilterPedidosDto) {
    const {
      page = 1,
      limit = 50,
      dataInicio,
      dataFim,
      numeroPedido,
      nomeFantasia,
      referencia,
      marca,
      grupo,
      subgrupo,
      empresaId,
    } = filterDto;

    // Garantir que page e limit são números (conversão explícita para evitar problemas com query params)
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page || 1;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit || 50;

    const skip = (pageNum - 1) * limitNum;

    const where: {
      dataPedido?: { gte?: Date; lte?: Date };
      numeroPedido?: { contains: string; mode: 'insensitive' };
      nomeFantasia?: { contains: string; mode: 'insensitive' };
      referencia?: { contains: string; mode: 'insensitive' };
      marca?: { contains: string; mode: 'insensitive' };
      grupo?: { contains: string; mode: 'insensitive' };
      subgrupo?: { contains: string; mode: 'insensitive' };
      empresaId?: string;
    } = {};

    if (dataInicio || dataFim) {
      where.dataPedido = {};
      if (dataInicio) {
        where.dataPedido.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataPedido.lte = new Date(dataFim);
      }
    }

    if (numeroPedido) {
      where.numeroPedido = { contains: numeroPedido, mode: 'insensitive' };
    }

    if (nomeFantasia) {
      where.nomeFantasia = { contains: nomeFantasia, mode: 'insensitive' };
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

    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { dataPedido: 'desc' },
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
      this.prisma.pedido.count({ where }),
    ]);

    return {
      data: pedidos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
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

    if (!pedido) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }

    return pedido;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto) {
    await this.findOne(id); // Verifica se existe

    const pedidoAtualizado = await this.prisma.pedido.update({
      where: { id },
      data: updatePedidoDto,
    });

    // Recalcular analytics para este pedido
    try {
      await this.recalcularAnalyticsParaPedido(pedidoAtualizado);
    } catch (error) {
      this.logger.error(
        `Erro ao recalcular analytics após atualização de pedido ${id}:`,
        error,
      );
      // Não falhar a atualização se o analytics falhar
    }

    return pedidoAtualizado;
  }

  async remove(id: string) {
    const pedido = await this.findOne(id); // Verifica se existe

    const pedidoDeletado = await this.prisma.pedido.delete({
      where: { id },
    });

    // Recalcular analytics após deletar pedido
    try {
      await this.recalcularAnalyticsParaPedido(pedido);
    } catch (error) {
      this.logger.error(
        `Erro ao recalcular analytics após deleção de pedido ${id}:`,
        error,
      );
      // Não falhar a deleção se o analytics falhar
    }

    return pedidoDeletado;
  }

  async getStats(filterDto: FilterPedidosDto) {
    const {
      dataInicio,
      dataFim,
      numeroPedido,
      nomeFantasia,
      referencia,
      marca,
      grupo,
      subgrupo,
      empresaId,
    } = filterDto;

    // Aplicar os mesmos filtros do findAll para garantir consistência
    const where: {
      dataPedido?: { gte?: Date; lte?: Date };
      numeroPedido?: { contains: string; mode: 'insensitive' };
      nomeFantasia?: { contains: string; mode: 'insensitive' };
      referencia?: { contains: string; mode: 'insensitive' };
      marca?: { contains: string; mode: 'insensitive' };
      grupo?: { contains: string; mode: 'insensitive' };
      subgrupo?: { contains: string; mode: 'insensitive' };
      empresaId?: string;
    } = {};

    if (dataInicio || dataFim) {
      where.dataPedido = {};
      if (dataInicio) {
        where.dataPedido.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataPedido.lte = new Date(dataFim);
      }
    }

    if (numeroPedido) {
      where.numeroPedido = { contains: numeroPedido, mode: 'insensitive' };
    }

    if (nomeFantasia) {
      where.nomeFantasia = { contains: nomeFantasia, mode: 'insensitive' };
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

    // Verificar total de pedidos no banco (sem filtros) para debug
    const totalPedidosNoBanco = await this.prisma.pedido.count({});
    this.logger.debug(
      `Total de pedidos no banco (sem filtros): ${totalPedidosNoBanco}`,
    );

    const [totalPedidos, totalValorResult, totalQuantidadeResult] =
      await Promise.all([
        this.prisma.pedido.count({ where }),
        this.prisma.pedido.aggregate({
          where,
          _sum: {
            valorTotal: true,
          },
        }),
        this.prisma.pedido.aggregate({
          where,
          _sum: {
            quantidade: true,
          },
        }),
      ]);

    // Converter Decimal para number
    const totalValor = totalValorResult._sum.valorTotal
      ? parseFloat(totalValorResult._sum.valorTotal.toString())
      : 0;

    const totalQuantidade = totalQuantidadeResult._sum.quantidade
      ? parseFloat(totalQuantidadeResult._sum.quantidade.toString())
      : 0;

    this.logger.log(
      `Stats calculados (com filtros): totalPedidos=${totalPedidos}, totalValor=${totalValor}, totalQuantidade=${totalQuantidade}. Filtros aplicados: ${JSON.stringify(where)}`,
    );

    return {
      totalPedidos: totalPedidos,
      totalValor: totalValor,
      totalQuantidade: totalQuantidade,
    };
  }

  async getImportLogs() {
    return this.prisma.pedidoImportacaoLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getImportLogProgress(logId: string) {
    const log = await this.prisma.pedidoImportacaoLog.findUnique({
      where: { id: logId },
      select: {
        id: true,
        progresso: true,
        linhasProcessadas: true,
        totalLinhas: true,
        sucessoCount: true,
        erroCount: true,
        createdAt: true,
      },
    });

    if (!log) {
      throw new NotFoundException('Importação não encontrada');
    }

    return {
      progresso: log.progresso || 0,
      linhasProcessadas: log.linhasProcessadas || 0,
      totalLinhas: log.totalLinhas,
      sucessoCount: log.sucessoCount,
      erroCount: log.erroCount,
      concluido: log.progresso === 100,
    };
  }

  async getMarcas() {
    // Buscar valores únicos de marca da tabela Pedido usando raw SQL para melhor performance
    const result = await this.prisma.$queryRaw<Array<{ marca: string }>>`
      SELECT DISTINCT "marca"
      FROM "Pedido"
      WHERE "marca" IS NOT NULL
      ORDER BY "marca" ASC
    `;

    return result.map((row) => row.marca);
  }

  async getGrupos() {
    // Buscar valores únicos de grupo da tabela Pedido usando raw SQL para melhor performance
    const result = await this.prisma.$queryRaw<Array<{ grupo: string }>>`
      SELECT DISTINCT "grupo"
      FROM "Pedido"
      WHERE "grupo" IS NOT NULL
      ORDER BY "grupo" ASC
    `;

    return result.map((row) => row.grupo);
  }

  async getSubgrupos() {
    // Buscar valores únicos de subgrupo da tabela Pedido usando raw SQL para melhor performance
    const result = await this.prisma.$queryRaw<Array<{ subgrupo: string }>>`
      SELECT DISTINCT "subgrupo"
      FROM "Pedido"
      WHERE "subgrupo" IS NOT NULL
      ORDER BY "subgrupo" ASC
    `;

    return result.map((row) => row.subgrupo);
  }

  async getNomesFantasia() {
    // Buscar valores únicos de nomeFantasia da tabela Pedido usando raw SQL para melhor performance
    const result = await this.prisma.$queryRaw<Array<{ nomeFantasia: string }>>`
      SELECT DISTINCT "nomeFantasia"
      FROM "Pedido"
      WHERE "nomeFantasia" IS NOT NULL
      ORDER BY "nomeFantasia" ASC
    `;

    return result.map((row) => row.nomeFantasia);
  }

  getMappingFields() {
    // Retorna os campos do modelo Pedido baseado no schema Prisma
    // Campos mapeados para importação (excluindo id, createdAt, updatedAt, relacionamentos)
    return [
      // Identificação do Pedido
      {
        value: 'numeroPedido',
        label: 'Número do Pedido',
        dataType: 'text',
        required: true,
      },
      {
        value: 'idDoc',
        label: 'ID do Documento',
        dataType: 'text',
        required: false,
      },
      {
        value: 'data',
        label: 'Data do Pedido',
        dataType: 'date',
        required: true,
      }, // dataPedido no banco

      // Cliente
      {
        value: 'nomeFantasia',
        label: 'Nome Fantasia (Cliente)',
        dataType: 'text',
        required: true,
      },

      // Produto
      {
        value: 'idProd',
        label: 'ID do Produto',
        dataType: 'text',
        required: false,
      },
      {
        value: 'referencia',
        label: 'Referência do Produto',
        dataType: 'text',
        required: false,
      },
      {
        value: 'descricaoProduto',
        label: 'Descrição do Produto',
        dataType: 'text',
        required: false,
      },
      {
        value: 'marca',
        label: 'Marca do Produto',
        dataType: 'text',
        required: false,
      },
      {
        value: 'grupo',
        label: 'Grupo do Produto',
        dataType: 'text',
        required: false,
      },
      {
        value: 'subgrupo',
        label: 'Subgrupo do Produto',
        dataType: 'text',
        required: false,
      },

      // Valores
      {
        value: 'qtd',
        label: 'Quantidade',
        dataType: 'integer',
        required: true,
      }, // quantidade no banco
      {
        value: 'valorUnit',
        label: 'Valor Unitário',
        dataType: 'currency',
        required: true,
      }, // valorUnitario no banco
      {
        value: 'valorTotal',
        label: 'Valor Total',
        dataType: 'currency',
        required: true,
      }, // valorTotal no banco
    ];
  }

  /**
   * Recalcula analytics para um pedido específico
   * Busca todos os pedidos do mesmo período e recalcula o analytics
   */
  private async recalcularAnalyticsParaPedido(pedido: {
    dataPedido: Date;
    nomeFantasia?: string | null;
    marca?: string | null;
    grupo?: string | null;
    subgrupo?: string | null;
  }): Promise<void> {
    const data = new Date(pedido.dataPedido);
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;

    // Recalcular analytics para o período
    await this.analyticsService.recalculcarAnalytics(
      new Date(ano, mes - 1, 1),
      new Date(ano, mes, 0, 23, 59, 59, 999),
    );
  }
}

