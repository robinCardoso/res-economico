import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportVendasDto {
  @IsOptional()
  @IsString()
  mappingName?: string; // Nome do mapeamento de colunas a ser usado

  @IsNotEmpty({ message: 'empresaId é obrigatório' })
  @IsString()
  empresaId: string; // ID da empresa relacionada (obrigatório)
}
