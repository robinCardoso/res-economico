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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { VendasAnalyticsService } from './vendas-analytics.service';
import { VendasAnalyticsSyncService } from './vendas-analytics-sync.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';

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
    await this.analyticsService.recalculcarAnalytics(
      body.dataInicio ? new Date(body.dataInicio) : undefined,
      body.dataFim ? new Date(body.dataFim) : undefined,
    );
    return { message: 'Analytics recalculado com sucesso' };
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
    };
    return this.analyticsService.getCrescimentoAssociado(filtros, page, limit);
  }
}
