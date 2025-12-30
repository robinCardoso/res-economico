import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsEmail,
  Min,
  Max,
} from 'class-validator';

export class CreateConfiguracaoEmailDto {
  @IsString()
  nome: string;

  @IsString()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  porta: number;

  @IsBoolean()
  autenticar: boolean;

  @IsEmail()
  usuario: string;

  @IsString()
  senha: string;

  @IsOptional()
  @IsString()
  copiasPara?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
