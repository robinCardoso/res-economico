import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CampoMapeamentoDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  campo_bravo: string;

  @IsString()
  campo_interno: string;

  @IsString()
  tipo_transformacao: string;

  @IsBoolean()
  ativo: boolean;

  @IsNumber()
  ordem: number;
}

export class CreateMappingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampoMapeamentoDto)
  mapeamentos: CampoMapeamentoDto[];
}

export class MappingResponseDto {
  success: boolean;
  mapeamentos?: CampoMapeamentoDto[];
  error?: string;
}
