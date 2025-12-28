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
import { VendasAnalyticsDirectService } from './vendas-analytics-direct.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import { FilialAssociadoAnalyticsDto } from './dto/filial-associado-analytics.dto';

@Controller('vendas/analytics')
@UseGuards(JwtAuthGuard)
export class VendasAnalyticsController {
  constructor(
    private readonly analyticsService: VendasAnalyticsService,
    private readonly syncService: VendasAnalyticsSyncService,
    private readonly directService: VendasAnalyticsDirectService,
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

  // =====================================================
  // ENDPOINTS V2 - BUSCAM DIRETAMENTE DA TABELA VENDA
  // =====================================================

  @Get('v2/crescimento-empresa')
  async getCrescimentoEmpresaV2(
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
    return this.directService.getCrescimentoEmpresa(filtros);
  }

  @Get('v2/crescimento-filial')
  async getCrescimentoFilialV2(
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
    return this.directService.getCrescimentoFilial(filtros);
  }

  @Get('v2/crescimento-marca')
  async getCrescimentoMarcaV2(
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
    return this.directService.getCrescimentoMarca(filtros);
  }

  @Get('v2/crescimento-associado')
  async getCrescimentoAssociadoV2(
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
    return this.directService.getCrescimentoAssociado(filtros, page, limit);
  }

  @Get('v2/filial-associado')
  async getFilialAssociadoAnalyticsV2(
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
    return this.directService.getFilialAssociadoAnalytics(filtros);
  }
}
