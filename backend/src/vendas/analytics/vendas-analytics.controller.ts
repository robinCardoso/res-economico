import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { VendasAnalyticsService } from './vendas-analytics.service';

@Controller('vendas/analytics')
@UseGuards(JwtAuthGuard)
export class VendasAnalyticsController {
  constructor(private readonly analyticsService: VendasAnalyticsService) {}

  @Get()
  async buscarAnalytics(
    @Query('ano', new ParseIntPipe({ optional: true })) ano?: number,
    @Query('mes', new ParseIntPipe({ optional: true })) mes?: number,
    @Query('nomeFantasia') nomeFantasia?: string,
    @Query('marca') marca?: string,
    @Query('grupo') grupo?: string,
    @Query('subgrupo') subgrupo?: string,
    @Query('uf') uf?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.analyticsService.buscarAnalytics({
      ano,
      mes,
      nomeFantasia,
      marca,
      grupo,
      subgrupo,
      uf,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    });
  }

  @Post('recalcular')
  async recalcularAnalytics(
    @Body() body: { dataInicio?: string; dataFim?: string },
  ) {
    await this.analyticsService.recalculcarAnalytics(
      body.dataInicio ? new Date(body.dataInicio) : undefined,
      body.dataFim ? new Date(body.dataFim) : undefined,
    );
    return { message: 'Analytics recalculado com sucesso' };
  }
}
