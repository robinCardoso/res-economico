import { Module } from '@nestjs/common';
import { PedidosController } from './pedidos.controller';
import { PedidosAnalyticsController } from './analytics/pedidos-analytics.controller';
import { PedidosService } from './pedidos.service';
import { PedidosImportService } from './import/pedidos-import.service';
import { ColumnMapperService } from './import/column-mapper.service';
import { PedidosValidatorService } from './import/pedidos-validator.service';
import { PedidosAnalyticsService } from './analytics/pedidos-analytics.service';
import { PedidosUpdateService } from './pedidos-update.service';
import { PedidosImportDeleteService } from './import/pedidos-import-delete.service';
import { PedidosColumnMappingService } from './pedidos-column-mapping.service';
import { PedidosAnalyticsFilterService } from './pedidos-analytics-filter.service';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [PedidosAnalyticsController, PedidosController],
  providers: [
    PedidosService,
    PedidosImportService,
    PedidosImportDeleteService,
    PedidosColumnMappingService,
    PedidosAnalyticsFilterService,
    ColumnMapperService,
    PedidosValidatorService,
    PedidosAnalyticsService,
    PedidosUpdateService,
  ],
  exports: [
    PedidosService,
    PedidosImportService,
    PedidosAnalyticsService,
    PedidosUpdateService,
  ],
})
export class PedidosModule {}
