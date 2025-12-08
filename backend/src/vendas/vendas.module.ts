import { Module } from '@nestjs/common';
import { VendasController } from './vendas.controller';
import { VendasService } from './vendas.service';
import { VendasImportService } from './import/vendas-import.service';
import { ColumnMapperService } from './import/column-mapper.service';
import { VendasValidatorService } from './import/vendas-validator.service';
import { VendasAnalyticsService } from './analytics/vendas-analytics.service';
import { VendasAnalyticsController } from './analytics/vendas-analytics.controller';
import { VendasUpdateService } from './vendas-update.service';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [VendasController, VendasAnalyticsController],
  providers: [
    VendasService,
    VendasImportService,
    ColumnMapperService,
    VendasValidatorService,
    VendasAnalyticsService,
    VendasUpdateService,
  ],
  exports: [
    VendasService,
    VendasImportService,
    VendasAnalyticsService,
    VendasUpdateService,
  ],
})
export class VendasModule {}
