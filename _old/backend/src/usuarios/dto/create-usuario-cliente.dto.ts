import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';

enum TipoClienteAssociacao {
  VENDA = 'VENDA',
  PEDIDO = 'PEDIDO',
  AMBOS = 'AMBOS',
}

export class CreateUsuarioClienteDto {
  @IsString()
  nomeFantasia: string;

  @IsEnum(TipoClienteAssociacao, {
    message: 'Tipo de cliente deve ser VENDA, PEDIDO ou AMBOS',
  })
  tipoCliente: 'VENDA' | 'PEDIDO' | 'AMBOS';

  @IsOptional()
  @IsObject()
  permissoes?: {
    vendas?: boolean;
    pedidos?: boolean;
    analytics?: boolean;
  };
}
