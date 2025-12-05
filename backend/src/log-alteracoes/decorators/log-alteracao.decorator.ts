import { SetMetadata } from '@nestjs/common';
import { TipoAlteracaoAta } from '@prisma/client';

export interface LogAlteracaoOptions {
  tipo: TipoAlteracaoAta;
  campo?: string;
  descricao?: string;
  extrairValores?: (
    body: unknown,
    oldValue?: unknown,
  ) => {
    anterior?: string;
    novo?: string;
  };
}

export const LOG_ALTERACAO_KEY = 'log_alteracao';

/**
 * Decorator para marcar métodos que devem registrar logs de alteração
 */
export const LogAlteracao = (options: LogAlteracaoOptions) =>
  SetMetadata(LOG_ALTERACAO_KEY, options);
