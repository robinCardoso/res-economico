import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { TipoReuniao } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class CreateModeloAtaDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsEnum(TipoReuniao)
  tipoReuniao: TipoReuniao;

  @IsObject()
  estrutura: Prisma.InputJsonValue;

  @IsOptional()
  @IsObject()
  exemplo?: Prisma.InputJsonValue;

  @IsOptional()
  @IsString()
  instrucoes?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  empresaId?: string;
}
