import { api } from '@/lib/http';
import type { ContaCatalogoWithRelations, ContaStatus } from '@/types/api';

export interface FilterContasParams {
  status?: ContaStatus;
  tipoConta?: string;
  nivel?: number;
  busca?: string;
  classificacaoPrefix?: string;
  conta?: string;
  subConta?: string;
}

export const contasService = {
  async list(filters?: FilterContasParams): Promise<ContaCatalogoWithRelations[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipoConta) params.append('tipoConta', filters.tipoConta);
    if (filters?.nivel) params.append('nivel', filters.nivel.toString());
    if (filters?.busca) params.append('busca', filters.busca);
    if (filters?.classificacaoPrefix) params.append('classificacaoPrefix', filters.classificacaoPrefix);
    if (filters?.conta) params.append('conta', filters.conta);
    if (filters?.subConta !== undefined) params.append('subConta', filters.subConta);

    const queryString = params.toString();
    const url = queryString ? `/contas?${queryString}` : '/contas';
    
    const { data } = await api.get<ContaCatalogoWithRelations[]>(url);
    // Garantir que sempre retorne um array
    return Array.isArray(data) ? data : [];
  },
};

