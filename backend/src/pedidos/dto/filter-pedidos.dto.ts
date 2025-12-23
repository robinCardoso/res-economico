import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterPedidosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  numeroPedido?: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  grupo?: string;

  @IsOptional()
  @IsString()
  subgrupo?: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}

