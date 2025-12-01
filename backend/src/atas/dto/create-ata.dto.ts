import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoReuniao } from '@prisma/client';

export class ParticipanteDto {
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsString()
  nomeExterno?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsBoolean()
  presente?: boolean;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class CreateAtaDto {
  @IsString()
  titulo: string;

  @IsEnum(TipoReuniao)
  tipo: TipoReuniao;

  @IsDateString()
  dataReuniao: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsString()
  pauta?: string;

  @IsOptional()
  @IsString()
  conteudo?: string;

  @IsOptional()
  @IsString()
  decisoes?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipanteDto)
  participantes?: ParticipanteDto[];
}

