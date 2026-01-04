import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncProcessorService } from './sync-processor.service';
import { SyncProgressService } from './sync-progress.service';
import { SyncLogService } from './sync-log.service';
import { SyncDateFilterService } from './sync-date-filter.service';
import { ProductTransformService } from './product-transform.service';
import { SyncLockManager } from './sync-lock.manager';
import { SyncController } from './sync.controller';
import { SyncStatusController } from './sync-status.controller';
import { CoreModule } from '../../core/core.module';
import { BravoErpClientModule } from '../client/client.module';
import { VendasModule } from '../../../vendas/vendas.module';

@Module({
  imports: [CoreModule, BravoErpClientModule, VendasModule],
  controllers: [SyncController, SyncStatusController],
  providers: [
    SyncService,
    SyncProcessorService,
    SyncProgressService,
    SyncLogService,
    SyncDateFilterService,
    ProductTransformService,
    SyncLockManager,
  ],
  exports: [
    SyncService,
    SyncProcessorService,
    SyncProgressService,
    SyncLogService,
    ProductTransformService, // Exportar para permitir limpar cache
  ],
})
export class SyncModule {}
