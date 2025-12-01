import { IsOptional, IsString } from 'class-validator';

export class AnalisarAtaDto {
  @IsOptional()
  @IsString()
  tipoAnalise?: 'resumo' | 'decisoes' | 'acoes' | 'completo';
}

