import { IsString, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  endpoint: string;

  @IsString()
  p256dh: string;

  @IsString()
  auth: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

