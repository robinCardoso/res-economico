import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export enum TipoAnalise {
  UPLOAD = 'UPLOAD', // Análise de um upload específico
  ALERTAS = 'ALERTAS', // Análise de alertas
  RELATORIO = 'RELATORIO', // Análise de relatório
  COMPARATIVO = 'COMPARATIVO', // Análise de relatório comparativo
  GERAL = 'GERAL', // Análise geral do sistema
}

export class AnalisarDadosDto {
  @IsEnum(TipoAnalise)
  tipo: TipoAnalise;

  @IsOptional()
  @IsString()
  uploadId?: string;

  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  empresaIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  ano?: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  // Campos específicos para análise comparativa
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  mes1?: number;

  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  ano1?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  mes2?: number;

  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  ano2?: number;

  @IsOptional()
  @IsString()
  tipoValor?: 'ACUMULADO' | 'PERIODO';
}
