import { IsString, IsOptional, IsObject } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsOptional()
  usuarioId?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}
