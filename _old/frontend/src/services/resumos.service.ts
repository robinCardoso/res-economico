import { api } from '@/lib/http';
import type { ResumoEconomico, ResumosListResponse, CreateResumoDto, FilterResumoDto } from '@/types/api';

export const resumosService = {
  async list(filters?: FilterResumoDto): Promise<ResumosListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.empresaId) params.append('empresaId', filters.empresaId);
    if (filters?.ano) params.append('ano', filters.ano.toString());
    if (filters?.mes) params.append('mes', filters.mes.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipoAnalise) params.append('tipoAnalise', filters.tipoAnalise);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get<ResumosListResponse>(`/resumos?${params.toString()}`);
    return data;
  },

  async getById(id: string): Promise<ResumoEconomico> {
    const { data } = await api.get<ResumoEconomico>(`/resumos/${id}`);
    return data;
  },

  async create(dto: CreateResumoDto): Promise<ResumoEconomico> {
    const { data } = await api.post<ResumoEconomico>('/resumos', dto);
    return data;
  },

  async update(id: string, dto: { titulo?: string; status?: string }): Promise<ResumoEconomico> {
    const { data } = await api.put<ResumoEconomico>(`/resumos/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/resumos/${id}`);
  },

  async exportPDF(id: string): Promise<Blob> {
    const response = await api.get(`/resumos/${id}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportExcel(id: string): Promise<Blob> {
    const response = await api.get(`/resumos/${id}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportJSON(id: string): Promise<Record<string, unknown>> {
    const { data } = await api.get<Record<string, unknown>>(`/resumos/${id}/export/json`);
    return data;
  },
};

