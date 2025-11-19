import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ContaStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class FilterContasDto {
  @IsEnum(ContaStatus)
  @IsOptional()
  status?: ContaStatus;

  @IsString()
  @IsOptional()
  tipoConta?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  @IsOptional()
  nivel?: number;

  @IsString()
  @IsOptional()
  busca?: string; // Busca por classificação ou nome da conta

  @IsString()
  @IsOptional()
  classificacaoPrefix?: string; // Prefixo da classificação (ex: "1." para ativos)
}
