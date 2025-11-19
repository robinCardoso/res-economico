import { api } from '@/lib/http';
import type { UploadWithRelations } from '@/types/api';

export interface CreateUploadDto {
  empresaId: string;
  mes: number;
  ano: number;
  templateId?: string;
}

export const uploadsService = {
  async list(): Promise<UploadWithRelations[]> {
    const { data } = await api.get<UploadWithRelations[]>('/uploads');
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
};

