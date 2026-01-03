import { IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { TipoReuniao } from '@prisma/client';

export class ImportarEmProcessoDto {
  @IsEnum(TipoReuniao)
  tipoReuniao: TipoReuniao;

  @IsDateString()
  dataReuniao: string;

  @IsOptional()
  @IsDateString()
  dataAssinatura?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
