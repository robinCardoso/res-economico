import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePedidoAnalyticsFilterDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsObject()
  @IsNotEmpty()
  filters: {
    ano?: number[];
    mes?: number[];
    marca?: string[];
    nomeFantasia?: string[];
    grupo?: string[];
    subgrupo?: string[];
    empresaId?: string[];
  };

  @IsString()
  @IsOptional()
  descricao?: string;
}
