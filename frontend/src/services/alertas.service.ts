import { api } from '@/lib/http';
import type { AlertaWithRelations, AlertaStatus } from '@/types/api';

export interface FilterAlertasParams {
  status?: AlertaStatus;
  tipo?: string;
  severidade?: string;
  empresaId?: string;
  uploadId?: string;
  alertaId?: string;
  busca?: string;
}

export const alertasService = {
  async list(filters?: FilterAlertasParams): Promise<AlertaWithRelations[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.severidade) params.append('severidade', filters.severidade);
    if (filters?.empresaId) params.append('empresaId', filters.empresaId);
    if (filters?.uploadId) params.append('uploadId', filters.uploadId);
    if (filters?.alertaId) params.append('alertaId', filters.alertaId);
    if (filters?.busca) params.append('busca', filters.busca);

    const queryString = params.toString();
    const url = queryString ? `/alertas?${queryString}` : '/alertas';
    
    const { data } = await api.get<AlertaWithRelations[]>(url);
    // Garantir que sempre retorne um array
    return Array.isArray(data) ? data : [];
  },

  async updateStatus(id: string, status: AlertaStatus): Promise<AlertaWithRelations> {
    const { data } = await api.patch<AlertaWithRelations>(`/alertas/${id}/status`, { status });
    return data;
  },
};

