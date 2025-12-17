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
        const parsed: unknown = JSON.parse(value);
        return typeof parsed === 'object' &&
          parsed !== null &&
          !Array.isArray(parsed)
          ? (parsed as Record<string, string>)
          : undefined;
      } catch {
        return undefined;
      }
    }
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, string>)
      : undefined;
  })
  columnMapping?: Record<string, string>; // Mapeamento customizado do frontend (formato: { campo: nomeColuna })
}
