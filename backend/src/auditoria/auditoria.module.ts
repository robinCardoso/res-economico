import { Module } from '@nestjs/common';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaLogService } from './auditoria.service';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [AuditoriaController],
  providers: [AuditoriaLogService],
  exports: [AuditoriaLogService],
})
export class AuditoriaModule {}
