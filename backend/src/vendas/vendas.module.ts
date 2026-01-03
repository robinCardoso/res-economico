import { Module } from '@nestjs/common';
import { VendasController } from './vendas.controller';
import { VendasService } from './vendas.service';
import { VendasImportService } from './import/vendas-import.service';
import { ColumnMapperService } from './import/column-mapper.service';
import { VendasValidatorService } from './import/vendas-validator.service';
import { VendasAnalyticsService } from './analytics/vendas-analytics.service';
import { VendasAnalyticsController } from './analytics/vendas-analytics.controller';
import { VendasUpdateService } from './vendas-update.service';
import { VendasAnalyticsSyncService } from './analytics/vendas-analytics-sync.service';
import { VendasAnalyticsDirectService } from './analytics/vendas-analytics-direct.service';
import { VendasImportDeleteService } from './import/vendas-import-delete.service';
import { VendasColumnMappingService } from './vendas-column-mapping.service';
import { VendasAnalyticsFilterService } from './vendas-analytics-filter.service';
import { ClientePerfilAnalyticsService } from './analytics/cliente-perfil-analytics.service';
import { ClienteMetricasFinanceirasService } from './analytics/cliente-metricas-financeiras.service';
import { ClienteComportamentoCompraService } from './analytics/cliente-comportamento-compra.service';
import { ClienteSegmentacaoService } from './analytics/cliente-segmentacao.service';
import { ClienteAlertasRecomendacoesService } from './analytics/cliente-alertas-recomendacoes.service';
import { ClientePerfilAnalyticsController } from './analytics/cliente-perfil-analytics.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [
    VendasController,
    VendasAnalyticsController,
    ClientePerfilAnalyticsController,
  ],
  providers: [
    VendasService,
    VendasImportService,
    VendasImportDeleteService,
    VendasColumnMappingService,
    VendasAnalyticsFilterService,
    ColumnMapperService,
    VendasValidatorService,
    VendasAnalyticsService,
    VendasAnalyticsSyncService,
    VendasAnalyticsDirectService,
    VendasUpdateService,
    // Serviços de análise de perfil de cliente
    ClientePerfilAnalyticsService,
    ClienteMetricasFinanceirasService,
    ClienteComportamentoCompraService,
    ClienteSegmentacaoService,
    ClienteAlertasRecomendacoesService,
  ],
  exports: [
    VendasService,
    VendasImportService,
    VendasAnalyticsService,
    VendasAnalyticsSyncService,
    VendasUpdateService,
  ],
})
export class VendasModule {}
