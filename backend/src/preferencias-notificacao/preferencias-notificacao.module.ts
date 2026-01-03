import { Module } from '@nestjs/common';
import { PreferenciasNotificacaoService } from './preferencias-notificacao.service';
import { PreferenciasNotificacaoController } from './preferencias-notificacao.controller';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [PreferenciasNotificacaoController],
  providers: [PreferenciasNotificacaoService, PrismaService],
  exports: [PreferenciasNotificacaoService],
})
export class PreferenciasNotificacaoModule {}
