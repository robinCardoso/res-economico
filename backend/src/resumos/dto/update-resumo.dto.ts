import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ResumoStatus } from '@prisma/client';

export class UpdateResumoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsEnum(ResumoStatus)
  status?: ResumoStatus;
}
