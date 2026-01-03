import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@Controller('bravo-erp/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * GET /bravo-erp/stats
   * Busca estatísticas de produtos e sincronização
   */
  @Get()
  async getStats(@Query('force') force?: string) {
    const forceRefresh = force === '1' || force === 'true' || force === 'yes';
    return this.statsService.getStats(forceRefresh);
  }
}
