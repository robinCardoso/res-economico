import { IsOptional, IsString, IsDateString } from 'class-validator';

export class FilterAuditoriaDto {
  @IsString()
  @IsOptional()
  recurso?: string;

  @IsString()
  @IsOptional()
  acao?: string;

  @IsString()
  @IsOptional()
  usuarioId?: string;

  @IsString()
  @IsOptional()
  busca?: string; // Busca por recurso, ação ou dados

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;
}

