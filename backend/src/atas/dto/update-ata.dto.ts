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
import { TipoReuniao, StatusAta } from '@prisma/client';

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

export class UpdateAtaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsEnum(TipoReuniao)
  tipo?: TipoReuniao;

  @IsOptional()
  @IsDateString()
  dataReuniao?: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsEnum(StatusAta)
  status?: StatusAta;

  @IsOptional()
  @IsString()
  pauta?: string;

  @IsOptional()
  @IsString()
  conteudo?: string;

  @IsOptional()
  decisoes?: any; // Campo JSON - aceita array ou objeto

  @IsOptional()
  acoes?: any; // Campo JSON - aceita array ou objeto

  @IsOptional()
  @IsString()
  observacoes?: string; // Mantido para compatibilidade com legado

  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipanteDto)
  participantes?: ParticipanteDto[];
}

