import { api } from '@/lib/http';
import type { UploadWithRelations } from '@/types/api';

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
};

