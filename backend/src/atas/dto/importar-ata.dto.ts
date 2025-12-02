import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { TipoReuniao } from '@prisma/client';

export class ImportarAtaDto {
  @IsString()
  nomeArquivo: string;

  @IsString()
  tipoArquivo: string;

  @IsString()
  conteudoBase64: string;

  @IsDateString()
  dataReuniao: string;

  @IsOptional()
  @IsEnum(TipoReuniao)
  tipoReuniao?: TipoReuniao;
}
