import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePedidoColumnMappingDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsObject()
  @IsNotEmpty()
  columnMapping: Record<string, string>; // { numeroPedido: "Num Pedido", data: "Data Pedido", ... }

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
