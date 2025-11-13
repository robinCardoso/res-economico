import { api } from '@/lib/http';
import type { TemplateImportacaoWithRelations } from '@/types/api';

export const templatesService = {
  async list(): Promise<TemplateImportacaoWithRelations[]> {
    const { data } = await api.get<TemplateImportacaoWithRelations[]>('/templates');
    // Garantir que sempre retorne um array
    return Array.isArray(data) ? data : [];
  },
};

