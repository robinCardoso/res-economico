import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { GerarRelatorioDto, TipoRelatorio } from './dto/gerar-relatorio.dto';
import { TipoComparacao } from './dto/gerar-relatorio-comparativo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('relatorios')
@UseGuards(JwtAuthGuard)
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('anos-disponiveis')
  async getAnosDisponiveis() {
    return this.relatoriosService.getAnosDisponiveis();
  }

  @Get('descricoes-disponiveis')
  async getDescricoesDisponiveis(@Query('busca') busca?: string) {
    return this.relatoriosService.getDescricoesDisponiveis(busca);
  }

  @Get('resultado')
  async gerarResultado(
    @Query('ano', ParseIntPipe) ano: number,
    @Query('empresaId') empresaId?: string,
    @Query('empresaIds') empresaIds?: string | string[],
    @Query('tipo') tipo: TipoRelatorio = TipoRelatorio.CONSOLIDADO,
    @Query('descricao') descricao?: string,
  ) {
    // Converter empresaIds para array se for string
    const empresaIdsArray = Array.isArray(empresaIds)
      ? empresaIds
      : empresaIds
        ? [empresaIds]
        : undefined;

    return this.relatoriosService.gerarRelatorioResultado(
      ano,
      empresaId,
      empresaIdsArray,
      tipo,
      descricao,
    );
  }

  @Get('comparativo')
  async gerarComparativo(
    @Query('tipoComparacao') tipoComparacao: TipoComparacao,
    @Query('mes1', ParseIntPipe) mes1: number,
    @Query('ano1', ParseIntPipe) ano1: number,
    @Query('mes2', ParseIntPipe) mes2: number,
    @Query('ano2', ParseIntPipe) ano2: number,
    @Query('tipo') tipo: TipoRelatorio = TipoRelatorio.CONSOLIDADO,
    @Query('empresaId') empresaId?: string,
    @Query('empresaIds') empresaIds?: string | string[],
    @Query('descricao') descricao?: string,
  ) {
    // Converter empresaIds para array se for string
    const empresaIdsArray = Array.isArray(empresaIds)
      ? empresaIds
      : empresaIds
        ? [empresaIds]
        : undefined;

    return this.relatoriosService.gerarRelatorioComparativo(
      tipoComparacao,
      mes1,
      ano1,
      mes2,
      ano2,
      tipo,
      empresaId,
      empresaIdsArray,
      descricao,
    );
  }
}

