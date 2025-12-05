// Usar API route do Next.js como proxy
const API_BASE = '/api';

export interface LogAlteracaoAta {
  id: string;
  ataId: string;
  usuarioId: string;
  tipoAlteracao: string;
  campo?: string;
  valorAnterior?: string;
  valorNovo?: string;
  descricao?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
  ata: {
    id: string;
    numero: string;
    titulo: string;
  };
}

export interface FilterLogsDto {
  ataId?: string;
  usuarioId?: string;
  tipoAlteracao?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

export const logAlteracoesService = {
  async listar(filters?: FilterLogsDto): Promise<LogAlteracaoAta[]> {
    const params = new URLSearchParams();
    if (filters?.ataId) params.append('ataId', filters.ataId);
    if (filters?.usuarioId) params.append('usuarioId', filters.usuarioId);
    if (filters?.tipoAlteracao) params.append('tipoAlteracao', filters.tipoAlteracao);
    if (filters?.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) params.append('dataFim', filters.dataFim);
    if (filters?.busca) params.append('busca', filters.busca);

    const response = await fetch(`${API_BASE}/log-alteracoes?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar logs');
    }

    return response.json();
  },

  async listarPorAta(ataId: string): Promise<LogAlteracaoAta[]> {
    const response = await fetch(`${API_BASE}/log-alteracoes/ata/${ataId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar logs da ata');
    }

    return response.json();
  },

  async buscar(id: string): Promise<LogAlteracaoAta> {
    const response = await fetch(`${API_BASE}/log-alteracoes/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar log');
    }

    return response.json();
  },
};

