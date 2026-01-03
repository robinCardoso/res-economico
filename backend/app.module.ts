import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { QueueModule } from './core/queue/queue.module';
import { UploadsModule } from './uploads/uploads.module';
import { TemplatesModule } from './templates/templates.module';
import { AlertasModule } from './alertas/alertas.module';
import { ContasModule } from './src/contas/contas.module';
import { AuthModule } from './auth/auth.module';
import { EmpresasModule } from './src/empresas/empresas.module';
import { AuditoriaModule } from './src/auditoria/auditoria.module';
import { RelatoriosModule } from './src/relatorios/relatorios.module';
import { AiModule } from './ai/ai.module';
import { ResumosModule } from './src/resumos/resumos.module';
import { ConfiguracaoModeloNegocioModule } from './src/configuracao-modelo-negocio/configuracao-modelo-negocio.module';
import { ProcessosModule } from './src/processos/processos.module';
import { AtasModule } from './src/atas/atas.module';
import { ConfiguracoesModule } from './src/configuracoes/configuracoes.module';
import { PreferenciasNotificacaoModule } from './src/preferencias-notificacao/preferencias-notificacao.module';
import { LogAlteracoesModule } from './src/log-alteracoes/log-alteracoes.module';
import { PushNotificationsModule } from './src/push-notifications/push-notifications.module';
import { BravoErpModule } from './src/bravo-erp/bravo-erp.module';
import { VendasModule } from './vendas/vendas.module';
import { PedidosModule } from './src/pedidos/pedidos.module';
import { UsuariosModule } from './usuarios/usuarios.module';

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
    PushNotificationsModule,
    BravoErpModule,
    VendasModule,
    PedidosModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
