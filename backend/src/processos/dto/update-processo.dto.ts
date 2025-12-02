import {
  IsString,
  IsEmail,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

export enum SituacaoProcesso {
  AGUARDANDO_ANALISE = 'Aguardando Análise',
  EM_ANALISE = 'Em Análise',
  APROVADO = 'Aprovado',
  REJEITADO = 'Rejeitado',
  EM_PROCESSAMENTO = 'Em Processamento',
  CONCLUIDO = 'Concluído',
  CANCELADO = 'Cancelado',
}

export class UpdateProcessoDto {
  @IsUUID()
  processoId: string;

  @IsEmail()
  userEmail: string;

  @IsEnum(SituacaoProcesso)
  @IsOptional()
  situacao?: SituacaoProcesso;

  @IsString()
  @IsOptional()
  responsavel?: string;

  @IsDateString()
  @IsOptional()
  prazoResolucao?: string;

  @IsDateString()
  @IsOptional()
  dataSolucao?: string;

  @IsString()
  @IsOptional()
  comentarios?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NovaEntradaHistoricoDto)
  novaEntradaHistorico?: NovaEntradaHistoricoDto;
}

export class NovaEntradaHistoricoDto {
  @IsString()
  @IsOptional()
  acao?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  usuarioNome?: string;

  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}
