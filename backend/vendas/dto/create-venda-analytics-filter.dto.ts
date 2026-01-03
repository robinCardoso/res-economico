import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateVendaAnalyticsFilterDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsObject()
  @IsNotEmpty()
  filters: {
    tipoOperacao?: string[];
    filial?: string[];
    ano?: number[];
    mes?: number[];
    marca?: string[];
    nomeFantasia?: string[];
    grupo?: string[];
    subgrupo?: string[];
  };

  @IsString()
  @IsOptional()
  descricao?: string;
}
