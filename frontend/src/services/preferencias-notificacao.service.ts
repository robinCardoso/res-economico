// Usar API route do Next.js como proxy
const API_BASE = '/api';

/**
 * Obtém o token de autenticação do localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const auth = JSON.parse(authStorage);
      return auth?.state?.token || null;
    }
  } catch {
    // Ignora erros de parsing
  }

  return null;
}

/**
 * Cria headers com autenticação
 */
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export interface PreferenciaNotificacao {
  id: string;
  usuarioId: string;
  emailAtivo: boolean;
  sistemaAtivo: boolean;
  pushAtivo: boolean;
  lembrete3Dias: boolean;
  lembrete1Dia: boolean;
  lembreteHoje: boolean;
  lembreteVencido: boolean;
  horarioInicio: string;
  horarioFim: string;
  diasSemana: string[];
  notificarPrazos: boolean;
  notificarHistorico: boolean;
  notificarComentarios: boolean;
  notificarStatus: boolean;
  resumoDiario: boolean;
  resumoSemanal: boolean;
  diaResumoSemanal: string;
  horarioResumoSemanal: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePreferenciaNotificacaoDto {
  emailAtivo?: boolean;
  sistemaAtivo?: boolean;
  pushAtivo?: boolean;
  lembrete3Dias?: boolean;
  lembrete1Dia?: boolean;
  lembreteHoje?: boolean;
  lembreteVencido?: boolean;
  horarioInicio?: string;
  horarioFim?: string;
  diasSemana?: string[];
  notificarPrazos?: boolean;
  notificarHistorico?: boolean;
  notificarComentarios?: boolean;
  notificarStatus?: boolean;
  resumoDiario?: boolean;
  resumoSemanal?: boolean;
  diaResumoSemanal?: string;
  horarioResumoSemanal?: string;
}

export type UpdatePreferenciaNotificacaoDto = Partial<CreatePreferenciaNotificacaoDto>;

export const preferenciasNotificacaoService = {
  /**
   * Busca as preferências do usuário logado
   */
  async buscar(): Promise<PreferenciaNotificacao> {
    const response = await fetch(`${API_BASE}/preferencias-notificacao`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string; message?: string })?.error ||
          (errorData as { error?: string; message?: string })?.message ||
          'Erro ao buscar preferências',
      );
    }

    return response.json();
  },

  /**
   * Cria preferências para o usuário logado
   */
  async criar(
    dto: CreatePreferenciaNotificacaoDto,
  ): Promise<PreferenciaNotificacao> {
    const response = await fetch(`${API_BASE}/preferencias-notificacao`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string; message?: string })?.error ||
          (errorData as { error?: string; message?: string })?.message ||
          'Erro ao criar preferências',
      );
    }

    return response.json();
  },

  /**
   * Atualiza as preferências do usuário logado
   */
  async atualizar(
    dto: UpdatePreferenciaNotificacaoDto,
  ): Promise<PreferenciaNotificacao> {
    const response = await fetch(`${API_BASE}/preferencias-notificacao`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string; message?: string })?.error ||
          (errorData as { error?: string; message?: string })?.message ||
          'Erro ao atualizar preferências',
      );
    }

    return response.json();
  },
};

