import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { TipoComentario } from '@prisma/client';

export class CreateComentarioDto {
  @IsString()
  @IsNotEmpty()
  comentario: string;

  @IsEnum(TipoComentario)
  tipo: TipoComentario;

  @IsOptional()
  @IsString()
  comentarioPaiId?: string; // Para respostas a outros comentários
}

