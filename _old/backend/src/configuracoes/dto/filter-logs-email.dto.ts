import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { StatusEnvioEmail } from '@prisma/client';

export class FilterLogsEmailDto {
  @IsOptional()
  @IsString()
  configuracaoId?: string;

  @IsOptional()
  @IsEnum(StatusEnvioEmail)
  status?: StatusEnvioEmail;

  @IsOptional()
  @IsString()
  destinatario?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
