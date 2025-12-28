import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AtasController } from './atas.controller';
import { AtasService } from './atas.service';
import { ModeloAtaService } from './modelo-ata.service';
import { HistoricoAndamentoService } from './historico-andamento.service';
import { PrazoAcaoService } from './prazo-acao.service';
import { LembretePrazoService } from './lembrete-prazo.service';
import { LembretePrazoScheduler } from './lembrete-prazo.scheduler';
import { CoreModule } from '../core/core.module';
import { ConfigModule } from '@nestjs/config';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';
import { LogAlteracoesModule } from '../log-alteracoes/log-alteracoes.module';
import { PreferenciasNotificacaoModule } from '../preferencias-notificacao/preferencias-notificacao.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
  imports: [
    CoreModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    ConfiguracoesModule,
    LogAlteracoesModule,
    PreferenciasNotificacaoModule,
    PushNotificationsModule,
  ],
  controllers: [AtasController],
  providers: [
    AtasService,
    ModeloAtaService,
    HistoricoAndamentoService,
    PrazoAcaoService,
    LembretePrazoService,
    LembretePrazoScheduler,
  ],
  exports: [
    AtasService,
    ModeloAtaService,
    HistoricoAndamentoService,
    PrazoAcaoService,
    LembretePrazoService,
  ],
})
export class AtasModule {}
