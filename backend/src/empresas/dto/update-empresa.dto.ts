import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsObject,
  IsUrl,
} from 'class-validator';
import { TipoEmpresa, PorteEmpresa, ModeloNegocio } from '@prisma/client';

export class UpdateEmpresaDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Razão Social deve ter pelo menos 2 caracteres' })
  razaoSocial?: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Nome Fantasia deve ter pelo menos 2 caracteres' })
  nomeFantasia?: string;

  @IsEnum(TipoEmpresa, { message: 'Tipo deve ser MATRIZ ou FILIAL' })
  @IsOptional()
  tipo?: TipoEmpresa;

  @IsString()
  @IsOptional()
  @MaxLength(2, { message: 'UF deve ter no máximo 2 caracteres' })
  uf?: string;

  // NOVOS CAMPOS PARA CONTEXTO IA
  @IsString()
  @IsOptional()
  setor?: string;

  @IsEnum(PorteEmpresa, {
    message: 'Porte deve ser MICRO, PEQUENA, MEDIA ou GRANDE',
  })
  @IsOptional()
  porte?: PorteEmpresa;

  @IsDateString({}, { message: 'Data de Fundação deve ser uma data válida' })
  @IsOptional()
  dataFundacao?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsUrl({}, { message: 'Website deve ser uma URL válida' })
  @IsOptional()
  website?: string;

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

  @IsBoolean()
  @IsOptional()
  custosCentralizados?: boolean;

  @IsObject()
  @IsOptional()
  contasCustos?: Record<string, string>;
}
