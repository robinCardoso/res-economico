import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

export interface RecalcularDadosProdutoOptions {
  produtoId?: string;
  referencia?: string;
  apenasVendasFuturas?: boolean;
  dataLimite?: Date;
  atualizarMarca?: boolean;
  atualizarGrupo?: boolean;
  atualizarSubgrupo?: boolean;
}

@Injectable()
export class VendasUpdateService {
  private readonly logger = new Logger(VendasUpdateService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Recalcula dados denormalizados de produto em vendas relacionadas
   * 
   * IMPORTANTE: Por padrão, vendas NÃO são atualizadas automaticamente quando
   * um produto é atualizado, pois representam dados históricos. Este método
   * permite atualização manual quando necessário.
   * 
   * @param opcoes Opções de recálculo
   * @returns Número de vendas atualizadas
   */
  async recalcularDadosProdutoEmVendas(
    opcoes: RecalcularDadosProdutoOptions,
  ): Promise<{ atualizadas: number; total: number }> {
    this.logger.log(
      `Recalculando dados de produto em vendas: ${JSON.stringify(opcoes)}`,
    );

    // Buscar produto
    let produto;
    if (opcoes.produtoId) {
      produto = await this.prisma.produto.findUnique({
        where: { id: opcoes.produtoId },
        select: {
          id: true,
          referencia: true,
          id_prod: true,
          marca: true,
          grupo: true,
          subgrupo: true,
        },
      });
    } else if (opcoes.referencia) {
      produto = await this.prisma.produto.findUnique({
        where: { referencia: opcoes.referencia },
        select: {
          id: true,
          referencia: true,
          id_prod: true,
          marca: true,
          grupo: true,
          subgrupo: true,
        },
      });
    }

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Construir filtro para buscar vendas relacionadas
    const where: any = {
      OR: [
        { referencia: produto.referencia },
        { idProd: produto.id_prod },
      ],
    };

    // Se apenas vendas futuras, adicionar filtro de data
    if (opcoes.apenasVendasFuturas && opcoes.dataLimite) {
      where.dataVenda = { gte: opcoes.dataLimite };
    }

    // Contar total de vendas que serão afetadas
    const total = await this.prisma.venda.count({ where });

    // Preparar dados de atualização
    const updateData: any = {};

    if (opcoes.atualizarMarca !== false) {
      updateData.marca = produto.marca || 'DESCONHECIDA';
    }

    if (opcoes.atualizarGrupo !== false) {
      updateData.grupo = produto.grupo || 'DESCONHECIDO';
    }

    if (opcoes.atualizarSubgrupo !== false) {
      updateData.subgrupo = produto.subgrupo || 'DESCONHECIDO';
    }

    // Atualizar vendas relacionadas
    const result = await this.prisma.venda.updateMany({
      where,
      data: updateData,
    });

    this.logger.log(
      `Recálculo concluído: ${result.count} de ${total} vendas atualizadas`,
    );

    return {
      atualizadas: result.count,
      total,
    };
  }

  /**
   * Recalcula dados de produto em todas as vendas relacionadas a um produto
   * quando o produto é atualizado (chamado opcionalmente)
   */
  async onProdutoUpdated(
    produtoId: string,
    camposAlterados: {
      marca?: boolean;
      grupo?: boolean;
      subgrupo?: boolean;
    },
  ): Promise<void> {
    // Por padrão, NÃO atualizar automaticamente
    // Este método existe apenas para ser chamado explicitamente se necessário
    this.logger.warn(
      `Produto ${produtoId} foi atualizado. Vendas relacionadas NÃO serão atualizadas automaticamente (preservação histórica).`,
    );
    this.logger.warn(
      `Se necessário, use recalcularDadosProdutoEmVendas() manualmente.`,
    );
  }
}
