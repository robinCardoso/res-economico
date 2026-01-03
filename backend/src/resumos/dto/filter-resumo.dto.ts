import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoAnalise } from '../../ai/dto/analisar-dados.dto';
import { ResumoStatus } from '@prisma/client';

export class FilterResumoDto {
  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  ano?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @IsEnum(ResumoStatus)
  status?: ResumoStatus;

  @IsOptional()
  @IsEnum(TipoAnalise)
  tipoAnalise?: TipoAnalise;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
