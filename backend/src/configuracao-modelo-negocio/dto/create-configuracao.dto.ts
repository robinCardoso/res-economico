import {
  IsEnum,
  IsObject,
  IsBoolean,
  IsString,
  IsOptional,
} from 'class-validator';
import { ModeloNegocio } from '@prisma/client';

export class CreateConfiguracaoModeloNegocioDto {
  @IsEnum(ModeloNegocio, {
    message:
      'Modelo de Negócio deve ser ASSOCIACAO, COMERCIO, INDUSTRIA, SERVICOS, AGROPECUARIA ou OUTRO',
  })
  modeloNegocio: ModeloNegocio;

  @IsObject()
  modeloNegocioDetalhes: Record<string, unknown>;

  @IsObject()
  contasReceita: Record<string, string>;

  @IsObject()
  contasCustos: Record<string, string>;

  @IsBoolean()
  custosCentralizados: boolean;

  @IsBoolean()
  receitasCentralizadas: boolean;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
