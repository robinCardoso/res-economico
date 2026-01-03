import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PedidosAnalyticsService } from '../analytics/pedidos-analytics.service';

@Injectable()
export class PedidosImportDeleteService {
  private readonly logger = new Logger(PedidosImportDeleteService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: PedidosAnalyticsService,
  ) {}

  /**
   * Deleta uma importação de pedidos e todos os dados relacionados
   * @param importacaoLogId ID da importação a ser deletada
   * @param userId ID do usuário que está deletando (para validação de permissão)
   * @returns Estatísticas da deleção
   */
  async deletarImportacao(
    importacaoLogId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    estatisticas: {
      pedidosDeletados: number;
      analyticsRecalculados: boolean;
    };
  }> {
    this.logger.log(`Iniciando deleção da importação: ${importacaoLogId}`);

    // 1. Verificar se importação existe
    const importacao = await this.prisma.pedidoImportacaoLog.findUnique({
      where: { id: importacaoLogId },
      select: {
        id: true,
        nomeArquivo: true,
        sucessoCount: true,
        createdAt: true,
        usuarioId: true,
      },
    });

    if (!importacao) {
      throw new NotFoundException('Importação não encontrada');
    }

    // 2. Verificar permissão (apenas criador pode deletar)
    if (importacao.usuarioId && importacao.usuarioId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar esta importação',
      );
    }

    // 3. Buscar todos os pedidos desta importação
    const pedidos = await this.prisma.pedido.findMany({
      where: { importacaoLogId },
      select: {
        id: true,
        dataPedido: true,
        nomeFantasia: true,
        marca: true,
        grupo: true,
        subgrupo: true,
        valorTotal: true,
        quantidade: true,
      },
    });

    const totalPedidos = pedidos.length;

    this.logger.log(`Importação possui ${totalPedidos} pedidos associados`);

    if (totalPedidos === 0) {
      // Se não há pedidos, apenas deletar o log
      await this.prisma.pedidoImportacaoLog.delete({
        where: { id: importacaoLogId },
      });

      this.logger.log('Importação deletada (não havia pedidos associados)');

      return {
        success: true,
        message: 'Importação deletada (não havia pedidos associados)',
        estatisticas: {
          pedidosDeletados: 0,
          analyticsRecalculados: false,
        },
      };
    }

    // 4. Coletar períodos afetados para recalcular analytics
    const periodosAfetados = new Set<string>();
    pedidos.forEach((p) => {
      const ano = new Date(p.dataPedido).getFullYear();
      const mes = new Date(p.dataPedido).getMonth() + 1;
      periodosAfetados.add(`${ano}-${mes}`);
    });

    this.logger.log(
      `Períodos afetados: ${Array.from(periodosAfetados).join(', ')}`,
    );

    // 5. DELETAR PEDIDOS (transação)
    await this.prisma.$transaction(async (tx) => {
      // Deletar pedidos
      await tx.pedido.deleteMany({
        where: { importacaoLogId },
      });

      // Deletar log de importação
      await tx.pedidoImportacaoLog.delete({
        where: { id: importacaoLogId },
      });
    });

    this.logger.log(`${totalPedidos} pedidos deletados com sucesso`);

    // 6. RECALCULAR ANALYTICS para os períodos afetados
    // IMPORTANTE: Recalcular apenas os períodos que foram afetados
    let analyticsRecalculados = false;

    for (const periodo of periodosAfetados) {
      const [ano, mes] = periodo.split('-').map(Number);

      this.logger.log(`Recalculando analytics para ${ano}/${mes}`);

      // Buscar todas os pedidos restantes deste período
      const pedidosRestantes = await this.prisma.pedido.findMany({
        where: {
          dataPedido: {
            gte: new Date(ano, mes - 1, 1),
            lt: new Date(ano, mes, 1),
          },
        },
        select: {
          dataPedido: true,
          nomeFantasia: true,
          marca: true,
          grupo: true,
          subgrupo: true,
          empresaId: true,
          valorTotal: true,
          quantidade: true,
        },
      });

      // Limpar analytics do período
      await this.prisma.pedidoAnalytics.deleteMany({
        where: {
          ano,
          mes,
        },
      });

      // Recalcular analytics com pedidos restantes
      if (pedidosRestantes.length > 0) {
        const pedidosParaAnalytics = pedidosRestantes.map((p) => ({
          dataPedido: p.dataPedido,
          nomeFantasia: p.nomeFantasia || undefined,
          marca: p.marca || 'DESCONHECIDA',
          grupo: p.grupo || 'DESCONHECIDO',
          subgrupo: p.subgrupo || 'DESCONHECIDO',
          empresaId: p.empresaId || undefined,
          valorTotal: p.valorTotal,
          quantidade: p.quantidade,
        }));

        await this.analyticsService.atualizarAnalytics(pedidosParaAnalytics);
        analyticsRecalculados = true;

        this.logger.log(
          `Analytics recalculado para ${ano}/${mes} com ${pedidosRestantes.length} pedidos`,
        );
      } else {
        this.logger.log(
          `Nenhum pedido restante para ${ano}/${mes}, analytics limpo`,
        );
      }
    }

    this.logger.log('Deleção de importação concluída com sucesso');

    return {
      success: true,
      message: `Importação deletada com sucesso. ${totalPedidos} pedidos removidos.`,
      estatisticas: {
        pedidosDeletados: totalPedidos,
        analyticsRecalculados,
      },
    };
  }
}
