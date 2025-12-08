import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVendaDto {
  @IsString()
  nfe: string;

  @IsOptional()
  @IsString()
  idDoc?: string;

  @IsDateString()
  dataVenda: string;

  @IsString()
  razaoSocial: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @IsOptional()
  @IsString()
  cnpjCliente?: string;

  @IsOptional()
  @IsString()
  ufDestino?: string;

  @IsOptional()
  @IsString()
  ufOrigem?: string;

  @IsOptional()
  @IsString()
  idProd?: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  prodCodMestre?: string;

  @IsOptional()
  @IsString()
  descricaoProduto?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  grupo?: string;

  @IsOptional()
  @IsString()
  subgrupo?: string;

  @IsOptional()
  @IsString()
  tipoOperacao?: string;

  @IsNumber()
  @Type(() => Number)
  quantidade: number;

  @IsNumber()
  @Type(() => Number)
  valorUnitario: number;

  @IsNumber()
  @Type(() => Number)
  valorTotal: number;

  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsString()
  produtoId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
