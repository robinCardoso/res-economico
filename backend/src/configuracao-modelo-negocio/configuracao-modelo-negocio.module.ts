import { Module } from '@nestjs/common';
import { ConfiguracaoModeloNegocioService } from './configuracao-modelo-negocio.service';
import { ConfiguracaoModeloNegocioController } from './configuracao-modelo-negocio.controller';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [ConfiguracaoModeloNegocioController],
  providers: [ConfiguracaoModeloNegocioService],
  exports: [ConfiguracaoModeloNegocioService],
})
export class ConfiguracaoModeloNegocioModule {}
