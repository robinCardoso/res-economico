import { api } from '@/lib/http';

export interface ConfiguracaoEmail {
  id: string;
  nome: string;
  host: string;
  porta: number;
  autenticar: boolean;
  usuario: string;
  copiasPara?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConfiguracaoEmailDto {
  nome: string;
  host: string;
  porta: number;
  autenticar: boolean;
  usuario: string;
  senha: string;
  copiasPara?: string;
  ativo?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateConfiguracaoEmailDto extends Partial<CreateConfiguracaoEmailDto> {}

export interface TestarEmailDto {
  destinatario: string;
  assunto?: string;
  corpo?: string;
}

export interface LogEnvioEmail {
  id: string;
  configuracaoId: string;
  destinatario: string;
  assunto: string;
  corpo?: string;
  status: 'PENDENTE' | 'ENVIADO' | 'FALHA' | 'CANCELADO';
  erro?: string;
  tentativas: number;
  enviadoEm?: string;
  createdAt: string;
  configuracao: {
    id: string;
    nome: string;
    host: string;
  };
}

export const configuracoesService = {
  async listar(): Promise<ConfiguracaoEmail[]> {
    const { data } = await api.get('/configuracoes/email');
    return data;
  },

  async obter(id: string): Promise<ConfiguracaoEmail> {
    const { data } = await api.get(`/configuracoes/email/${id}`);
    return data;
  },

  async criar(dto: CreateConfiguracaoEmailDto): Promise<ConfiguracaoEmail> {
    const { data } = await api.post('/configuracoes/email', dto);
    return data;
  },

  async atualizar(
    id: string,
    dto: UpdateConfiguracaoEmailDto,
  ): Promise<ConfiguracaoEmail> {
    const { data } = await api.put(`/configuracoes/email/${id}`, dto);
    return data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/configuracoes/email/${id}`);
  },

  async testarEmail(
    id: string,
    dto: TestarEmailDto,
  ): Promise<{ message: string; logId: string }> {
    const { data } = await api.post(`/configuracoes/email/${id}/testar`, dto);
    return data;
  },

  async testarConexao(id: string): Promise<{ message: string }> {
    const { data } = await api.post(`/configuracoes/email/${id}/testar-conexao`);
    return data;
  },

  async listarLogs(filters?: {
    configuracaoId?: string;
    status?: string;
    destinatario?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: LogEnvioEmail[];
    paginacao: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { data } = await api.get('/configuracoes/email/logs', { params: filters });
    return data;
  },
};

