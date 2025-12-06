import { api } from '@/lib/http';

/**
 * Interfaces para Bravo ERP
 */

export interface BravoConfig {
  baseUrl?: string;
  cliente?: string;
  email?: string;
  senha?: string;
  pdv?: string;
  ambiente?: 'p' | 'h';
  server?: string;
  token?: string;
  timeout?: number;
  verificar_duplicatas?: boolean;
  usar_data_ult_modif?: boolean;
}

export interface SyncRequest {
  apenas_ativos?: boolean;
  limit?: number;
  pages?: number;
  resume_sync_id?: string | null;
  verificar_duplicatas?: boolean;
  usar_data_ult_modif?: boolean;
  modo_teste?: boolean;
  teste_duplicatas?: boolean;
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  sync_log_id?: string;
  lock_id?: string;
  data?: {
    filtro_aplicado: string;
    total_produtos_bravo: number;
    produtos_filtrados: number;
    paginas_processadas: number;
    tempo_total_segundos: number;
  };
  error?: string;
  details?: string;
}

export interface SyncStats {
  success: boolean;
  totalProdutos: number;
  produtosAtivos: number;
  produtosDoBravo: number;
  totalSincronizados: number;
  ultimoSync: any;
  ultimaSincronizacao: string;
  ultimaSincronizacaoData: string;
  ultimosSyncs: Array<Record<string, unknown>>;
  debug?: {
    totalProdutosOriginal: number;
    totalProdutosFinal: number;
    produtosAtivos: number;
    ultimoSyncExiste: boolean;
    tempoResposta: number;
    fromCache?: boolean;
  };
}

export interface SyncProgress {
  success: boolean;
  progress?: {
    status: string;
    current_step: string | null;
    current_page: number;
    products_processed: number;
    total_produtos_bravo: number;
    progressPercentage: number;
    estimatedTimeRemaining: string | null;
    details: {
      pagesProcessed: number;
      totalPages: number;
    };
  };
}

export interface SyncStatus {
  success: boolean;
  isRunning: boolean;
  message?: string;
  currentSync?: {
    id: string;
    userEmail: string;
    type: string;
    startedAt: string;
    status: string;
    duration: number;
  };
  stats?: any;
}

export interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  total_produtos_bravo?: number;
  produtos_inseridos?: number;
  produtos_atualizados?: number;
  tempo_total_segundos?: number;
  [key: string]: any;
}

export interface CampoMapeamento {
  id?: number;
  campo_bravo: string;
  campo_interno: string;
  tipo_transformacao: string;
  ativo: boolean;
  ordem: number;
}

export interface CampoInterno {
  nome: string;
  tipo: string;
  obrigatorio: boolean;
  descricao: string;
}

export interface CampoBravo {
  nome: string;
  tipo: string;
  valor_exemplo: any;
  caminho: string;
}

export interface MappingPreviewResponse {
  success: boolean;
  original?: any;
  mapped?: any;
  metadata?: any;
  mapping_details?: Array<{
    campo_bravo: string;
    campo_interno: string;
    valor_original: any;
    valor_mapeado: any;
    transformacao: string;
    sucesso: boolean;
    erro?: string;
  }>;
  unmapped_fields?: Array<{
    campo: string;
    valor: any;
    tipo: string;
  }>;
  error?: string;
}

/**
 * Serviço para interagir com a API do Bravo ERP
 */
export const bravoErpService = {
  /**
   * Busca configuração do Bravo ERP
   */
  async getConfig(): Promise<{ success: boolean; config?: BravoConfig; error?: string }> {
    const { data } = await api.get<{ success: boolean; config?: BravoConfig; error?: string }>('/bravo-erp/config');
    return data;
  },

  /**
   * Salva configuração do Bravo ERP
   */
  async saveConfig(config: Partial<BravoConfig>): Promise<{ success: boolean; message?: string; error?: string }> {
    const { data } = await api.post<{ success: boolean; message?: string; error?: string }>('/bravo-erp/config', config);
    return data;
  },

  /**
   * Testa conexão com Bravo ERP
   */
  async testConnection(): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.post<{ success: boolean; message?: string }>(
      '/bravo-erp/config/test',
    );
    return data;
  },

  /**
   * Inicia sincronização
   */
  async sync(request: SyncRequest): Promise<SyncResponse> {
    const { data } = await api.post<SyncResponse>(
      '/bravo-erp/sync/sincronizar',
      request,
    );
    return data;
  },

  /**
   * Busca estatísticas
   */
  async getStats(force = false): Promise<SyncStats> {
    const params = force ? '?force=1' : '';
    const { data } = await api.get<SyncStats>(`/bravo-erp/stats${params}`);
    return data;
  },

  /**
   * Busca progresso de sincronização
   */
  async getProgress(syncLogId: string): Promise<SyncProgress> {
    const { data } = await api.get<SyncProgress>(
      `/bravo-erp/sync/progress?sync_log_id=${syncLogId}`,
    );
    return data;
  },

  /**
   * Verifica status de sincronização
   */
  async getStatus(): Promise<SyncStatus> {
    const { data } = await api.get<SyncStatus>('/bravo-erp/sync/status');
    return data;
  },

  /**
   * Cancela sincronização
   */
  async cancelSync(lockId?: string, syncLogId?: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const { data } = await api.post<{ success: boolean; message?: string }>(
      '/bravo-erp/sync/cancel',
      { lockId, syncLogId },
    );
    return data;
  },

  /**
   * Lista logs de sincronização
   */
  async getLogs(filters?: {
    limit?: number;
    status?: string;
    type?: string;
    can_resume?: boolean;
  }): Promise<{
    success: boolean;
    data: {
      logs: SyncLog[];
      total: number;
      filters: any;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.can_resume !== undefined)
      params.append('can_resume', String(filters.can_resume));

    const queryString = params.toString();
    const url = `/bravo-erp/sync/logs${queryString ? `?${queryString}` : ''}`;
    const { data } = await api.get(url);
    return data;
  },

  /**
   * Busca detalhes de um log específico
   */
  async getLogDetails(
    logId: string,
    includeDetails = false,
  ): Promise<{
    success: boolean;
    data: SyncLog;
  }> {
    const { data } = await api.post<{ success: boolean; data: SyncLog }>(
      '/bravo-erp/sync/logs/details',
      { log_id: logId, include_details: includeDetails },
    );
    return data;
  },

  /**
   * Lista sincronizações retomáveis
   */
  async getResumableSyncs(limit = 10): Promise<{
    success: boolean;
    data: {
      resumable_syncs: any[];
      total: number;
    };
  }> {
    const { data } = await api.get(
      `/bravo-erp/sync/resume${limit ? `?limit=${limit}` : ''}`,
    );
    return data;
  },

  /**
   * Retoma uma sincronização
   */
  async resumeSync(logId: string): Promise<{
    success: boolean;
    message?: string;
    data?: any;
  }> {
    const { data } = await api.post<{
      success: boolean;
      message?: string;
      data?: any;
    }>('/bravo-erp/sync/resume', { log_id: logId });
    return data;
  },

  /**
   * Busca mapeamentos de campos
   */
  async getMapeamentos(): Promise<{
    success: boolean;
    mapeamentos?: CampoMapeamento[];
    error?: string;
  }> {
    const { data } = await api.get<{
      success: boolean;
      mapeamentos?: CampoMapeamento[];
      error?: string;
    }>('/bravo-erp/mapeamento');
    return data;
  },

  /**
   * Salva mapeamentos de campos
   */
  async saveMapeamentos(mapeamentos: CampoMapeamento[]): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const { data } = await api.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>('/bravo-erp/mapeamento', { mapeamentos });
    return data;
  },

  /**
   * MELHORIA 1: Busca campos da tabela produtos
   */
  async getInternalFields(): Promise<{
    success: boolean;
    fields?: CampoInterno[];
    error?: string;
  }> {
    const { data } = await api.get<{
      success: boolean;
      fields?: CampoInterno[];
      error?: string;
    }>('/bravo-erp/mapping/fields/internal');
    return data;
  },

  /**
   * MELHORIA 2: Busca campos do Bravo ERP (do 1º produto)
   */
  async getBravoFields(): Promise<{
    success: boolean;
    fields?: CampoBravo[];
    product_sample?: any;
    error?: string;
  }> {
    const { data } = await api.get<{
      success: boolean;
      fields?: CampoBravo[];
      product_sample?: any;
      error?: string;
    }>('/bravo-erp/mapping/fields/bravo');
    return data;
  },

  /**
   * MELHORIA 3: Preview do mapeamento
   */
  async previewMapping(mapeamentos: CampoMapeamento[]): Promise<MappingPreviewResponse> {
    const { data } = await api.post<MappingPreviewResponse>('/bravo-erp/mapping/preview', {
      mapeamentos,
    });
    return data;
  },

  /**
   * MELHORIA 1: Busca produto de exemplo para visualização
   */
  async getSampleProduct(): Promise<{
    success: boolean;
    product?: any;
    error?: string;
  }> {
    const { data } = await api.get<{
      success: boolean;
      product?: any;
      error?: string;
    }>('/bravo-erp/mapping/sample-product');
    return data;
  },
};
