import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { TipoReuniao } from '@prisma/client';

export class FilterModeloAtaDto {
  @IsOptional()
  @IsEnum(TipoReuniao)
  tipoReuniao?: TipoReuniao;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
