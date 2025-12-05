import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { QueueModule } from './core/queue/queue.module';
import { UploadsModule } from './uploads/uploads.module';
import { TemplatesModule } from './templates/templates.module';
import { AlertasModule } from './alertas/alertas.module';
import { ContasModule } from './contas/contas.module';
import { AuthModule } from './auth/auth.module';
import { EmpresasModule } from './empresas/empresas.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { AiModule } from './ai/ai.module';
import { ResumosModule } from './resumos/resumos.module';
import { ConfiguracaoModeloNegocioModule } from './configuracao-modelo-negocio/configuracao-modelo-negocio.module';
import { ProcessosModule } from './processos/processos.module';
import { AtasModule } from './atas/atas.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';
import { PreferenciasNotificacaoModule } from './preferencias-notificacao/preferencias-notificacao.module';
import { LogAlteracoesModule } from './log-alteracoes/log-alteracoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CoreModule,
    QueueModule,
    UploadsModule,
    TemplatesModule,
    AlertasModule,
    ContasModule,
    AuthModule,
    EmpresasModule,
    AuditoriaModule,
    RelatoriosModule,
    AiModule,
    ResumosModule,
    ConfiguracaoModeloNegocioModule,
    ProcessosModule,
    AtasModule,
    ConfiguracoesModule,
    PreferenciasNotificacaoModule,
    LogAlteracoesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
