import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ImportVendasDto {
  @IsOptional()
  @IsString()
  mappingName?: string; // Nome do mapeamento de colunas a ser usado

  @IsNotEmpty({ message: 'empresaId é obrigatório' })
  @IsString()
  empresaId: string; // ID da empresa relacionada (obrigatório)

  @IsOptional()
  @Transform(({ value }) => {
    // Se vier como string JSON (do FormData), fazer parse
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return value;
  })
  columnMapping?: Record<string, string>; // Mapeamento customizado do frontend (formato: { campo: nomeColuna })
}
