import {
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum TipoRelatorio {
  FILIAL = 'FILIAL',
  CONSOLIDADO = 'CONSOLIDADO',
}

export class GerarRelatorioDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  ano: number;

  @IsOptional()
  @IsString()
  empresaId?: string; // Para FILIAL: uma empresa

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  empresaIds?: string[]; // Para CONSOLIDADO: empresas específicas

  @IsEnum(TipoRelatorio)
  tipo: TipoRelatorio;
}
