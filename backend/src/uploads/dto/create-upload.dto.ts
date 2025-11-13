import { IsString, IsInt, Min, Max, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUploadDto {
  @IsString()
  @IsNotEmpty({ message: 'Empresa é obrigatória' })
  empresaId: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês deve ser entre 1 e 12' })
  mes: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(2020, { message: 'Ano inválido' })
  @Max(2100, { message: 'Ano inválido' })
  ano: number;

  @IsString()
  @IsOptional()
  templateId?: string;
}

