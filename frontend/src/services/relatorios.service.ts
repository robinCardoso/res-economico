import { api } from '@/lib/http';
import type { RelatorioResultado, TipoRelatorio } from '@/types/api';

export interface GerarRelatorioParams {
  ano: number;
  empresaId?: string;
  empresaIds?: string[];
  tipo: TipoRelatorio;
}

export const relatoriosService = {
  async getAnosDisponiveis(): Promise<number[]> {
    const { data } = await api.get<number[]>('/relatorios/anos-disponiveis');
    return data;
  },

  async gerarResultado(params: GerarRelatorioParams): Promise<RelatorioResultado> {
    const queryParams = new URLSearchParams();
    queryParams.append('ano', params.ano.toString());
    queryParams.append('tipo', params.tipo);
    
    if (params.empresaId) {
      queryParams.append('empresaId', params.empresaId);
    }
    
    if (params.empresaIds && params.empresaIds.length > 0) {
      params.empresaIds.forEach((id) => {
        queryParams.append('empresaIds', id);
      });
    }

    const { data } = await api.get<RelatorioResultado>(
      `/relatorios/resultado?${queryParams.toString()}`,
    );
    return data;
  },
};

