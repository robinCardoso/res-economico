import { PartialType } from '@nestjs/mapped-types';
import { CreatePrazoAcaoDto } from './create-prazo-acao.dto';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdatePrazoAcaoDto extends PartialType(CreatePrazoAcaoDto) {
  @IsOptional()
  @IsBoolean()
  concluido?: boolean;

  @IsOptional()
  @IsDateString()
  dataConclusao?: string;
}
