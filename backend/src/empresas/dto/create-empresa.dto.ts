import { IsString, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { TipoEmpresa } from '@prisma/client';

export class CreateEmpresaDto {
  @IsString()
  @IsNotEmpty({ message: 'CNPJ é obrigatório' })
  cnpj: string;

  @IsString()
  @IsNotEmpty({ message: 'Razão Social é obrigatória' })
  @MinLength(2, { message: 'Razão Social deve ter pelo menos 2 caracteres' })
  razaoSocial: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Nome Fantasia deve ter pelo menos 2 caracteres' })
  nomeFantasia?: string;

  @IsEnum(TipoEmpresa, { message: 'Tipo deve ser MATRIZ ou FILIAL' })
  @IsOptional()
  tipo?: TipoEmpresa;
}

