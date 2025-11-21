import { api } from '@/lib/http';
import type { ConfiguracaoModeloNegocio, ModeloNegocio } from '@/types/api';

export interface CreateConfiguracaoModeloNegocioDto {
  modeloNegocio: ModeloNegocio;
  modeloNegocioDetalhes: Record<string, unknown>;
  contasReceita: Record<string, string>;
  contasCustos: Record<string, string>;
  custosCentralizados: boolean;
  descricao?: string;
  ativo?: boolean;
}

export interface UpdateConfiguracaoModeloNegocioDto {
  modeloNegocio?: ModeloNegocio;
  modeloNegocioDetalhes?: Record<string, unknown>;
  contasReceita?: Record<string, string>;
  contasCustos?: Record<string, string>;
  custosCentralizados?: boolean;
  descricao?: string;
  ativo?: boolean;
}

export const configuracaoModeloNegocioService = {
  async list(): Promise<ConfiguracaoModeloNegocio[]> {
    const { data } = await api.get<ConfiguracaoModeloNegocio[]>('/configuracao-modelo-negocio');
    return Array.isArray(data) ? data : [];
  },

  async getByModelo(modeloNegocio: string): Promise<ConfiguracaoModeloNegocio> {
    const { data } = await api.get<ConfiguracaoModeloNegocio>(
      `/configuracao-modelo-negocio/${modeloNegocio}`,
    );
    return data;
  },

  async create(dto: CreateConfiguracaoModeloNegocioDto): Promise<ConfiguracaoModeloNegocio> {
    const { data } = await api.post<ConfiguracaoModeloNegocio>('/configuracao-modelo-negocio', dto);
    return data;
  },

  async update(
    modeloNegocio: string,
    dto: UpdateConfiguracaoModeloNegocioDto,
  ): Promise<ConfiguracaoModeloNegocio> {
    const { data } = await api.patch<ConfiguracaoModeloNegocio>(
      `/configuracao-modelo-negocio/${modeloNegocio}`,
      dto,
    );
    return data;
  },

  async delete(modeloNegocio: string): Promise<void> {
    await api.delete(`/configuracao-modelo-negocio/${modeloNegocio}`);
  },
};

