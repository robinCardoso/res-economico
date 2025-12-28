import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { BravoConfigModule } from './config/config.module';
import { MappingModule } from './mapping/mapping.module';
import { BravoErpClientModule } from './client/client.module';
import { SyncModule } from './sync/sync.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    CoreModule,
    BravoConfigModule,
    MappingModule,
    BravoErpClientModule,
    SyncModule,
    StatsModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    BravoConfigModule,
    MappingModule,
    BravoErpClientModule,
    SyncModule,
    StatsModule,
  ],
})
export class BravoErpModule {}
