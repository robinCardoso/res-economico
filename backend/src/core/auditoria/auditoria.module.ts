import { Module } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { CoreModule } from '../core.module';

@Module({
  imports: [CoreModule],
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}

