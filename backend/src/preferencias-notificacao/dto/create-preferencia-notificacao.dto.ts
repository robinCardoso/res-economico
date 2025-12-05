import {
  IsBoolean,
  IsString,
  IsArray,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreatePreferenciaNotificacaoDto {
  @IsBoolean()
  @IsOptional()
  emailAtivo?: boolean;

  @IsBoolean()
  @IsOptional()
  sistemaAtivo?: boolean;

  @IsBoolean()
  @IsOptional()
  pushAtivo?: boolean;

  // Frequência de lembretes
  @IsBoolean()
  @IsOptional()
  lembrete3Dias?: boolean;

  @IsBoolean()
  @IsOptional()
  lembrete1Dia?: boolean;

  @IsBoolean()
  @IsOptional()
  lembreteHoje?: boolean;

  @IsBoolean()
  @IsOptional()
  lembreteVencido?: boolean;

  // Horários
  @IsString()
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário deve estar no formato HH:MM',
  })
  horarioInicio?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário deve estar no formato HH:MM',
  })
  horarioFim?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  diasSemana?: string[];

  // Tipos de eventos
  @IsBoolean()
  @IsOptional()
  notificarPrazos?: boolean;

  @IsBoolean()
  @IsOptional()
  notificarHistorico?: boolean;

  @IsBoolean()
  @IsOptional()
  notificarComentarios?: boolean;

  @IsBoolean()
  @IsOptional()
  notificarStatus?: boolean;

  // Resumos
  @IsBoolean()
  @IsOptional()
  resumoDiario?: boolean;

  @IsBoolean()
  @IsOptional()
  resumoSemanal?: boolean;

  @IsString()
  @IsOptional()
  diaResumoSemanal?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário deve estar no formato HH:MM',
  })
  horarioResumoSemanal?: string;
}
