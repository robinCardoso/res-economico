import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LembretePrazoService } from './lembrete-prazo.service';

@Injectable()
export class LembretePrazoScheduler {
  private readonly logger = new Logger(LembretePrazoScheduler.name);

  constructor(private readonly lembretePrazoService: LembretePrazoService) {}

  /**
   * Executa verificação de prazos e envio de lembretes diariamente às 9h
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleLembretesDiarios() {
    this.logger.log('Iniciando verificação diária de prazos e lembretes...');
    try {
      await this.lembretePrazoService.enviarLembretes();
      this.logger.log('Verificação de lembretes concluída com sucesso');
    } catch (error) {
      this.logger.error('Erro ao processar lembretes:', error);
    }
  }

  /**
   * Executa verificação adicional às 14h para prazos urgentes
   */
  @Cron('0 14 * * *') // Todo dia às 14h
  async handleLembretesUrgentes() {
    this.logger.log('Verificando prazos urgentes (hoje e vencidos)...');
    try {
      // Chamar método público de envio de lembretes
      // Ele já verifica prazos vencidos e de hoje
      await this.lembretePrazoService.enviarLembretes();
      this.logger.log('Verificação de prazos urgentes concluída');
    } catch (error) {
      this.logger.error('Erro ao processar lembretes urgentes:', error);
    }
  }
}
