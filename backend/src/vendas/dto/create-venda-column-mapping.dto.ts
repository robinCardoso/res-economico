import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateVendaColumnMappingDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsObject()
  @IsNotEmpty()
  columnMapping: Record<string, string>; // { nfe: "NNF", data: "DataE", ... }

  @IsObject()
  @IsOptional()
  filters?: Array<{
    id: string;
    column: string;
    condition: string;
    value?: string;
  }>;

  @IsString()
  @IsOptional()
  descricao?: string;
}
