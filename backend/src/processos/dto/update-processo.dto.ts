import {
  IsString,
  IsEmail,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';

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
  novaEntradaHistorico?: any;
}

