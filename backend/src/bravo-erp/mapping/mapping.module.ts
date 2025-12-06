import { Module } from '@nestjs/common';
import { MappingService } from './mapping.service';
import { MappingController } from './mapping.controller';
import { CoreModule } from '../../core/core.module';
import { BravoErpClientModule } from '../client/client.module';

@Module({
  imports: [CoreModule, BravoErpClientModule],
  controllers: [MappingController],
  providers: [MappingService],
  exports: [MappingService],
})
export class MappingModule {}
