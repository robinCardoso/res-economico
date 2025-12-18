import { api } from '@/lib/http';

export interface Venda {
  id: string;
  nfe: string;
  idDoc?: string;
  dataVenda: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCliente?: string;
  ufDestino?: string;
  ufOrigem?: string;
  idProd?: string;
  referencia?: string;
  prodCodMestre?: string;
  descricaoProduto?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  tipoOperacao?: string;
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

export interface VendaAnalytics {
  id: string;
  ano: number;
  mes: number;
  nomeFantasia: string;
  marca: string;
  grupo?: string;
  subgrupo?: string;
  uf: string;
  totalValor: number;
  totalQuantidade: number;
  updatedAt: string;
  createdAt: string;
}

export interface VendaImportacaoLog {
  id: string;
  nomeArquivo: string;
  mappingName?: string;
  totalLinhas: number;
  sucessoCount: number;
  erroCount: number;
  produtosNaoEncontrados: number;
  duplicatasCount: number; // Registros que já existiam (foram atualizados)
  novosCount: number; // Registros novos (foram criados)
  progresso?: number; // Progresso da importação (0-100)
  linhasProcessadas?: number; // Quantidade de linhas já processadas
  usuarioEmail: string;
  usuarioId?: string;
  createdAt: string;
}

export interface VendaImportProgress {
  progresso: number;
  linhasProcessadas: number;
  totalLinhas: number;
  sucessoCount: number;
  erroCount: number;
  concluido: boolean;
}

export interface VendaColumnMapping {
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

export interface VendaAnalyticsFilter {
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

export interface CreateVendaAnalyticsFilterDto {
  nome: string;
  filters: AnalyticsFilters;
  descricao?: string;
}

export interface CreateVendaColumnMappingDto {
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

export interface CreateVendaDto {
  nfe: string;
  idDoc?: string;
  dataVenda: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCliente?: string;
  ufDestino?: string;
  ufOrigem?: string;
  idProd?: string;
  referencia?: string;
  prodCodMestre?: string;
  descricaoProduto?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  tipoOperacao?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  empresaId?: string;
  produtoId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateVendaDto {
  nfe?: string;
  idDoc?: string;
  dataVenda?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpjCliente?: string;
  ufDestino?: string;
  ufOrigem?: string;
  idProd?: string;
  referencia?: string;
  prodCodMestre?: string;
  descricaoProduto?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  tipoOperacao?: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
  empresaId?: string;
  produtoId?: string;
  metadata?: Record<string, unknown>;
}

export interface FilterVendasDto {
  page?: number;
  limit?: number;
  dataInicio?: string;
  dataFim?: string;
  nfe?: string;
  razaoSocial?: string;
  referencia?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  tipoOperacao?: string;
  empresaId?: string;
}

export interface ColumnMappingDto {
  nfe?: string;
  data?: string;
  idDoc?: string;
  idProd?: string;
  referencia?: string;
  prodCodMestre?: string;
  tipoOperacao?: string;
  qtd?: string;
  valorUnit?: string;
  valorTotal?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  ufDestino?: string;
  ufOrigem?: string;
}

export interface ImportVendasDto {
  mappingName?: string;
  empresaId?: string;
  columnMapping?: ColumnMappingDto;
}

export interface ImportVendasResponse {
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

export interface VendasStats {
  totalVendas: number;
  totalValor: number;
  totalQuantidade: number;
}

export interface VendasListResponse {
  data: Venda[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const vendasService = {
  async list(filters?: FilterVendasDto): Promise<VendasListResponse> {
    const { data } = await api.get<VendasListResponse>('/vendas', {
      params: filters,
    });
    return data;
  },

  async getById(id: string): Promise<Venda> {
    const { data } = await api.get<Venda>(`/vendas/${id}`);
    return data;
  },

  async create(dto: CreateVendaDto): Promise<Venda> {
    const { data } = await api.post<Venda>('/vendas', dto);
    return data;
  },

  async update(id: string, dto: UpdateVendaDto): Promise<Venda> {
    const { data } = await api.put<Venda>(`/vendas/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vendas/${id}`);
  },

  async getStats(filters?: FilterVendasDto): Promise<VendasStats> {
    const { data } = await api.get<VendasStats>('/vendas/stats', {
      params: filters,
    });
    return data;
  },

  async import(file: File, importDto: ImportVendasDto): Promise<ImportVendasResponse> {
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

    const { data } = await api.post<ImportVendasResponse>('/vendas/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600_000, // 10 minutos para importações grandes
    });
    return data;
  },

  async getAnalytics(filters?: {
    ano?: number;
    mes?: number;
    nomeFantasia?: string;
    marca?: string;
    grupo?: string;
    subgrupo?: string;
    uf?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<VendaAnalytics[]> {
    const { data } = await api.get<VendaAnalytics[]>('/vendas/analytics', {
      params: filters,
    });
    return Array.isArray(data) ? data : [];
  },

  async getImportLogs(): Promise<VendaImportacaoLog[]> {
    const { data } = await api.get<VendaImportacaoLog[]>('/vendas/import-logs');
    return Array.isArray(data) ? data : [];
  },

  async getImportLogProgress(logId: string): Promise<VendaImportProgress> {
    const { data } = await api.get<VendaImportProgress>(`/vendas/import-logs/${logId}/progresso`);
    return data;
  },

  async getMappingFields(): Promise<Array<{ value: string; label: string; dataType: string; required: boolean }>> {
    const { data } = await api.get<Array<{ value: string; label: string; dataType: string; required: boolean }>>('/vendas/mapping-fields');
    return Array.isArray(data) ? data : [];
  },

  async getTiposOperacao(): Promise<string[]> {
    const { data } = await api.get<string[]>('/vendas/tipos-operacao');
    return Array.isArray(data) ? data : [];
  },

  async getMarcas(): Promise<string[]> {
    const { data } = await api.get<string[]>('/vendas/marcas');
    return Array.isArray(data) ? data : [];
  },

  async getGrupos(): Promise<string[]> {
    const { data } = await api.get<string[]>('/vendas/grupos');
    return Array.isArray(data) ? data : [];
  },

  async getSubgrupos(): Promise<string[]> {
    const { data } = await api.get<string[]>('/vendas/subgrupos');
    return Array.isArray(data) ? data : [];
  },

  async getNomesFantasia(): Promise<string[]> {
    const { data } = await api.get<string[]>('/vendas/nomes-fantasia');
    return Array.isArray(data) ? data : [];
  },

  async deleteImportLog(logId: string): Promise<void> {
    await api.delete(`/vendas/import-logs/${logId}`);
  },

  // =====================================================
  // MÉTODOS DE MAPEAMENTO DE COLUNAS
  // =====================================================

  async getColumnMappings(): Promise<VendaColumnMapping[]> {
    const { data } = await api.get<VendaColumnMapping[]>('/vendas/column-mappings');
    return Array.isArray(data) ? data : [];
  },

  async getColumnMapping(id: string): Promise<VendaColumnMapping> {
    const { data } = await api.get<VendaColumnMapping>(`/vendas/column-mappings/${id}`);
    return data;
  },

  async createColumnMapping(dto: CreateVendaColumnMappingDto): Promise<VendaColumnMapping> {
    const { data } = await api.post<VendaColumnMapping>('/vendas/column-mappings', dto);
    return data;
  },

  async updateColumnMapping(id: string, dto: Partial<CreateVendaColumnMappingDto>): Promise<VendaColumnMapping> {
    const { data } = await api.put<VendaColumnMapping>(`/vendas/column-mappings/${id}`, dto);
    return data;
  },

  async deleteColumnMapping(id: string): Promise<void> {
    await api.delete(`/vendas/column-mappings/${id}`);
  },

  // =====================================================
  // MÉTODOS DE FILTROS DE ANALYTICS
  // =====================================================

  async getAnalyticsFilters(): Promise<VendaAnalyticsFilter[]> {
    const { data } = await api.get<VendaAnalyticsFilter[]>('/vendas/analytics-filters');
    return Array.isArray(data) ? data : [];
  },

  async getAnalyticsFilter(id: string): Promise<VendaAnalyticsFilter> {
    const { data } = await api.get<VendaAnalyticsFilter>(`/vendas/analytics-filters/${id}`);
    return data;
  },

  async createAnalyticsFilter(dto: CreateVendaAnalyticsFilterDto): Promise<VendaAnalyticsFilter> {
    const { data } = await api.post<VendaAnalyticsFilter>('/vendas/analytics-filters', dto);
    return data;
  },

  async updateAnalyticsFilter(id: string, dto: Partial<CreateVendaAnalyticsFilterDto>): Promise<VendaAnalyticsFilter> {
    const { data } = await api.put<VendaAnalyticsFilter>(`/vendas/analytics-filters/${id}`, dto);
    return data;
  },

  async deleteAnalyticsFilter(id: string): Promise<void> {
    await api.delete(`/vendas/analytics-filters/${id}`);
  },
};

// Métodos para Analytics - valores únicos de VendaAnalytics
export const analyticsValuesService = {
  async getUfs(): Promise<string[]> {
    const { data } = await api.get<string[]>('/vendas/analytics/ufs');
    return Array.isArray(data) ? data : [];
  },

  async getAnos(): Promise<number[]> {
    const { data } = await api.get<number[]>('/vendas/analytics/anos');
    return Array.isArray(data) ? data : [];
  },

  async getMeses(): Promise<number[]> {
    const { data } = await api.get<number[]>('/vendas/analytics/meses');
    return Array.isArray(data) ? data : [];
  },
};

// Interfaces para Analytics
export interface AnalyticsFilters {
  tipoOperacao?: string[];
  filial?: string[];
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
      [ano: number]: { venda: number; evolucao?: number | null };
    };
  }>;
  totalGeral: {
    [ano: number]: { venda: number; evolucao?: number | null };
  };
  anosDisponiveis: number[];
}

export interface CrescimentoFilialResponse {
  filiais: Array<{
    uf: string;
    dados: {
      [ano: number]: { vendas: number; evolucao?: number | null };
    };
  }>;
  totalGeral: {
    [ano: number]: { vendas: number; evolucao?: number | null };
  };
  anosDisponiveis: number[];
}

export interface CrescimentoMarcaResponse {
  marcas: Array<{
    marca: string;
    dados: {
      [ano: number]: { venda: number; evolucao?: number | null };
    };
  }>;
  totalGeral: {
    [ano: number]: { venda: number; evolucao?: number | null };
  };
  anosDisponiveis: number[];
}

export interface CrescimentoAssociadoResponse {
  associados: Array<{
    nomeFantasia: string;
    dados: {
      [ano: number]: { venda: number; evolucao?: number | null };
    };
  }>;
  totalGeral: {
    [ano: number]: { venda: number; evolucao?: number | null };
  };
  anosDisponiveis: number[];
  total: number;
  page: number;
  limit: number;
}

export interface FilialAssociadoResponse {
  ufs: UFData[];
  totalGeral: {
    [mes: number]: number; // 1-12
    total: number;
  };
  mesesDisponiveis: number[]; // [1, 2, 3, ..., 12]
}

export interface UFData {
  uf: string;
  totalGeral: number;
  monthlyTotals: {
    [mes: number]: number; // 1-12
  };
  associados: AssociadoData[];
}

export interface AssociadoData {
  nomeFantasia: string;
  totalGeral: number;
  monthlySales: {
    [mes: number]: number; // 1-12
  };
}

// Métodos para Analytics
export const analyticsService = {
  async getCrescimentoEmpresa(filtros?: AnalyticsFilters): Promise<CrescimentoEmpresaResponse> {
    const params = new URLSearchParams();
    
    // Para arrays, enviar como valores separados por vírgula (ParseArrayPipe espera isso)
    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }
    if (filtros?.filial?.length) {
      params.append('filial', filtros.filial.join(','));
    }
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
      `/vendas/analytics/crescimento-empresa?${params.toString()}`
    );
    return data;
  },

  async getCrescimentoFilial(filtros?: AnalyticsFilters): Promise<CrescimentoFilialResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }
    if (filtros?.filial?.length) {
      params.append('filial', filtros.filial.join(','));
    }
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

    const { data } = await api.get<CrescimentoFilialResponse>(
      `/vendas/analytics/crescimento-filial?${params.toString()}`
    );
    return data;
  },

  async getCrescimentoMarca(filtros?: AnalyticsFilters): Promise<CrescimentoMarcaResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }
    if (filtros?.filial?.length) {
      params.append('filial', filtros.filial.join(','));
    }
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

    const { data } = await api.get<CrescimentoMarcaResponse>(
      `/vendas/analytics/crescimento-marca?${params.toString()}`
    );
    return data;
  },

  async getCrescimentoAssociado(
    filtros?: AnalyticsFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<CrescimentoAssociadoResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }
    if (filtros?.filial?.length) {
      params.append('filial', filtros.filial.join(','));
    }
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

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const { data } = await api.get<CrescimentoAssociadoResponse>(
      `/vendas/analytics/crescimento-associado?${params.toString()}`
    );
    return data;
  },

  async getFilialAssociadoAnalytics(
    filtros?: AnalyticsFilters,
  ): Promise<FilialAssociadoResponse> {
    const params = new URLSearchParams();

    // Ano é único (não array) para este relatório
    if (filtros?.ano && filtros.ano.length > 0) {
      params.append('ano', filtros.ano[0].toString());
    }

    if (filtros?.marca?.length) {
      params.append('marca', filtros.marca.join(','));
    }

    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }

    // Filtros opcionais específicos
    if (filtros?.filial?.length) {
      params.append('ufDestino', filtros.filial.join(','));
    }

    if (filtros?.nomeFantasia?.length) {
      params.append('nomeFantasia', filtros.nomeFantasia.join(','));
    }

    const { data } = await api.get<FilialAssociadoResponse>(
      `/vendas/analytics/filial-associado?${params.toString()}`
    );
    return data;
  },

  async recalcularAnalytics(dataInicio?: string, dataFim?: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/vendas/analytics/recalcular', {
      dataInicio,
      dataFim,
    });
    return data;
  },

  async getRecalculoStatus(): Promise<{
    emAndamento: boolean;
    progresso: number;
    totalVendas: number;
    vendasProcessadas: number;
    inicio?: string;
    fim?: string;
    erro?: string;
    etapa?: string;
    registrosDeletados?: number;
  }> {
    const { data } = await api.get<{
      emAndamento: boolean;
      progresso: number;
      totalVendas: number;
      vendasProcessadas: number;
      inicio?: string;
      fim?: string;
      erro?: string;
      etapa?: string;
      registrosDeletados?: number;
    }>('/vendas/analytics/recalcular/status');
    return data;
  },
};

// Métodos para Analytics V2 - Buscam diretamente da tabela Venda
export const analyticsV2Service = {
  async getCrescimentoEmpresa(filtros?: AnalyticsFilters): Promise<CrescimentoEmpresaResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }
    if (filtros?.filial?.length) {
      params.append('filial', filtros.filial.join(','));
    }
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
      `/vendas/analytics/v2/crescimento-empresa?${params.toString()}`
    );
    return data;
  },

  async getCrescimentoFilial(filtros?: AnalyticsFilters): Promise<CrescimentoFilialResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }
    if (filtros?.filial?.length) {
      params.append('filial', filtros.filial.join(','));
    }
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

    const { data } = await api.get<CrescimentoFilialResponse>(
      `/vendas/analytics/v2/crescimento-filial?${params.toString()}`
    );
    return data;
  },

  async getCrescimentoMarca(filtros?: AnalyticsFilters): Promise<CrescimentoMarcaResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }
    if (filtros?.filial?.length) {
      params.append('filial', filtros.filial.join(','));
    }
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

    const { data } = await api.get<CrescimentoMarcaResponse>(
      `/vendas/analytics/v2/crescimento-marca?${params.toString()}`
    );
    return data;
  },

  async getCrescimentoAssociado(
    filtros?: AnalyticsFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<CrescimentoAssociadoResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }
    if (filtros?.filial?.length) {
      params.append('filial', filtros.filial.join(','));
    }
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

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const { data } = await api.get<CrescimentoAssociadoResponse>(
      `/vendas/analytics/v2/crescimento-associado?${params.toString()}`
    );
    return data;
  },

  async getFilialAssociadoAnalytics(
    filtros?: AnalyticsFilters,
  ): Promise<FilialAssociadoResponse> {
    const params = new URLSearchParams();

    if (filtros?.ano && filtros.ano.length > 0) {
      params.append('ano', filtros.ano[0].toString());
    }

    if (filtros?.marca?.length) {
      params.append('marca', filtros.marca.join(','));
    }

    if (filtros?.tipoOperacao?.length) {
      params.append('tipoOperacao', filtros.tipoOperacao.join(','));
    }

    if (filtros?.filial?.length) {
      params.append('ufDestino', filtros.filial.join(','));
    }

    if (filtros?.nomeFantasia?.length) {
      params.append('nomeFantasia', filtros.nomeFantasia.join(','));
    }

    const { data } = await api.get<FilialAssociadoResponse>(
      `/vendas/analytics/v2/filial-associado?${params.toString()}`
    );
    return data;
  },
};