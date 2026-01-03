import {
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { TipoRelatorio } from './gerar-relatorio.dto';

export enum TipoComparacao {
  MES_A_MES = 'MES_A_MES', // Comparar dois meses consecutivos
  ANO_A_ANO = 'ANO_A_ANO', // Comparar mesmo mês em anos diferentes
  CUSTOMIZADO = 'CUSTOMIZADO', // Comparar dois períodos específicos
}

export enum TipoValor {
  ACUMULADO = 'ACUMULADO', // Saldo acumulado até o mês (saldoAtual)
  PERIODO = 'PERIODO', // Movimentação do mês (credito - debito)
}

export class GerarRelatorioComparativoDto {
  @IsEnum(TipoComparacao)
  tipoComparacao: TipoComparacao;

  @IsInt()
  @Min(1)
  @Max(12)
  mes1: number; // Mês do período 1

  @IsInt()
  @Min(2020)
  @Max(2100)
  ano1: number; // Ano do período 1

  @IsInt()
  @Min(1)
  @Max(12)
  mes2: number; // Mês do período 2

  @IsInt()
  @Min(2020)
  @Max(2100)
  ano2: number; // Ano do período 2

  @IsEnum(TipoRelatorio)
  tipo: TipoRelatorio; // FILIAL ou CONSOLIDADO

  @IsOptional()
  @IsString()
  empresaId?: string; // Para FILIAL: uma empresa

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  empresaIds?: string[]; // Para CONSOLIDADO: empresas específicas

  @IsOptional()
  @IsString()
  descricao?: string; // Filtro opcional por descrição

  @IsOptional()
  @IsEnum(TipoValor)
  tipoValor?: TipoValor; // Tipo de valor: ACUMULADO (padrão) ou PERIODO
}
