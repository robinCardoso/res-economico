import { Module } from '@nestjs/common';
import { ContasService } from './contas.service';
import { ContasController } from './contas.controller';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [ContasService],
  controllers: [ContasController],
  exports: [ContasService],
})
export class ContasModule {}
