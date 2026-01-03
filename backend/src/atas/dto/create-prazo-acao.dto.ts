import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { StatusPrazo } from '@prisma/client';

export class CreatePrazoAcaoDto {
  @IsString()
  titulo: string;

  @IsDateString()
  dataPrazo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  acaoId?: string;

  @IsOptional()
  @IsEnum(StatusPrazo)
  status?: StatusPrazo;
}
