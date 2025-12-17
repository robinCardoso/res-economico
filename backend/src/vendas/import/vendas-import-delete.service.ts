import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { VendasAnalyticsService } from '../analytics/vendas-analytics.service';

@Injectable()
export class VendasImportDeleteService {
  private readonly logger = new Logger(VendasImportDeleteService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: VendasAnalyticsService,
  ) {}

  /**
   * Deleta uma importação de vendas e todos os dados relacionados
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
      vendasDeletadas: number;
      analyticsRecalculados: boolean;
    };
  }> {
    this.logger.log(`Iniciando deleção da importação: ${importacaoLogId}`);

    // 1. Verificar se importação existe
    const importacao = await this.prisma.vendaImportacaoLog.findUnique({
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

    // 3. Buscar todas as vendas desta importação
    const vendas = await this.prisma.venda.findMany({
      where: { importacaoLogId },
      select: {
        id: true,
        dataVenda: true,
        nomeFantasia: true,
        marca: true,
        grupo: true,
        subgrupo: true,
        tipoOperacao: true,
        ufDestino: true,
        valorTotal: true,
        quantidade: true,
      },
    });

    const totalVendas = vendas.length;

    this.logger.log(`Importação possui ${totalVendas} vendas associadas`);

    if (totalVendas === 0) {
      // Se não há vendas, apenas deletar o log
      await this.prisma.vendaImportacaoLog.delete({
        where: { id: importacaoLogId },
      });

      this.logger.log('Importação deletada (não havia vendas associadas)');

      return {
        success: true,
        message: 'Importação deletada (não havia vendas associadas)',
        estatisticas: {
          vendasDeletadas: 0,
          analyticsRecalculados: false,
        },
      };
    }

    // 4. Coletar períodos afetados para recalcular analytics
    const periodosAfetados = new Set<string>();
    vendas.forEach((v) => {
      const ano = new Date(v.dataVenda).getFullYear();
      const mes = new Date(v.dataVenda).getMonth() + 1;
      periodosAfetados.add(`${ano}-${mes}`);
    });

    this.logger.log(
      `Períodos afetados: ${Array.from(periodosAfetados).join(', ')}`,
    );

    // 5. DELETAR VENDAS (transação)
    await this.prisma.$transaction(async (tx) => {
      // Deletar vendas
      await tx.venda.deleteMany({
        where: { importacaoLogId },
      });

      // Deletar log de importação
      await tx.vendaImportacaoLog.delete({
        where: { id: importacaoLogId },
      });
    });

    this.logger.log(`${totalVendas} vendas deletadas com sucesso`);

    // 6. RECALCULAR ANALYTICS para os períodos afetados
    // IMPORTANTE: Recalcular apenas os períodos que foram afetados
    let analyticsRecalculados = false;

    for (const periodo of periodosAfetados) {
      const [ano, mes] = periodo.split('-').map(Number);

      this.logger.log(`Recalculando analytics para ${ano}/${mes}`);

      // Buscar todas as vendas restantes deste período
      const vendasRestantes = await this.prisma.venda.findMany({
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
          tipoOperacao: true,
          ufDestino: true,
          valorTotal: true,
          quantidade: true,
        },
      });

      // Limpar analytics do período
      await this.prisma.vendaAnalytics.deleteMany({
        where: {
          ano,
          mes,
        },
      });

      // Recalcular analytics com vendas restantes
      if (vendasRestantes.length > 0) {
        const vendasParaAnalytics = vendasRestantes.map((v) => ({
          dataVenda: v.dataVenda,
          nomeFantasia: v.nomeFantasia || undefined,
          marca: v.marca || 'DESCONHECIDA',
          grupo: v.grupo || 'DESCONHECIDO',
          subgrupo: v.subgrupo || 'DESCONHECIDO',
          tipoOperacao: v.tipoOperacao || undefined,
          ufDestino: v.ufDestino || undefined,
          valorTotal: v.valorTotal,
          quantidade: v.quantidade,
        }));

        await this.analyticsService.atualizarAnalytics(vendasParaAnalytics);
        analyticsRecalculados = true;

        this.logger.log(
          `Analytics recalculado para ${ano}/${mes} com ${vendasRestantes.length} vendas`,
        );
      } else {
        this.logger.log(
          `Nenhuma venda restante para ${ano}/${mes}, analytics limpo`,
        );
      }
    }

    this.logger.log('Deleção de importação concluída com sucesso');

    return {
      success: true,
      message: `Importação deletada com sucesso. ${totalVendas} vendas removidas.`,
      estatisticas: {
        vendasDeletadas: totalVendas,
        analyticsRecalculados,
      },
    };
  }
}
