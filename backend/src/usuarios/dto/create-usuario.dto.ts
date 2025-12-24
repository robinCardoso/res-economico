import { IsEmail, IsString, MinLength, IsArray, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @IsString()
  nome: string;

  @IsArray()
  @IsString({ each: true })
  roles: string[]; // ['admin', 'associado', 'fornecedor', 'user']

  @IsOptional()
  @IsString()
  empresaId?: string;
}
