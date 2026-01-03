import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoReuniao, StatusAta } from '@prisma/client';

export class FilterAtaDto {
  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsEnum(TipoReuniao)
  tipo?: TipoReuniao;

  @IsOptional()
  @IsEnum(StatusAta)
  status?: StatusAta;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  busca?: string;

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
