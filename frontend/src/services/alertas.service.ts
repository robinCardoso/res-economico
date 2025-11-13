import { api } from '@/lib/http';
import type { AlertaWithRelations } from '@/types/api';

export const alertasService = {
  async list(): Promise<AlertaWithRelations[]> {
    const { data } = await api.get<AlertaWithRelations[]>('/alertas');
    // Garantir que sempre retorne um array
    return Array.isArray(data) ? data : [];
  },
};

