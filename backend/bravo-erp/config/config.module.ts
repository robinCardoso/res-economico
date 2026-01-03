import { Module } from '@nestjs/common';
import { BravoConfigService } from './bravo-config.service';
import { BravoConfigController } from './bravo-config.controller';
import { CoreModule } from '../../core/core.module';
import { BravoErpClientModule } from '../client/client.module';

@Module({
  imports: [CoreModule, BravoErpClientModule],
  controllers: [BravoConfigController],
  providers: [BravoConfigService],
  exports: [BravoConfigService],
})
export class BravoConfigModule {}
