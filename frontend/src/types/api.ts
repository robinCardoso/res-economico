// Tipos baseados nas respostas da API do backend

export type UploadStatus = 'PROCESSANDO' | 'CONCLUIDO' | 'COM_ALERTAS' | 'CANCELADO';
export type AlertaTipo = 'SALDO_DIVERGENTE' | 'CONTA_NOVA' | 'DADO_INCONSISTENTE' | 'CABECALHO_ALTERADO';
export type AlertaSeveridade = 'BAIXA' | 'MEDIA' | 'ALTA';
export type AlertaStatus = 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO';
export type ContaStatus = 'ATIVA' | 'NOVA' | 'ARQUIVADA';

export type TipoEmpresa = 'MATRIZ' | 'FILIAL';

export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  tipo: TipoEmpresa;
  uf?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateImportacao {
  id: string;
  empresaId: string;
  nome: string;
  descricao: string | null;
  configuracao: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  empresa?: Empresa;
}

export interface LinhaUpload {
  id: string;
  uploadId: string;
  classificacao: string;
  conta: string;
  subConta: string | null;
  nomeConta: string;
  tipoConta: string;
  nivel: number;
  titulo: boolean;
  estabelecimento: boolean;
  saldoAnterior: string;
  debito: string;
  credito: string;
  saldoAtual: string;
  hashLinha: string;
  createdAt: string;
}

export interface Alerta {
  id: string;
  uploadId: string;
  linhaId: string | null;
  tipo: AlertaTipo;
  severidade: AlertaSeveridade;
  mensagem: string;
  status: AlertaStatus;
  createdAt: string;
  resolvedAt: string | null;
  upload?: Upload;
  linha?: LinhaUpload | null;
}

export interface Upload {
  id: string;
  empresaId: string;
  templateId: string | null;
  mes: number;
  ano: number;
  arquivoUrl: string;
  hashArquivo: string;
  status: UploadStatus;
  totalLinhas: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  empresa?: Empresa;
  template?: TemplateImportacao | null;
  alertas?: Alerta[];
  linhas?: LinhaUpload[];
}

export interface ContaCatalogo {
  id: string;
  classificacao: string;
  nomeConta: string;
  tipoConta: string;
  nivel: number;
  primeiraImportacao: string;
  ultimaImportacao: string;
  status: ContaStatus;
}

// Tipos WithRelations (incluem relações)
export type UploadWithRelations = Upload & {
  empresa?: Empresa;
  template?: TemplateImportacao | null;
  alertas?: Alerta[];
  linhas?: LinhaUpload[];
};

export type AlertaWithRelations = Alerta & {
  upload?: Upload;
  linha?: LinhaUpload | null;
};

export type TemplateImportacaoWithRelations = TemplateImportacao & {
  empresa?: Empresa;
};

export type ContaCatalogoWithRelations = ContaCatalogo;

export interface LogAuditoria {
  id: string;
  recurso: string;
  acao: string;
  usuarioId: string;
  dados: Record<string, unknown>;
  createdAt: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface UploadProgress {
  progress: number;
  estado: string;
  etapa: string;
}

export type TipoRelatorio = 'FILIAL' | 'CONSOLIDADO';

export interface ContaRelatorio {
  classificacao: string;
  nomeConta: string;
  nivel: number;
  valores: {
    [mes: number]: number;
    total: number;
  };
  filhos?: ContaRelatorio[];
}

export interface RelatorioResultado {
  empresaId?: string;
  empresaNome: string;
  uf?: string;
  ano: number;
  tipo: TipoRelatorio;
  periodo: {
    mes: number;
    nome: string;
  }[];
  contas: ContaRelatorio[];
}

