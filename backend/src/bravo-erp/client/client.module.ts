import { Module } from '@nestjs/common';
import { BravoErpClientV2Service } from './bravo-erp-client-v2.service';
import { CoreModule } from '../../../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [BravoErpClientV2Service],
  exports: [BravoErpClientV2Service],
})
export class BravoErpClientModule {}
