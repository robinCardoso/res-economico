import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterProcessosDto {
  @IsEmail()
  userEmail: string;

  @IsString()
  @IsOptional()
  situacao?: string;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsString()
  @IsOptional()
  uf?: string;

  @IsString()
  @IsOptional()
  fabrica?: string;

  @IsString()
  @IsOptional()
  numeroControle?: string;

  @IsString()
  @IsOptional()
  protocolo?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limite?: number = 20;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}

