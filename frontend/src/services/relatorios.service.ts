import { api } from '@/lib/http';
import type { RelatorioResultado, RelatorioComparativo, TipoRelatorio, TipoComparacao, TipoValor } from '@/types/api';

export interface GerarRelatorioParams {
  ano: number;
  empresaId?: string;
  empresaIds?: string[];
  tipo: TipoRelatorio;
  descricao?: string;
}

export interface GerarRelatorioComparativoParams {
  tipoComparacao: TipoComparacao;
  mes1: number;
  ano1: number;
  mes2: number;
  ano2: number;
  tipo: TipoRelatorio;
  empresaId?: string;
  empresaIds?: string[];
  descricao?: string;
  tipoValor?: TipoValor;
}

export const relatoriosService = {
  async getAnosDisponiveis(): Promise<number[]> {
    const { data } = await api.get<number[]>('/relatorios/anos-disponiveis');
    return data;
  },

  async getMesesDisponiveis(ano: number, empresaId?: string): Promise<number[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('ano', ano.toString());
    if (empresaId) {
      queryParams.append('empresaId', empresaId);
    }
    const { data } = await api.get<number[]>(`/relatorios/meses-disponiveis?${queryParams.toString()}`);
    return data;
  },

  async getDescricoesDisponiveis(busca?: string): Promise<string[]> {
    const queryParams = new URLSearchParams();
    if (busca && busca.trim().length > 0) {
      queryParams.append('busca', busca.trim());
    }
    const { data } = await api.get<string[]>(
      `/relatorios/descricoes-disponiveis?${queryParams.toString()}`,
    );
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

    if (params.descricao && params.descricao.trim().length > 0) {
      queryParams.append('descricao', params.descricao.trim());
    }

    const { data } = await api.get<RelatorioResultado>(
      `/relatorios/resultado?${queryParams.toString()}`,
    );
    return data;
  },

  async gerarComparativo(params: GerarRelatorioComparativoParams): Promise<RelatorioComparativo> {
    const queryParams = new URLSearchParams();
    queryParams.append('tipoComparacao', params.tipoComparacao);
    queryParams.append('mes1', params.mes1.toString());
    queryParams.append('ano1', params.ano1.toString());
    queryParams.append('mes2', params.mes2.toString());
    queryParams.append('ano2', params.ano2.toString());
    queryParams.append('tipo', params.tipo);
    
    if (params.empresaId) {
      queryParams.append('empresaId', params.empresaId);
    }
    
    if (params.empresaIds && params.empresaIds.length > 0) {
      params.empresaIds.forEach((id) => {
        queryParams.append('empresaIds', id);
      });
    }

    if (params.descricao && params.descricao.trim().length > 0) {
      queryParams.append('descricao', params.descricao.trim());
    }

    if (params.tipoValor) {
      queryParams.append('tipoValor', params.tipoValor);
    }

    const { data } = await api.get<RelatorioComparativo>(
      `/relatorios/comparativo?${queryParams.toString()}`,
    );
    return data;
  },
};

