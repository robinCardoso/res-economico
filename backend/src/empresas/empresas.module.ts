import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [EmpresasService],
  controllers: [EmpresasController],
  exports: [EmpresasService],
})
export class EmpresasModule {}
