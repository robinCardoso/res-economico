import { api } from '@/lib/http';
import type { AtaReuniao, AtasListResponse, CreateAtaDto, UpdateAtaDto, FilterAtaDto } from '@/types/api';

export const atasService = {
  async list(filters?: FilterAtaDto): Promise<AtasListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.empresaId) params.append('empresaId', filters.empresaId);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) params.append('dataFim', filters.dataFim);
    if (filters?.busca) params.append('busca', filters.busca);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get<AtasListResponse>(`/atas?${params.toString()}`);
    return data;
  },

  async getById(id: string): Promise<AtaReuniao> {
    const { data } = await api.get<AtaReuniao>(`/atas/${id}`);
    return data;
  },

  async create(dto: CreateAtaDto): Promise<AtaReuniao> {
    const { data } = await api.post<AtaReuniao>('/atas', dto);
    return data;
  },

  async update(id: string, dto: UpdateAtaDto): Promise<AtaReuniao> {
    const { data } = await api.put<AtaReuniao>(`/atas/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/atas/${id}`);
  },

  async importar(
    arquivo: File,
    dataReuniao: string,
    tipoReuniao?: string,
  ): Promise<AtaReuniao> {
    // Converter arquivo para base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(arquivo);
      reader.onloadend = () => {
        const base64DataUrl = reader.result as string;
        const base64Content = base64DataUrl.split(',')[1];
        if (!base64Content) {
          reject(new Error('Não foi possível codificar o arquivo'));
          return;
        }
        resolve(base64Content);
      };
      reader.onerror = reject;
    });

    const { data } = await api.post<AtaReuniao>('/atas/importar', {
      nomeArquivo: arquivo.name,
      tipoArquivo: arquivo.type,
      conteudoBase64: base64,
      dataReuniao,
      tipoReuniao,
    });
    return data;
  },

  async atualizarDecisoes(id: string, decisoes: unknown[]): Promise<AtaReuniao> {
    const { data } = await api.put<AtaReuniao>(`/atas/${id}`, {
      decisoes: JSON.stringify(decisoes),
    });
    return data;
  },

  async atualizarAcoes(id: string, acoes: unknown[]): Promise<AtaReuniao> {
    // Por enquanto, vamos armazenar ações no campo observacoes como JSON
    // Isso pode ser melhorado no futuro com um campo dedicado
    const { data } = await api.put<AtaReuniao>(`/atas/${id}`, {
      observacoes: JSON.stringify({ acoes }),
    });
    return data;
  },

  async importarRascunho(
    arquivo: File,
    dataReuniao: string,
    tipoReuniao: string,
    modeloAtaId?: string,
  ): Promise<{
    ata: AtaReuniao;
    textoExtraido: string;
    transcricao: string;
    topicos: Array<{ titulo: string; descricao: string; importancia: string }>;
    metadados: {
      tempoExtracao: number;
      tempoTranscricao: number;
      tempoTopicos: number;
      tempoTotal: number;
      modeloUsado: string;
    };
  }> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('tipoReuniao', tipoReuniao);
    formData.append('dataReuniao', dataReuniao);
    if (modeloAtaId) {
      formData.append('modeloAtaId', modeloAtaId);
    }

    const { data } = await api.post('/atas/importar/rascunho', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async listarModelos(filters?: {
    tipoReuniao?: string;
    ativo?: boolean;
    empresaId?: string;
    search?: string;
  }): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (filters?.tipoReuniao) params.append('tipoReuniao', filters.tipoReuniao);
    if (filters?.ativo !== undefined) params.append('ativo', filters.ativo.toString());
    if (filters?.empresaId) params.append('empresaId', filters.empresaId);
    if (filters?.search) params.append('search', filters.search);

    const { data } = await api.get(`/atas/modelos?${params.toString()}`);
    return data;
  },

  async importarEmProcesso(
    arquivo: File,
    dataReuniao: string,
    tipoReuniao: string,
    dataAssinatura?: string,
    observacoes?: string,
  ): Promise<AtaReuniao> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('tipoReuniao', tipoReuniao);
    formData.append('dataReuniao', dataReuniao);
    if (dataAssinatura) formData.append('dataAssinatura', dataAssinatura);
    if (observacoes) formData.append('observacoes', observacoes);

    const { data } = await api.post('/atas/importar/em-processo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async listarHistorico(ataId: string): Promise<unknown[]> {
    const { data } = await api.get(`/atas/${ataId}/historico`);
    return data;
  },

  async adicionarHistorico(
    ataId: string,
    acao: string,
    descricao?: string,
    responsavel?: string,
    data?: string,
  ): Promise<unknown> {
    const { data: responseData } = await api.post(`/atas/${ataId}/historico`, {
      acao,
      descricao,
      responsavel,
      data,
    });
    return responseData;
  },

  async removerHistorico(ataId: string, historicoId: string): Promise<void> {
    await api.delete(`/atas/${ataId}/historico/${historicoId}`);
  },

  async listarPrazos(ataId: string): Promise<unknown[]> {
    const { data } = await api.get(`/atas/${ataId}/prazos`);
    return data;
  },

  async criarPrazo(
    ataId: string,
    titulo: string,
    dataPrazo: string,
    descricao?: string,
    acaoId?: string,
  ): Promise<unknown> {
    const { data } = await api.post(`/atas/${ataId}/prazos`, {
      titulo,
      dataPrazo,
      descricao,
      acaoId,
    });
    return data;
  },

  async atualizarPrazo(
    prazoId: string,
    updates: {
      titulo?: string;
      dataPrazo?: string;
      descricao?: string;
      status?: string;
      concluido?: boolean;
      dataConclusao?: string;
    },
  ): Promise<unknown> {
    const { data } = await api.put(`/atas/prazos/${prazoId}`, updates);
    return data;
  },

  async removerPrazo(ataId: string, prazoId: string): Promise<void> {
    await api.delete(`/atas/${ataId}/prazos/${prazoId}`);
  },

  async prazosVencidos(): Promise<unknown[]> {
    const { data } = await api.get('/atas/prazos/vencidos');
    return data;
  },

  async prazosProximos(): Promise<unknown[]> {
    const { data } = await api.get('/atas/prazos/proximos');
    return data;
  },

  async listarLembretes(enviados?: boolean): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (enviados !== undefined) params.append('enviados', enviados.toString());
    const { data } = await api.get(`/atas/lembretes?${params.toString()}`);
    return data;
  },

  async marcarLembreteComoLido(lembreteId: string): Promise<void> {
    await api.put(`/atas/lembretes/${lembreteId}/lido`);
  },
};

