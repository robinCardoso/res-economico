import { api } from '@/lib/http';
import type { UploadWithRelations } from '@/types/api';

export interface CreateUploadDto {
  empresaId: string;
  mes: number;
  ano: number;
  templateId?: string;
}

export const uploadsService = {
  async list(filters?: { empresaId?: string; ano?: number; mes?: number }): Promise<UploadWithRelations[]> {
    const params = new URLSearchParams();
    if (filters?.empresaId) {
      params.append('empresaId', filters.empresaId);
    }
    if (filters?.ano) {
      params.append('ano', filters.ano.toString());
    }
    if (filters?.mes) {
      params.append('mes', filters.mes.toString());
    }

    const url = params.toString() ? `/uploads?${params.toString()}` : '/uploads';
    const { data } = await api.get<UploadWithRelations[]>(url);
    // Garantir que sempre retorne um array
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<UploadWithRelations> {
    const { data } = await api.get<UploadWithRelations>(`/uploads/${id}`);
    return data;
  },

  async create(file: File, dto: CreateUploadDto): Promise<UploadWithRelations> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('empresaId', dto.empresaId);
    formData.append('mes', dto.mes.toString());
    formData.append('ano', dto.ano.toString());
    if (dto.templateId) {
      formData.append('templateId', dto.templateId);
    }

    const { data } = await api.post<UploadWithRelations>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/uploads/${id}`);
  },

  async getProgress(id: string): Promise<{ progress: number; estado: string; etapa: string }> {
    const { data } = await api.get<{ progress: number; estado: string; etapa: string }>(
      `/uploads/${id}/progresso`,
    );
    return data;
  },

  async reprocessar(id: string): Promise<UploadWithRelations> {
    const { data } = await api.patch<UploadWithRelations>(`/uploads/${id}/reprocessar`);
    return data;
  },

  async verificarDuplicataPeriodo(empresaId: string, mes: number, ano: number): Promise<{ existe: boolean; upload?: UploadWithRelations }> {
    const { data } = await api.get<{ existe: boolean; upload?: UploadWithRelations }>(
      `/uploads/verificar-duplicata-periodo?empresaId=${encodeURIComponent(empresaId)}&mes=${mes}&ano=${ano}`
    );
    return data;
  },

  async verificarDuplicataNome(nomeArquivo: string): Promise<{ existe: boolean; upload?: UploadWithRelations }> {
    const { data } = await api.get<{ existe: boolean; upload?: UploadWithRelations }>(
      `/uploads/verificar-duplicata-nome?nomeArquivo=${encodeURIComponent(nomeArquivo)}`
    );
    return data;
  },

  async getProximoMes(empresaId: string, ano?: number): Promise<number> {
    const anoAtual = ano || new Date().getFullYear();
    const params = new URLSearchParams();
    params.append('empresaId', empresaId);
    params.append('ano', anoAtual.toString());
    
    const { data } = await api.get<{ mes: number }>(
      `/uploads/proximo-mes?${params.toString()}`
    );
    return data.mes;
  },

  async getConta745(ano?: number, mes?: number, empresaId?: string) {
    const params = new URLSearchParams();
    if (ano) params.append('ano', ano.toString());
    if (mes) params.append('mes', mes.toString());
    if (empresaId) params.append('empresaId', empresaId);
    
    const url = params.toString() ? `/uploads/dashboard/conta-745?${params.toString()}` : '/uploads/dashboard/conta-745';
    const { data } = await api.get<{
      consolidado: Array<{ periodo: string; valor: number }>;
      porEmpresa: Array<{
        empresaId: string;
        empresaNome: string;
        periodo: string;
        valor: number;
      }>;
    }>(url);
    return data;
  },
};

