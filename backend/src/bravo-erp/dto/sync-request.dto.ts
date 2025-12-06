import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SyncRequestDto {
  @IsBoolean()
  @IsOptional()
  apenas_ativos?: boolean;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  pages?: number;

  @IsString()
  @IsOptional()
  resume_sync_id?: string;

  @IsBoolean()
  @IsOptional()
  verificar_duplicatas?: boolean;

  @IsBoolean()
  @IsOptional()
  usar_data_ult_modif?: boolean;

  @IsBoolean()
  @IsOptional()
  modo_teste?: boolean;

  @IsBoolean()
  @IsOptional()
  teste_duplicatas?: boolean;
}

export class SyncResponseDto {
  success: boolean;
  message?: string;
  sync_log_id?: string;
  lock_id?: string;
  data?: {
    filtro_aplicado: string;
    total_produtos_bravo: number;
    produtos_filtrados: number;
    paginas_processadas: number;
    tempo_total_segundos: number;
  };
  error?: string;
  details?: string;
}
