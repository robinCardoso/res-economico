import { IsOptional, IsString, IsBoolean } from 'class-validator';

/**
 * DTO para buscar progresso de sincronização
 */
export class GetProgressDto {
  @IsString()
  sync_log_id: string;
}

/**
 * DTO para buscar logs de sincronização
 */
export class GetLogsDto {
  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  can_resume?: string;
}

/**
 * DTO para buscar detalhes de log específico
 */
export class GetLogDetailsDto {
  @IsString()
  log_id: string;

  @IsOptional()
  @IsBoolean()
  include_details?: boolean;
}

/**
 * DTO para cancelar sincronização
 */
export class CancelSyncDto {
  @IsOptional()
  @IsString()
  lockId?: string;

  @IsOptional()
  @IsString()
  syncLogId?: string;
}

/**
 * DTO para retomar sincronização
 */
export class ResumeSyncDto {
  @IsString()
  log_id: string;
}
