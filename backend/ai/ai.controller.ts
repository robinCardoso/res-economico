import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ParseEnumPipe,
  Optional,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { AnalisarDadosDto, TipoAnalise } from './dto/analisar-dados.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analisar')
  async analisar(@Body() dto: AnalisarDadosDto) {
    return this.aiService.analisarDados(dto);
  }

  @Get('analisar')
  async analisarGet(
    @Query('tipo', new ParseEnumPipe(TipoAnalise)) tipo: TipoAnalise,
    @Query('uploadId') uploadId?: string,
    @Query('empresaId') empresaId?: string,
    @Query('empresaIds') empresaIds?: string | string[],
    @Optional()
    @Query('mes', new ParseIntPipe({ optional: true }))
    mes?: number,
    @Optional()
    @Query('ano', new ParseIntPipe({ optional: true }))
    ano?: number,
    @Query('descricao') descricao?: string,
    @Optional()
    @Query('mes1', new ParseIntPipe({ optional: true }))
    mes1?: number,
    @Optional()
    @Query('ano1', new ParseIntPipe({ optional: true }))
    ano1?: number,
    @Optional()
    @Query('mes2', new ParseIntPipe({ optional: true }))
    mes2?: number,
    @Optional()
    @Query('ano2', new ParseIntPipe({ optional: true }))
    ano2?: number,
    @Query('tipoValor') tipoValor?: 'ACUMULADO' | 'PERIODO',
  ) {
    const empresaIdsArray = Array.isArray(empresaIds)
      ? empresaIds
      : empresaIds
        ? [empresaIds]
        : undefined;
    return this.aiService.analisarDados({
      tipo,
      uploadId,
      empresaId,
      empresaIds: empresaIdsArray,
      mes,
      ano,
      descricao,
      mes1,
      ano1,
      mes2,
      ano2,
      tipoValor,
    });
  }
}
