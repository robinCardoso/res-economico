import { api } from '@/lib/http';
import type { ContaCatalogoWithRelations } from '@/types/api';

export const contasService = {
  async list(): Promise<ContaCatalogoWithRelations[]> {
    const { data } = await api.get<ContaCatalogoWithRelations[]>('/contas');
    // Garantir que sempre retorne um array
    return Array.isArray(data) ? data : [];
  },
};

