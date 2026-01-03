import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresaDeletionService } from './services/empresa-deletion.service';
import { EmpresasController } from './empresas.controller';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [EmpresasService, EmpresaDeletionService],
  controllers: [EmpresasController],
  exports: [EmpresasService, EmpresaDeletionService],
})
export class EmpresasModule {}
