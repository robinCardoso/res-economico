import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Serviço para determinar filtro de data para sincronização incremental
 */
@Injectable()
export class SyncDateFilterService {
  private readonly logger = new Logger(SyncDateFilterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determina data de filtro para sincronização incremental
   */
  async determinarDataFiltro(
    isCompleteSync: boolean,
    aplicarFiltroData: boolean,
    modo_teste: boolean,
  ): Promise<{
    dataFiltro: string | null;
    operadorFiltro: string;
    metodoFiltro: string;
  }> {
    // Se modo_teste, não aplicar filtro
    if (modo_teste) {
      return {
        dataFiltro: null,
        operadorFiltro: '>=',
        metodoFiltro: 'nenhum',
      };
    }

    // Se aplicarFiltroData é false (opção desabilitada), buscar TODOS os produtos com data inferior à data atual
    if (!aplicarFiltroData) {
      const hoje = new Date().toISOString().split('T')[0];
      this.logger.log(
        `📅 Sincronização SEM incremental - Buscando TODOS os produtos com data inferior a ${hoje}`,
      );
      return {
        dataFiltro: hoje,
        operadorFiltro: '<',
        metodoFiltro: 'todos_produtos_ate_hoje',
      };
    }

    // Verificar se há produtos na tabela
    const totalProdutos = await this.prisma.produto.count();

    if (totalProdutos === 0) {
      // PRIMEIRA SINCRONIZAÇÃO
      const hoje = new Date().toISOString().split('T')[0];
      this.logger.log(
        `📅 PRIMEIRA SINCRONIZAÇÃO - Tabela vazia detectada. Buscando produtos modificados ANTES de ${hoje}`,
      );
      return {
        dataFiltro: hoje,
        operadorFiltro: '<',
        metodoFiltro: 'primeira_sincronizacao',
      };
    }

    // SINCRONIZAÇÃO INCREMENTAL: usar MAX(dataUltModif)
    try {
      const produtoMaisRecent = await this.prisma.produto.findFirst({
        where: { dataUltModif: { not: null } },
        orderBy: { dataUltModif: 'desc' },
        select: { dataUltModif: true },
      });

      if (produtoMaisRecent?.dataUltModif) {
        const dataModifDate = new Date(produtoMaisRecent.dataUltModif);
        const agora = new Date();

        if (dataModifDate > agora) {
          this.logger.warn(`⚠️ MAX(dataUltModif) é futura, usando data atual`);
          return {
            dataFiltro: agora.toISOString().split('T')[0],
            operadorFiltro: '>=',
            metodoFiltro: 'max_data_ult_modif_corrigida',
          };
        }

        const dataFiltro = dataModifDate.toISOString().split('T')[0];
        this.logger.log(
          `📅 SINCRONIZAÇÃO INCREMENTAL - Usando MAX(dataUltModif): ${dataFiltro}`,
        );
        return {
          dataFiltro,
          operadorFiltro: '>=',
          metodoFiltro: 'max_data_ult_modif',
        };
      }

      // Fallback: usar completed_at da última sync
      return await this.obterDataFiltroFallback();
    } catch (error) {
      this.logger.error('Erro ao determinar data de filtro:', error);
      return await this.obterDataFiltroFallback();
    }
  }

  /**
   * Obtém data de filtro usando fallback
   */
  private async obterDataFiltroFallback(): Promise<{
    dataFiltro: string;
    operadorFiltro: string;
    metodoFiltro: string;
  }> {
    this.logger.log('⚠️ Usando fallback para determinar data de filtro');

    // Tentar usar completed_at da última sync
    const ultimaSync = await this.prisma.bravoSyncLog.findFirst({
      where: {
        status: 'completed',
        completed_at: { not: null },
      },
      orderBy: { completed_at: 'desc' },
      select: { completed_at: true },
    });

    if (ultimaSync?.completed_at) {
      const dataFiltro = new Date(ultimaSync.completed_at)
        .toISOString()
        .split('T')[0];
      this.logger.log(
        `📅 Fallback: usando completed_at da última sync: ${dataFiltro}`,
      );
      return {
        dataFiltro,
        operadorFiltro: '>=',
        metodoFiltro: 'fallback_completed_at',
      };
    }

    // Último recurso: usar ontem
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const dataFiltro = ontem.toISOString().split('T')[0];
    this.logger.log(`📅 Fallback final: usando ontem: ${dataFiltro}`);
    return {
      dataFiltro,
      operadorFiltro: '>=',
      metodoFiltro: 'fallback_ontem',
    };
  }
}
