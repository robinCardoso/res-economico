import { IsObject, IsOptional, IsString, IsBoolean } from 'class-validator';

export class TestarConfiguracaoDto {
  @IsObject()
  @IsOptional()
  contasReceita?: Record<string, string>;

  @IsObject()
  @IsOptional()
  contasCustos?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  custosCentralizados?: boolean;

  @IsBoolean()
  @IsOptional()
  receitasCentralizadas?: boolean;

  @IsString()
  @IsOptional()
  empresaId?: string; // Para testar com dados de uma empresa específica
}
