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
import { PedidosAnalyticsService } from './pedidos-analytics.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';

@Controller('pedidos/analytics')
@UseGuards(JwtAuthGuard)
export class PedidosAnalyticsController {
  constructor(private readonly analyticsService: PedidosAnalyticsService) {}

  @Get()
  async buscarAnalytics(
    @Query('ano') ano?: string,
    @Query('mes') mes?: string,
    @Query('nomeFantasia') nomeFantasia?: string,
    @Query('marca') marca?: string,
    @Query('grupo') grupo?: string,
    @Query('subgrupo') subgrupo?: string,
    @Query('empresaId') empresaId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    // Converter strings separadas por vírgula em arrays
    const anosArray = ano
      ? ano
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : undefined;
    const mesesArray = mes
      ? mes
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : undefined;
    const marcasArray = marca ? marca.split(',') : undefined;
    const nomesFantasiaArray = nomeFantasia
      ? nomeFantasia.split(',')
      : undefined;
    const gruposArray = grupo ? grupo.split(',') : undefined;
    const subgruposArray = subgrupo ? subgrupo.split(',') : undefined;
    const empresasArray = empresaId ? empresaId.split(',') : undefined;

    // TODO: Implementar filtros avançados
    // return this.analyticsService.buscarAnalyticsComFiltros({
    //   ano: anosArray,
    //   mes: mesesArray,
    //   marca: marcasArray,
    //   nomeFantasia: nomesFantasiaArray,
    //   grupo: gruposArray,
    //   subgrupo: subgruposArray,
    //   empresaId: empresasArray,
    //   dataInicio: dataInicio ? new Date(dataInicio) : undefined,
    //   dataFim: dataFim ? new Date(dataFim) : undefined,
    // });

    return {
      message: 'Filtros avançados não implementados ainda',
    };
  }

  @Post('recalcular')
  async recalcularAnalytics(
    @Body() body: { dataInicio?: string; dataFim?: string },
  ) {
    // Converter datas para UTC para garantir consistência
    let dataInicioUTC: Date | undefined;
    let dataFimUTC: Date | undefined;

    if (body.dataInicio) {
      // Se a string já está em formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss), usar diretamente
      // Caso contrário, criar como UTC
      const data = new Date(body.dataInicio);
      // Se a string é apenas data (YYYY-MM-DD), criar como meia-noite UTC
      if (body.dataInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = body.dataInicio.split('-').map(Number);
        dataInicioUTC = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0));
      } else {
        // Se já tem hora, usar a data mas garantir que seja interpretada como UTC
        dataInicioUTC = new Date(data.toISOString());
      }
    }

    if (body.dataFim) {
      // Se a string é apenas data (YYYY-MM-DD), criar como 23:59:59.999 UTC do mesmo dia
      if (body.dataFim.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = body.dataFim.split('-').map(Number);
        dataFimUTC = new Date(Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999));
      } else {
        const data = new Date(body.dataFim);
        dataFimUTC = new Date(data.toISOString());
      }
    }

    // Iniciar recálculo assíncrono (não bloqueia)
    await this.analyticsService.recalculcarAnalytics(dataInicioUTC, dataFimUTC);
    return {
      message:
        'Recálculo de analytics iniciado. Use o endpoint /status para acompanhar o progresso.',
    };
  }

  @Get('recalcular/status')
  async getRecalculoStatus() {
    return this.analyticsService.getRecalculoStatus();
  }

  @Get('anos')
  async getAnos() {
    return this.analyticsService.getAnos();
  }

  @Get('meses')
  async getMeses() {
    return this.analyticsService.getMeses();
  }
}
