import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUploadDto {
  @IsString()
  @IsNotEmpty({ message: 'Empresa é obrigatória' })
  empresaId: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value as number;
  })
  @IsInt()
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês deve ser entre 1 e 12' })
  mes: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value as number;
  })
  @IsInt()
  @Min(2020, { message: 'Ano inválido' })
  @Max(2100, { message: 'Ano inválido' })
  ano: number;

  @IsString()
  @IsOptional()
  templateId?: string;
}
