import { api } from '@/lib/http';
import type { LogAuditoria } from '@/types/api';

export interface FilterAuditoriaParams {
  recurso?: string;
  acao?: string;
  usuarioId?: string;
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
}

export const auditoriaService = {
  async list(filters?: FilterAuditoriaParams): Promise<LogAuditoria[]> {
    const params = new URLSearchParams();

    if (filters?.recurso) params.append('recurso', filters.recurso);
    if (filters?.acao) params.append('acao', filters.acao);
    if (filters?.usuarioId) params.append('usuarioId', filters.usuarioId);
    if (filters?.busca) params.append('busca', filters.busca);
    if (filters?.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) params.append('dataFim', filters.dataFim);

    const queryString = params.toString();
    const url = queryString ? `/auditoria?${queryString}` : '/auditoria';

    const { data } = await api.get<LogAuditoria[]>(url);
    return Array.isArray(data) ? data : [];
  },

  async getRecursos(): Promise<string[]> {
    const { data } = await api.get<string[]>('/auditoria/recursos');
    return Array.isArray(data) ? data : [];
  },

  async getAcoes(): Promise<string[]> {
    const { data } = await api.get<string[]>('/auditoria/acoes');
    return Array.isArray(data) ? data : [];
  },
};

