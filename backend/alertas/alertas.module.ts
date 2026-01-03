import { Module } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { AlertasController } from './alertas.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [AlertasService],
  controllers: [AlertasController],
  exports: [AlertasService],
})
export class AlertasModule {}
