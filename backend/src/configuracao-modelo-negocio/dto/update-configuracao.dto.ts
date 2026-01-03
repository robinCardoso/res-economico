import {
  IsEnum,
  IsObject,
  IsBoolean,
  IsString,
  IsOptional,
} from 'class-validator';
import { ModeloNegocio } from '@prisma/client';

export class UpdateConfiguracaoModeloNegocioDto {
  @IsEnum(ModeloNegocio, {
    message:
      'Modelo de Negócio deve ser ASSOCIACAO, COMERCIO, INDUSTRIA, SERVICOS, AGROPECUARIA ou OUTRO',
  })
  @IsOptional()
  modeloNegocio?: ModeloNegocio;

  @IsObject()
  @IsOptional()
  modeloNegocioDetalhes?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  contasReceita?: Record<string, string>;

  @IsObject()
  @IsOptional()
  contasCustos?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  custosCentralizados?: boolean;

  @IsBoolean()
  @IsOptional()
  receitasCentralizadas?: boolean;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
