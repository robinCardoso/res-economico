import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateComentarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comentario?: string;
}

