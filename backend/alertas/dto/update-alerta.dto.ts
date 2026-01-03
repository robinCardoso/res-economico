import { IsEnum, IsOptional } from 'class-validator';
import { AlertaStatus } from '@prisma/client';

export class UpdateAlertaDto {
  @IsEnum(AlertaStatus)
  @IsOptional()
  status?: AlertaStatus;
}
