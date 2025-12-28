import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class RecalcularDadosProdutoDto {
  @IsOptional()
  @IsString()
  produtoId?: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsBoolean()
  apenasPedidosFuturos?: boolean;

  @IsOptional()
  @IsDateString()
  dataLimite?: string;

  @IsOptional()
  @IsBoolean()
  atualizarMarca?: boolean;

  @IsOptional()
  @IsBoolean()
  atualizarGrupo?: boolean;

  @IsOptional()
  @IsBoolean()
  atualizarSubgrupo?: boolean;
}
