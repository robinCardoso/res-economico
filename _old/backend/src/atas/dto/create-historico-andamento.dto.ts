import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateHistoricoAndamentoDto {
  @IsString()
  acao: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  responsavel?: string;

  @IsOptional()
  @IsDateString()
  data?: string;
}
