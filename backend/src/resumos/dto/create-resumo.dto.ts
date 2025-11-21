import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoAnalise, AnalisarDadosDto } from '../../ai/dto/analisar-dados.dto';

export class CreateResumoDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  ano: number;

  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsString()
  uploadId?: string;

  @IsEnum(TipoAnalise)
  tipoAnalise: TipoAnalise;

  @ValidateNested()
  @Type(() => AnalisarDadosDto)
  parametros: AnalisarDadosDto;
}
