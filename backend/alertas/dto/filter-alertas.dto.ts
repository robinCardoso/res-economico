import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AlertaStatus, AlertaTipo, AlertaSeveridade } from '@prisma/client';

export class FilterAlertasDto {
  @IsEnum(AlertaStatus)
  @IsOptional()
  status?: AlertaStatus;

  @IsEnum(AlertaTipo)
  @IsOptional()
  tipo?: AlertaTipo;

  @IsEnum(AlertaSeveridade)
  @IsOptional()
  severidade?: AlertaSeveridade;

  @IsString()
  @IsOptional()
  empresaId?: string;

  @IsString()
  @IsOptional()
  uploadId?: string;

  @IsString()
  @IsOptional()
  alertaId?: string;

  @IsString()
  @IsOptional()
  busca?: string; // Busca por mensagem, classificação, nome da conta

  @IsString()
  @IsOptional()
  tipoConta?: string; // Filtro por tipo de conta (ex: "1-Ativo", "2-Passivo", etc.)
}
