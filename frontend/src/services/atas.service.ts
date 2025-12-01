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
};

