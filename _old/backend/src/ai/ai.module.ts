import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EmpresaContextoService } from './empresa-contexto.service';
import { CoreModule } from '../core/core.module';
import { RelatoriosModule } from '../relatorios/relatorios.module';

@Module({
  imports: [ConfigModule, CoreModule, RelatoriosModule],
  controllers: [AiController],
  providers: [AiService, EmpresaContextoService],
  exports: [AiService],
})
export class AiModule {}
