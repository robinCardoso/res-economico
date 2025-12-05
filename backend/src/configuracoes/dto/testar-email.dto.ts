import { IsEmail, IsString, IsOptional } from 'class-validator';

export class TestarEmailDto {
  @IsEmail()
  destinatario: string;

  @IsOptional()
  @IsString()
  assunto?: string;

  @IsOptional()
  @IsString()
  corpo?: string;
}

