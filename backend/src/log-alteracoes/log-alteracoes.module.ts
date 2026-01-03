import { Module } from '@nestjs/common';
import { LogAlteracoesService } from './log-alteracoes.service';
import { LogAlteracoesController } from './log-alteracoes.controller';
import { PrismaService } from '../../core/prisma/prisma.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogAlteracaoInterceptor } from './interceptors/log-alteracao.interceptor';

@Module({
  controllers: [LogAlteracoesController],
  providers: [
    LogAlteracoesService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LogAlteracaoInterceptor,
    },
  ],
  exports: [LogAlteracoesService],
})
export class LogAlteracoesModule {}
