import { IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { TipoReuniao } from '@prisma/client';

export class ImportarRascunhoDto {
  @IsEnum(TipoReuniao)
  tipoReuniao: TipoReuniao;

  @IsDateString()
  dataReuniao: string;

  @IsOptional()
  @IsString()
  modeloAtaId?: string;
}
