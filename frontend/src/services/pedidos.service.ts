import { api } from '@/lib/http';

export interface Pedido {
  id: string;
  numeroPedido: string;
  idDoc?: string;
  dataPedido: string;
  nomeFantasia?: string;
  idProd?: string;
  referencia?: string;
  descricaoProduto?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  empresaId?: string;
  produtoId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  empresa?: {
    id: string;
    razaoSocial: string;
    nomeFantasia?: string;
  };
  produto?: {
    id: string;
    referencia: string;
    descricao?: string;
    marca?: string;
    grupo?: string;
    subgrupo?: string;
  };
}

export interface PedidoAnalytics {
  id: string;
  ano: number;
  mes: number;
  nomeFantasia: string;
  marca: string;
  grupo?: string;
  subgrupo?: string;
  totalValor: number;
  totalQuantidade: number;
  updatedAt: string;
  createdAt: string;
}

export interface PedidoImportacaoLog {
  id: string;
  nomeArquivo: string;
  mappingName?: string;
  totalLinhas: number;
  sucessoCount: number;
  erroCount: number;
  produtosNaoEncontrados: number;
  duplicatasCount: number;
  novosCount: number;
  progresso?: number;
  linhasProcessadas?: number;
  usuarioEmail: string;
  usuarioId?: string;
  createdAt: string;
}

export interface PedidoImportProgress {
  progresso: number;
  linhasProcessadas: number;
  totalLinhas: number;
  sucessoCount: number;
  erroCount: number;
  concluido: boolean;
}

export interface PedidoColumnMapping {
  id: string;
  nome: string;
  columnMapping: Record<string, string>;
  filters?: Array<{
    id: string;
    column: string;
    condition: string;
    value?: string;
  }>;
  descricao?: string;
  usuarioId?: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PedidoAnalyticsFilter {
  id: string;
  nome: string;
  filters: AnalyticsFilters;
  descricao?: string;
  usuarioId?: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePedidoAnalyticsFilterDto {
  nome: string;
  filters: AnalyticsFilters;
  descricao?: string;
}

export interface CreatePedidoColumnMappingDto {
  nome: string;
  columnMapping: Record<string, string>;
  filters?: Array<{
    id: string;
    column: string;
    condition: string;
    value?: string;
  }>;
  descricao?: string;
}

export interface FilterPedidosDto {
  page?: number;
  limit?: number;
  dataInicio?: string;
  dataFim?: string;
  numeroPedido?: string;
  nomeFantasia?: string;
  referencia?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  empresaId?: string;
}

export interface ImportPedidosDto {
  mappingName?: string;
  empresaId?: string;
  columnMapping?: Record<string, string>;
}

export interface ImportPedidosResponse {
  success: boolean;
  message: string;
  logId: string;
  estatisticas: {
    totalLinhas: number;
    sucessoCount: number;
    erroCount: number;
    produtosNaoEncontrados: number;
    duplicatas: number;
    novos: number;
    tempoTotal: string;
  };
}

export interface PedidosStats {
  totalPedidos: number;
  totalValor: number;
  totalQuantidade: number;
}

export interface PedidosListResponse {
  data: Pedido[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const pedidosService = {
  async list(filters?: FilterPedidosDto): Promise<PedidosListResponse> {
    const { data } = await api.get<PedidosListResponse>('/pedidos', {
      params: filters,
    });
    return data;
  },

  async getById(id: string): Promise<Pedido> {
    const { data } = await api.get<Pedido>(`/pedidos/${id}`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/pedidos/${id}`);
  },

  async getStats(filters?: FilterPedidosDto): Promise<PedidosStats> {
    const { data } = await api.get<PedidosStats>('/pedidos/stats', {
      params: filters,
    });
    return data;
  },

  async import(file: File, importDto: ImportPedidosDto): Promise<ImportPedidosResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (importDto.mappingName) {
      formData.append('mappingName', importDto.mappingName);
    }
    if (importDto.empresaId) {
      formData.append('empresaId', importDto.empresaId);
    }
    if (importDto.columnMapping) {
      formData.append('columnMapping', JSON.stringify(importDto.columnMapping));
    }

    const { data } = await api.post<ImportPedidosResponse>('/pedidos/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600_000, // 10 minutos para importações grandes
    });
    return data;
  },

  async getAnalytics(filters?: AnalyticsFilters): Promise<PedidoAnalytics[]> {
    // Converter arrays de filtros para query params separados por vírgula
    const params = new URLSearchParams();
    
    if (filters?.ano?.length) {
      params.append('ano', filters.ano.join(','));
    }
    if (filters?.mes?.length) {
      params.append('mes', filters.mes.join(','));
    }
    if (filters?.marca?.length) {
      params.append('marca', filters.marca.join(','));
    }
    if (filters?.nomeFantasia?.length) {
      params.append('nomeFantasia', filters.nomeFantasia.join(','));
    }
    if (filters?.grupo?.length) {
      params.append('grupo', filters.grupo.join(','));
    }
    if (filters?.subgrupo?.length) {
      params.append('subgrupo', filters.subgrupo.join(','));
    }
    if (filters?.empresaId?.length) {
      params.append('empresaId', filters.empresaId.join(','));
    }

    const queryString = params.toString();
    const url = queryString ? `/pedidos/analytics?${queryString}` : '/pedidos/analytics';
    
    const { data } = await api.get<PedidoAnalytics[]>(url);
    return Array.isArray(data) ? data : [];
  },

  async getImportLogs(): Promise<PedidoImportacaoLog[]> {
    const { data } = await api.get<PedidoImportacaoLog[]>('/pedidos/import-logs');
    return Array.isArray(data) ? data : [];
  },

  async getImportLogProgress(logId: string): Promise<PedidoImportProgress> {
    const { data } = await api.get<PedidoImportProgress>(`/pedidos/import-logs/${logId}/progresso`);
    return data;
  },

  async getMappingFields(): Promise<Array<{ value: string; label: string; dataType: string; required: boolean }>> {
    const { data } = await api.get<Array<{ value: string; label: string; dataType: string; required: boolean }>>('/pedidos/mapping-fields');
    return Array.isArray(data) ? data : [];
  },

  async getMarcas(): Promise<string[]> {
    const { data } = await api.get<string[]>('/pedidos/marcas');
    return Array.isArray(data) ? data : [];
  },

  async getGrupos(): Promise<string[]> {
    const { data } = await api.get<string[]>('/pedidos/grupos');
    return Array.isArray(data) ? data : [];
  },

  async getSubgrupos(): Promise<string[]> {
    const { data } = await api.get<string[]>('/pedidos/subgrupos');
    return Array.isArray(data) ? data : [];
  },

  async getNomesFantasia(): Promise<string[]> {
    const { data } = await api.get<string[]>('/pedidos/nomes-fantasia');
    return Array.isArray(data) ? data : [];
  },

  async deleteImportLog(logId: string): Promise<void> {
    await api.delete(`/pedidos/import-logs/${logId}`);
  },

  // =====================================================
  // MÉTODOS DE MAPEAMENTO DE COLUNAS
  // =====================================================

  async getColumnMappings(): Promise<PedidoColumnMapping[]> {
    const { data } = await api.get<PedidoColumnMapping[]>('/pedidos/column-mappings');
    return Array.isArray(data) ? data : [];
  },

  async getColumnMapping(id: string): Promise<PedidoColumnMapping> {
    const { data } = await api.get<PedidoColumnMapping>(`/pedidos/column-mappings/${id}`);
    return data;
  },

  async createColumnMapping(dto: CreatePedidoColumnMappingDto): Promise<PedidoColumnMapping> {
    const { data } = await api.post<PedidoColumnMapping>('/pedidos/column-mappings', dto);
    return data;
  },

  async updateColumnMapping(id: string, dto: Partial<CreatePedidoColumnMappingDto>): Promise<PedidoColumnMapping> {
    const { data } = await api.put<PedidoColumnMapping>(`/pedidos/column-mappings/${id}`, dto);
    return data;
  },

  async deleteColumnMapping(id: string): Promise<void> {
    await api.delete(`/pedidos/column-mappings/${id}`);
  },

  // =====================================================
  // MÉTODOS DE FILTROS DE ANALYTICS
  // =====================================================

  async getAnalyticsFilters(): Promise<PedidoAnalyticsFilter[]> {
    const { data } = await api.get<PedidoAnalyticsFilter[]>('/pedidos/analytics-filters');
    return Array.isArray(data) ? data : [];
  },

  async getAnalyticsFilter(id: string): Promise<PedidoAnalyticsFilter> {
    const { data } = await api.get<PedidoAnalyticsFilter>(`/pedidos/analytics-filters/${id}`);
    return data;
  },

  async createAnalyticsFilter(dto: CreatePedidoAnalyticsFilterDto): Promise<PedidoAnalyticsFilter> {
    const { data } = await api.post<PedidoAnalyticsFilter>('/pedidos/analytics-filters', dto);
    return data;
  },

  async updateAnalyticsFilter(id: string, dto: Partial<CreatePedidoAnalyticsFilterDto>): Promise<PedidoAnalyticsFilter> {
    const { data } = await api.put<PedidoAnalyticsFilter>(`/pedidos/analytics-filters/${id}`, dto);
    return data;
  },

  async deleteAnalyticsFilter(id: string): Promise<void> {
    await api.delete(`/pedidos/analytics-filters/${id}`);
  },
};

// Métodos para Analytics - valores únicos de PedidoAnalytics
export const analyticsValuesService = {
  async getAnos(): Promise<number[]> {
    const { data } = await api.get<number[]>('/pedidos/analytics/anos');
    return Array.isArray(data) ? data : [];
  },

  async getMeses(): Promise<number[]> {
    const { data } = await api.get<number[]>('/pedidos/analytics/meses');
    return Array.isArray(data) ? data : [];
  },
};

// Interfaces para Analytics
export interface AnalyticsFilters {
  ano?: number[];
  mes?: number[];
  marca?: string[];
  nomeFantasia?: string[];
  grupo?: string[];
  subgrupo?: string[];
  empresaId?: string[];
}

export interface CrescimentoEmpresaResponse {
  meses: Array<{
    mes: number;
    nomeMes: string;
    dados: {
      [ano: number]: { pedido: number; evolucao?: number | null };
    };
  }>;
  totalGeral: {
    [ano: number]: { pedido: number; evolucao?: number | null };
  };
  anosDisponiveis: number[];
}

// Métodos para Analytics
export const analyticsService = {
  async getCrescimentoEmpresa(filtros?: AnalyticsFilters): Promise<CrescimentoEmpresaResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.ano?.length) {
      params.append('ano', filtros.ano.join(','));
    }
    if (filtros?.mes?.length) {
      params.append('mes', filtros.mes.join(','));
    }
    if (filtros?.marca?.length) {
      params.append('marca', filtros.marca.join(','));
    }
    if (filtros?.nomeFantasia?.length) {
      params.append('nomeFantasia', filtros.nomeFantasia.join(','));
    }
    if (filtros?.grupo?.length) {
      params.append('grupo', filtros.grupo.join(','));
    }
    if (filtros?.subgrupo?.length) {
      params.append('subgrupo', filtros.subgrupo.join(','));
    }
    if (filtros?.empresaId?.length) {
      params.append('empresaId', filtros.empresaId.join(','));
    }

    const { data } = await api.get<CrescimentoEmpresaResponse>(
      `/pedidos/analytics/crescimento-empresa?${params.toString()}`
    );
    return data;
  },

  async recalcularAnalytics(dataInicio?: string, dataFim?: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/pedidos/analytics/recalcular', {
      dataInicio,
      dataFim,
    });
    return data;
  },

  async getRecalculoStatus(): Promise<{
    emAndamento: boolean;
    progresso: number;
    totalPedidos: number;
    pedidosProcessados: number;
    inicio?: string;
    fim?: string;
    erro?: string;
    etapa?: string;
    registrosDeletados?: number;
  }> {
    const { data } = await api.get<{
      emAndamento: boolean;
      progresso: number;
      totalPedidos: number;
      pedidosProcessados: number;
      inicio?: string;
      fim?: string;
      erro?: string;
      etapa?: string;
      registrosDeletados?: number;
    }>('/pedidos/analytics/recalcular/status');
    return data;
  },
};

