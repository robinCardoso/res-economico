import { api } from '@/lib/http';
import type { AnaliseResponse, AnalisarDadosParams } from '@/types/api';

export const aiService = {
  async analisarDados(params: AnalisarDadosParams): Promise<AnaliseResponse> {
    const { data } = await api.post<AnaliseResponse>('/ai/analisar', params);
    return data;
  },
};

