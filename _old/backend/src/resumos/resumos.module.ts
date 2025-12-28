import { Module } from '@nestjs/common';
import { ResumosController } from './resumos.controller';
import { ResumosService } from './resumos.service';
import { CoreModule } from '../core/core.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [CoreModule, AiModule],
  controllers: [ResumosController],
  providers: [ResumosService],
  exports: [ResumosService],
})
export class ResumosModule {}
