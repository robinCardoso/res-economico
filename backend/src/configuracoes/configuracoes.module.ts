import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '../../core/core.module';
import { ConfiguracoesController } from './configuracoes.controller';
import { ConfiguracoesService } from './configuracoes.service';
import { EmailService } from './email.service';

@Module({
  imports: [CoreModule, ConfigModule],
  controllers: [ConfiguracoesController],
  providers: [ConfiguracoesService, EmailService],
  exports: [EmailService, ConfiguracoesService],
})
export class ConfiguracoesModule {}
