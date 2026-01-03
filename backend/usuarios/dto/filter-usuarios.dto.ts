import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterUsuariosDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string; // Busca por nome ou email

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  empresaId?: string;
}
