import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Body,
  ParseIntPipe,
  ParseArrayPipe,
  DefaultValuePipe,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { VendasAnalyticsService } from './vendas-analytics.service';
import { VendasAnalyticsSyncService } from './vendas-analytics-sync.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import { FilialAssociadoAnalyticsDto } from './dto/filial-associado-analytics.dto';

@Controller('vendas/analytics')
@UseGuards(JwtAuthGuard)
export class VendasAnalyticsController {
  constructor(
    private readonly analyticsService: VendasAnalyticsService,
    private readonly syncService: VendasAnalyticsSyncService,
  ) {}

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
    // Iniciar recálculo assíncrono (não bloqueia)
    await this.analyticsService.recalculcarAnalytics(
      body.dataInicio ? new Date(body.dataInicio) : undefined,
      body.dataFim ? new Date(body.dataFim) : undefined,
    );
    return {
      message: 'Recálculo de analytics iniciado. Use o endpoint /status para acompanhar o progresso.',
    };
  }

  @Get('recalcular/status')
  async getRecalculoStatus() {
    return this.analyticsService.getRecalculoStatus();
  }

  @Get('validar-sincronizacao')
  async validarSincronizacao(
    @Query('ano', new ParseIntPipe({ optional: true })) ano?: number,
    @Query('mes', new ParseIntPipe({ optional: true })) mes?: number,
  ) {
    return this.syncService.validarSincronizacao({ ano, mes });
  }

  @Post('corrigir-sincronizacao')
  async corrigirSincronizacao(@Body() body: { ano?: number; mes?: number }) {
    return this.syncService.corrigirSincronizacao(body);
  }

  @Get('ufs')
  async getUfs() {
    return this.analyticsService.getUfs();
  }

  @Get('anos')
  async getAnos() {
    return this.analyticsService.getAnos();
  }

  @Get('meses')
  async getMeses() {
    return this.analyticsService.getMeses();
  }

  @Get('crescimento-empresa')
  async getCrescimentoEmpresa(
    @Query(
      'tipoOperacao',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    tipoOperacao?: string[],
    @Query(
      'filial',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    filial?: string[],
    @Query(
      'ano',
      new ParseArrayPipe({ items: Number, optional: true, separator: ',' }),
    )
    ano?: number[],
    @Query(
      'mes',
      new ParseArrayPipe({ items: Number, optional: true, separator: ',' }),
    )
    mes?: number[],
    @Query(
      'marca',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    marca?: string[],
    @Query(
      'nomeFantasia',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    nomeFantasia?: string[],
    @Query(
      'grupo',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    grupo?: string[],
    @Query(
      'subgrupo',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    subgrupo?: string[],
    @Query(
      'empresaId',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    empresaId?: string[],
  ) {
    const filtros: FilterAnalyticsDto = {
      tipoOperacao,
      filial,
      ano,
      mes,
      marca,
      nomeFantasia,
      grupo,
      subgrupo,
      empresaId,
    };
    return this.analyticsService.getCrescimentoEmpresa(filtros);
  }

  @Get('crescimento-filial')
  async getCrescimentoFilial(
    @Query(
      'tipoOperacao',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    tipoOperacao?: string[],
    @Query(
      'filial',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    filial?: string[],
    @Query(
      'ano',
      new ParseArrayPipe({ items: Number, optional: true, separator: ',' }),
    )
    ano?: number[],
    @Query(
      'mes',
      new ParseArrayPipe({ items: Number, optional: true, separator: ',' }),
    )
    mes?: number[],
    @Query(
      'marca',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    marca?: string[],
    @Query(
      'nomeFantasia',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    nomeFantasia?: string[],
    @Query(
      'grupo',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    grupo?: string[],
    @Query(
      'subgrupo',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    subgrupo?: string[],
    @Query(
      'empresaId',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    empresaId?: string[],
  ) {
    const filtros: FilterAnalyticsDto = {
      tipoOperacao,
      filial,
      ano,
      mes,
      marca,
      nomeFantasia,
      grupo,
      subgrupo,
      empresaId,
    };
    return this.analyticsService.getCrescimentoFilial(filtros);
  }

  @Get('crescimento-marca')
  async getCrescimentoMarca(
    @Query(
      'tipoOperacao',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    tipoOperacao?: string[],
    @Query(
      'filial',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    filial?: string[],
    @Query(
      'ano',
      new ParseArrayPipe({ items: Number, optional: true, separator: ',' }),
    )
    ano?: number[],
    @Query(
      'mes',
      new ParseArrayPipe({ items: Number, optional: true, separator: ',' }),
    )
    mes?: number[],
    @Query(
      'marca',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    marca?: string[],
    @Query(
      'nomeFantasia',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    nomeFantasia?: string[],
    @Query(
      'grupo',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    grupo?: string[],
    @Query(
      'subgrupo',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    subgrupo?: string[],
    @Query(
      'empresaId',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    empresaId?: string[],
  ) {
    const filtros: FilterAnalyticsDto = {
      tipoOperacao,
      filial,
      ano,
      mes,
      marca,
      nomeFantasia,
      grupo,
      subgrupo,
      empresaId,
    };
    return this.analyticsService.getCrescimentoMarca(filtros);
  }

  @Get('crescimento-associado')
  async getCrescimentoAssociado(
    @Query(
      'tipoOperacao',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    tipoOperacao?: string[],
    @Query(
      'filial',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    filial?: string[],
    @Query(
      'ano',
      new ParseArrayPipe({ items: Number, optional: true, separator: ',' }),
    )
    ano?: number[],
    @Query(
      'mes',
      new ParseArrayPipe({ items: Number, optional: true, separator: ',' }),
    )
    mes?: number[],
    @Query(
      'marca',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    marca?: string[],
    @Query(
      'nomeFantasia',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    nomeFantasia?: string[],
    @Query(
      'grupo',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    grupo?: string[],
    @Query(
      'subgrupo',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    subgrupo?: string[],
    @Query(
      'empresaId',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    empresaId?: string[],
    @Query(
      'page',
      new DefaultValuePipe(1),
      new ParseIntPipe({ optional: true }),
    )
    page?: number,
    @Query(
      'limit',
      new DefaultValuePipe(50),
      new ParseIntPipe({ optional: true }),
    )
    limit?: number,
  ) {
    const filtros: FilterAnalyticsDto = {
      tipoOperacao,
      filial,
      ano,
      mes,
      marca,
      nomeFantasia,
      grupo,
      subgrupo,
      empresaId,
    };
    return this.analyticsService.getCrescimentoAssociado(filtros, page, limit);
  }

  @Get('diagnostico')
  async diagnosticarDiscrepancia(
    @Query('ano', new ParseIntPipe({ optional: true })) ano?: number,
    @Query('mes', new ParseIntPipe({ optional: true })) mes?: number,
    @Query('tipoOperacao') tipoOperacao?: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return this.analyticsService.diagnosticarDiscrepancia({
      ano,
      mes,
      tipoOperacao,
      empresaId,
    });
  }

  @Get('consultar-total')
  async consultarTotalAnalytics(
    @Query('ano') anoStr?: string,
    @Query('mes') mesStr?: string,
    @Query('tipoOperacao') tipoOperacao?: string,
    @Query('empresaId') empresaId?: string,
  ) {
    // Converter strings para números apenas se forem válidas
    let ano: number | undefined;
    let mes: number | undefined;

    if (anoStr && anoStr.trim() !== '') {
      const anoParsed = parseInt(anoStr, 10);
      if (isNaN(anoParsed) || anoParsed <= 0) {
        throw new BadRequestException('ano deve ser um número válido');
      }
      ano = anoParsed;
    }

    if (mesStr && mesStr.trim() !== '') {
      const mesParsed = parseInt(mesStr, 10);
      if (isNaN(mesParsed) || mesParsed < 1 || mesParsed > 12) {
        throw new BadRequestException('mes deve ser um número entre 1 e 12');
      }
      mes = mesParsed;
    }

    return this.analyticsService.consultarTotalAnalytics({
      ano,
      mes,
      tipoOperacao,
      empresaId,
    });
  }

  @Get('filial-associado')
  async getFilialAssociadoAnalytics(
    @Query('ano', new ParseIntPipe({ optional: true })) ano?: number,
    @Query(
      'marca',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    marca?: string[],
    @Query(
      'tipoOperacao',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    tipoOperacao?: string[],
    @Query(
      'ufDestino',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    ufDestino?: string[],
    @Query(
      'nomeFantasia',
      new ParseArrayPipe({ items: String, optional: true, separator: ',' }),
    )
    nomeFantasia?: string[],
  ) {
    const filtros: FilialAssociadoAnalyticsDto = {
      ano,
      marca,
      tipoOperacao,
      ufDestino,
      nomeFantasia,
    };
    return this.analyticsService.getFilialAssociadoAnalytics(filtros);
  }
}
