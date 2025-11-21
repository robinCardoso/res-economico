import { api } from '@/lib/http';
import type { Empresa, PorteEmpresa, ModeloNegocio } from '@/types/api';

export interface CreateEmpresaDto {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  tipo?: 'MATRIZ' | 'FILIAL';
  uf?: string;
  // NOVOS CAMPOS PARA CONTEXTO IA
  setor?: string;
  porte?: PorteEmpresa;
  dataFundacao?: string;
  descricao?: string;
  website?: string;
  modeloNegocio?: ModeloNegocio;
  modeloNegocioDetalhes?: Record<string, unknown>;
  contasReceita?: Record<string, string>;
  custosCentralizados?: boolean;
  contasCustos?: Record<string, string>;
}

export interface UpdateEmpresaDto {
  razaoSocial?: string;
  nomeFantasia?: string;
  tipo?: 'MATRIZ' | 'FILIAL';
  uf?: string;
  // NOVOS CAMPOS PARA CONTEXTO IA
  setor?: string;
  porte?: PorteEmpresa;
  dataFundacao?: string;
  descricao?: string;
  website?: string;
  modeloNegocio?: ModeloNegocio;
  modeloNegocioDetalhes?: Record<string, unknown>;
  contasReceita?: Record<string, string>;
  custosCentralizados?: boolean;
  contasCustos?: Record<string, string>;
}

export const empresasService = {
  async list(): Promise<Empresa[]> {
    const { data } = await api.get<Empresa[]>('/empresas');
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<Empresa> {
    const { data } = await api.get<Empresa>(`/empresas/${id}`);
    return data;
  },

  async create(dto: CreateEmpresaDto): Promise<Empresa> {
    const { data } = await api.post<Empresa>('/empresas', dto);
    return data;
  },

  async update(id: string, dto: UpdateEmpresaDto): Promise<Empresa> {
    const { data } = await api.put<Empresa>(`/empresas/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/empresas/${id}`);
  },
};
