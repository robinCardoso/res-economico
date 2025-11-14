import { api } from '@/lib/http';
import type { TemplateImportacaoWithRelations } from '@/types/api';

export interface ColumnMapping {
  classificacao?: string;
  conta?: string;
  subConta?: string;
  nomeConta?: string;
  tipoConta?: string;
  nivel?: string;
  titulo?: string;
  estabelecimento?: string;
  saldoAnterior?: string;
  debito?: string;
  credito?: string;
  saldoAtual?: string;
}

export interface CreateTemplateDto {
  empresaId: string;
  nome: string;
  descricao?: string;
  columnMapping: ColumnMapping;
}

export type UpdateTemplateDto = Partial<CreateTemplateDto>;

export const templatesService = {
  async list(): Promise<TemplateImportacaoWithRelations[]> {
    const { data } = await api.get<TemplateImportacaoWithRelations[]>('/templates');
    // Garantir que sempre retorne um array
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<TemplateImportacaoWithRelations> {
    const { data } = await api.get<TemplateImportacaoWithRelations>(`/templates/${id}`);
    return data;
  },

  async create(dto: CreateTemplateDto): Promise<TemplateImportacaoWithRelations> {
    const { data } = await api.post<TemplateImportacaoWithRelations>('/templates', dto);
    return data;
  },

  async update(id: string, dto: UpdateTemplateDto): Promise<TemplateImportacaoWithRelations> {
    const { data } = await api.put<TemplateImportacaoWithRelations>(`/templates/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/templates/${id}`);
  },
};

