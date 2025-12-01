/**
 * Funções de mapeamento entre o formato do painel-completo e nosso schema
 */

// Mapeamento de Status: painel-completo → nosso schema
export const statusMapToBackend: Record<string, string> = {
  'rascunho': 'RASCUNHO',
  'finalizada': 'PUBLICADA',
  'aprovada': 'PUBLICADA',
  'arquivada': 'ARQUIVADA',
};

// Mapeamento de Status: nosso schema → painel-completo (frontend)
export const statusMapToFrontend: Record<string, string> = {
  'RASCUNHO': 'rascunho',
  'PUBLICADA': 'finalizada',
  'ARQUIVADA': 'arquivada',
};

// Mapeamento de Tipos de Reunião: painel-completo → nosso schema
export const tipoReuniaoMapToBackend: Record<string, string> = {
  'reuniao_geral': 'REUNIAO_ORDINARIA',
  'reuniao_diretoria': 'CONSELHO_DIRETOR',
  'reuniao_tecnica': 'COMISSAO',
  'outro': 'OUTRO',
};

// Mapeamento de Tipos de Reunião: nosso schema → painel-completo (frontend)
export const tipoReuniaoMapToFrontend: Record<string, string> = {
  'ASSEMBLEIA_GERAL': 'reuniao_geral',
  'CONSELHO_DIRETOR': 'reuniao_diretoria',
  'REUNIAO_ORDINARIA': 'reuniao_geral',
  'REUNIAO_EXTRAORDINARIA': 'reuniao_geral',
  'COMISSAO': 'reuniao_tecnica',
  'OUTRO': 'outro',
};

/**
 * Converte status do frontend (painel-completo) para o formato do backend
 */
export function mapStatusToBackend(status: string): string {
  return statusMapToBackend[status.toLowerCase()] || status.toUpperCase();
}

/**
 * Converte status do backend para o formato do frontend (painel-completo)
 */
export function mapStatusToFrontend(status: string): string {
  return statusMapToFrontend[status.toUpperCase()] || status.toLowerCase();
}

/**
 * Converte tipo de reunião do frontend (painel-completo) para o formato do backend
 */
export function mapTipoReuniaoToBackend(tipo: string): string {
  return tipoReuniaoMapToBackend[tipo.toLowerCase()] || tipo.toUpperCase();
}

/**
 * Converte tipo de reunião do backend para o formato do frontend (painel-completo)
 */
export function mapTipoReuniaoToFrontend(tipo: string): string {
  return tipoReuniaoMapToFrontend[tipo.toUpperCase()] || tipo.toLowerCase();
}

