import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnMappingDto {
  @IsString()
  @IsOptional()
  classificacao?: string;

  @IsString()
  @IsOptional()
  conta?: string;

  @IsString()
  @IsOptional()
  subConta?: string;

  @IsString()
  @IsOptional()
  nomeConta?: string;

  @IsString()
  @IsOptional()
  tipoConta?: string;

  @IsString()
  @IsOptional()
  nivel?: string;

  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  estabelecimento?: string;

  @IsString()
  @IsOptional()
  saldoAnterior?: string;

  @IsString()
  @IsOptional()
  debito?: string;

  @IsString()
  @IsOptional()
  credito?: string;

  @IsString()
  @IsOptional()
  saldoAtual?: string;
}

export class CreateTemplateDto {
  @IsString()
  @IsOptional()
  empresaId?: string | null; // Opcional: null/undefined = template global (todas as empresas)

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ColumnMappingDto)
  columnMapping: ColumnMappingDto;
}
