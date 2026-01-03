import { IsOptional, IsString, IsInt, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class FilialAssociadoAnalyticsDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  ano?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  marca?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  tipoOperacao?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  ufDestino?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  nomeFantasia?: string[];
}
