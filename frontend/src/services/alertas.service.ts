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
  tipoConta?: string;
}

export interface ContagemPorTipoConta {
  tipoConta: string;
  quantidade: number;
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
    if (filters?.tipoConta) params.append('tipoConta', filters.tipoConta);

    const queryString = params.toString();
    const url = queryString ? `/alertas?${queryString}` : '/alertas';
    
    const { data } = await api.get<AlertaWithRelations[]>(url);
    // Garantir que sempre retorne um array
    return Array.isArray(data) ? data : [];
  },

  async getContagemPorTipoConta(filters?: FilterAlertasParams): Promise<ContagemPorTipoConta[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.severidade) params.append('severidade', filters.severidade);
    if (filters?.empresaId) params.append('empresaId', filters.empresaId);
    if (filters?.uploadId) params.append('uploadId', filters.uploadId);
    if (filters?.busca) params.append('busca', filters.busca);
    // Não incluir tipoConta aqui, pois queremos agrupar por ele

    const queryString = params.toString();
    const url = queryString ? `/alertas/contagem-por-tipo-conta?${queryString}` : '/alertas/contagem-por-tipo-conta';
    
    const { data } = await api.get<ContagemPorTipoConta[]>(url);
    return Array.isArray(data) ? data : [];
  },

  async updateStatus(id: string, status: AlertaStatus): Promise<AlertaWithRelations> {
    const { data } = await api.patch<AlertaWithRelations>(`/alertas/${id}/status`, { status });
    return data;
  },
};

