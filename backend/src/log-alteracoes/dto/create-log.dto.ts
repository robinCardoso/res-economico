import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { TipoAlteracaoAta } from '@prisma/client';

export class CreateLogDto {
  @IsString()
  ataId: string;

  @IsString()
  usuarioId: string;

  @IsEnum(TipoAlteracaoAta)
  tipoAlteracao: TipoAlteracaoAta;

  @IsString()
  @IsOptional()
  campo?: string;

  @IsString()
  @IsOptional()
  valorAnterior?: string;

  @IsString()
  @IsOptional()
  valorNovo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
