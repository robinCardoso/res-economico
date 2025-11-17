import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { GerarRelatorioDto, TipoRelatorio } from './dto/gerar-relatorio.dto';
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
}

