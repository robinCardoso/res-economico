import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePedidoDto {
  @IsString()
  numeroPedido: string;

  @IsOptional()
  @IsString()
  idDoc?: string;

  @IsDateString()
  dataPedido: string;

  @IsString()
  nomeFantasia: string;

  @IsOptional()
  @IsString()
  idProd?: string;

  @IsOptional()
  @IsString()
  referencia?: string;

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

