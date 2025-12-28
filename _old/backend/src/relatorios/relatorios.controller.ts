import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { TipoRelatorio } from './dto/gerar-relatorio.dto';
import {
  TipoComparacao,
  TipoValor,
} from './dto/gerar-relatorio-comparativo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('relatorios')
@UseGuards(JwtAuthGuard)
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('anos-disponiveis')
  async getAnosDisponiveis() {
    return this.relatoriosService.getAnosDisponiveis();
  }

  @Get('meses-disponiveis')
  async getMesesDisponiveis(
    @Query('ano', ParseIntPipe) ano: number,
    @Query('empresaId') empresaId?: string,
  ) {
    return this.relatoriosService.getMesesDisponiveis(ano, empresaId);
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
    @Query('mesInicial') mesInicial?: string,
    @Query('mesFinal') mesFinal?: string,
  ) {
    try {
      // Validar intervalo de meses
      let mesInicialNum: number | undefined;
      let mesFinalNum: number | undefined;

      if (mesInicial) {
        mesInicialNum = parseInt(mesInicial, 10);
        if (isNaN(mesInicialNum) || mesInicialNum < 1 || mesInicialNum > 12) {
          throw new BadRequestException('mesInicial deve estar entre 1 e 12');
        }
      }

      if (mesFinal) {
        mesFinalNum = parseInt(mesFinal, 10);
        if (isNaN(mesFinalNum) || mesFinalNum < 1 || mesFinalNum > 12) {
          throw new BadRequestException('mesFinal deve estar entre 1 e 12');
        }
      }

      if (mesInicialNum && mesFinalNum && mesInicialNum > mesFinalNum) {
        throw new BadRequestException(
          'mesInicial deve ser menor ou igual a mesFinal',
        );
      }

      // Converter empresaIds para array se for string
      const empresaIdsArray = Array.isArray(empresaIds)
        ? empresaIds
        : empresaIds
          ? [empresaIds]
          : undefined;

      return await this.relatoriosService.gerarRelatorioResultado(
        ano,
        empresaId,
        empresaIdsArray,
        tipo,
        descricao,
        mesInicialNum,
        mesFinalNum,
      );
    } catch (error) {
      console.error('[RelatoriosController] Erro ao gerar relatório:', error);
      throw error;
    }
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
    @Query('tipoValor') tipoValor?: TipoValor,
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
      tipoValor || TipoValor.ACUMULADO, // Padrão: ACUMULADO
    );
  }
}
