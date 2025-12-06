import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class CreateConfigDto {
  @IsString()
  baseUrl: string;

  @IsString()
  cliente: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  senha?: string;

  @IsString()
  @IsOptional()
  pdv?: string;

  @IsEnum(['p', 'h'])
  ambiente: 'p' | 'h';

  @IsString()
  @IsOptional()
  server?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsNumber()
  @IsOptional()
  timeout?: number;

  @IsBoolean()
  @IsOptional()
  verificar_duplicatas?: boolean;

  @IsBoolean()
  @IsOptional()
  usar_data_ult_modif?: boolean;
}

export class ConfigResponseDto {
  success: boolean;
  config?: {
    baseUrl: string;
    cliente: string;
    email: string;
    senha: string;
    pdv: string;
    ambiente: 'p' | 'h';
    server: string;
    token: string;
    timeout: number;
    verificar_duplicatas: boolean;
    usar_data_ult_modif: boolean;
  };
  error?: string;
}
