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
  usuarioEmail: string;
  usuarioId?: string;
  createdAt: string;
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
  empresaId?: string;
}

export interface ImportVendasDto {
  mappingName?: string;
  empresaId?: string;
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

    const { data } = await api.post<ImportVendasResponse>('/vendas/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
};
