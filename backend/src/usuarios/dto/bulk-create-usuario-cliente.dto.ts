import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUsuarioClienteDto } from './create-usuario-cliente.dto';

export class BulkCreateUsuarioClienteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUsuarioClienteDto)
  clientes: CreateUsuarioClienteDto[];
}
