import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { TipoAlteracaoAta } from '@prisma/client';

export class FilterLogsDto {
  @IsOptional()
  @IsString()
  ataId?: string;

  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsEnum(TipoAlteracaoAta)
  tipoAlteracao?: TipoAlteracaoAta;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  busca?: string; // Busca por descrição ou campo
}
