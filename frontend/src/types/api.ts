// Tipos baseados nas respostas da API do backend

export type UploadStatus = 'PROCESSANDO' | 'CONCLUIDO' | 'COM_ALERTAS' | 'CANCELADO';
export type AlertaTipo = 'SALDO_DIVERGENTE' | 'CONTA_NOVA' | 'DADO_INCONSISTENTE' | 'CABECALHO_ALTERADO' | 'CONTINUIDADE_TEMPORAL_DIVERGENTE';
export type AlertaSeveridade = 'BAIXA' | 'MEDIA' | 'ALTA';
export type AlertaStatus = 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO';
export type ContaStatus = 'ATIVA' | 'NOVA' | 'ARQUIVADA';

export interface ContaCatalogo {
  id: string;
  classificacao: string;
  conta: string; // Número da conta (ex: "1304")
  subConta: string; // Subconta (pode ser vazia)
  nomeConta: string;
  tipoConta: string;
  nivel: number;
  primeiraImportacao: string;
  ultimaImportacao: string;
  status: ContaStatus;
  createdAt: string;
  updatedAt: string;
}

export type ContaCatalogoWithRelations = ContaCatalogo;

export type TipoEmpresa = 'MATRIZ' | 'FILIAL';
export type PorteEmpresa = 'MICRO' | 'PEQUENA' | 'MEDIA' | 'GRANDE';
export type ModeloNegocio = 'ASSOCIACAO' | 'COMERCIO' | 'INDUSTRIA' | 'SERVICOS' | 'AGROPECUARIA' | 'OUTRO';

export enum TipoAnalise {
  UPLOAD = 'UPLOAD',
  ALERTAS = 'ALERTAS',
  RELATORIO = 'RELATORIO',
  COMPARATIVO = 'COMPARATIVO',
  GERAL = 'GERAL',
}

export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  tipo: TipoEmpresa;
  uf?: string | null;
  // NOVOS CAMPOS PARA CONTEXTO IA
  setor?: string | null;
  porte?: PorteEmpresa | null;
  dataFundacao?: string | null;
  descricao?: string | null;
  website?: string | null;
  modeloNegocio?: ModeloNegocio | null;
  modeloNegocioDetalhes?: Record<string, unknown> | null;
  contasReceita?: Record<string, string> | null;
  custosCentralizados?: boolean | null;
  receitasCentralizadas?: boolean | null;
  contasCustos?: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracaoModeloNegocio {
  id: string;
  modeloNegocio: ModeloNegocio;
  modeloNegocioDetalhes: Record<string, unknown>;
  contasReceita: Record<string, string>;
  contasCustos: Record<string, string>;
  custosCentralizados: boolean;
  receitasCentralizadas: boolean;
  descricao?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ResumoStatus = 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO' | 'CANCELADO';

export interface Insight {
  tipo: 'POSITIVO' | 'ATENCAO' | 'CRITICO' | 'INFORMATIVO';
  titulo: string;
  descricao: string;
  recomendacao?: string;
  dados: Record<string, unknown>;
  confianca: number; // 0-100
}

export interface PadraoAnomalo {
  tipo: string;
  descricao: string;
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
  dados: Record<string, unknown>;
}

export interface SugestaoCorrecao {
  alertaId?: string;
  problema: string;
  solucao: string;
  confianca: number;
}

export interface AnaliseResponse {
  id: string;
  tipo: string;
  dataAnalise: Date | string;
  insights: Insight[];
  padroesAnomalos: PadraoAnomalo[];
  sugestoesCorrecao: SugestaoCorrecao[];
  resumo: string;
}

export interface Upload {
  id: string;
  empresaId: string;
  templateId?: string | null;
  mes: number;
  ano: number;
  arquivoUrl: string;
  nomeArquivo: string;
  hashArquivo: string;
  status: UploadStatus;
  totalLinhas: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alerta {
  id: string;
  uploadId: string;
  linhaId?: string | null;
  tipo: AlertaTipo;
  severidade: AlertaSeveridade;
  mensagem: string;
  status: AlertaStatus;
  createdAt: string;
  resolvedAt?: string | null;
  linha?: {
    classificacao: string;
    nomeConta: string;
    tipoConta?: string;
  } | null;
}

export interface AlertaWithRelations extends Alerta {
  upload?: {
    id: string;
    empresaId: string;
    mes: number;
    ano: number;
    empresa?: Empresa | null;
  } | null;
}

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
  } | null;
}

export interface UploadProgress {
  progress: number;
  etapa: string;
  totalLinhas?: number;
  linhasProcessadas?: number;
}

export interface UploadWithRelations extends Upload {
  empresa?: Empresa | null;
  template?: {
    id: string;
    nome: string;
  } | null;
  alertas?: Alerta[];
  linhas?: Array<{
    id: string;
    classificacao: string;
    conta: string;
    subConta?: string | null;
    nomeConta: string;
    tipoConta: string;
    nivel: number;
    saldoAtual: number;
  }>;
}

export interface TemplateImportacao {
  id: string;
  empresaId?: string | null;
  nome: string;
  descricao?: string | null;
  configuracao: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateImportacaoWithRelations extends TemplateImportacao {
  empresa?: Empresa | null;
}

export interface AnalisarDadosParams {
  tipo: TipoAnalise;
  uploadId?: string;
  empresaId?: string;
  empresaIds?: string[];
  mes?: number;
  ano?: number;
  descricao?: string;
  mes1?: number;
  ano1?: number;
  mes2?: number;
  ano2?: number;
  tipoValor?: 'ACUMULADO' | 'PERIODO';
}

export interface CreateResumoDto {
  titulo: string;
  mes?: number;
  ano: number;
  empresaId?: string;
  uploadId?: string;
  tipoAnalise: TipoAnalise;
  parametros: AnalisarDadosParams;
}

export interface FilterResumoDto {
  empresaId?: string;
  ano?: number;
  mes?: number;
  status?: ResumoStatus;
  tipoAnalise?: TipoAnalise;
  page?: number;
  limit?: number;
}

export interface ResumoEconomico {
  id: string;
  titulo: string;
  mes?: number | null;
  ano: number;
  periodo?: string;
  empresaId?: string | null;
  uploadId?: string | null;
  tipoAnalise: TipoAnalise;
  parametros: Record<string, unknown>;
  resultado: AnaliseResponse;
  modeloIA: string;
  status: ResumoStatus;
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
  empresa?: Empresa | null;
  upload?: Upload | null;
}

export interface ResumosListResponse {
  data: ResumoEconomico[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export enum TipoRelatorio {
  FILIAL = 'FILIAL',
  CONSOLIDADO = 'CONSOLIDADO',
}

export enum TipoComparacao {
  MES_A_MES = 'MES_A_MES',
  ANO_A_ANO = 'ANO_A_ANO',
  CUSTOMIZADO = 'CUSTOMIZADO',
}

export enum TipoValor {
  ACUMULADO = 'ACUMULADO',
  PERIODO = 'PERIODO',
}

export interface ContaRelatorio {
  classificacao: string;
  conta: string;
  subConta?: string | null;
  nomeConta: string;
  tipoConta: string;
  nivel: number;
  titulo: boolean;
  estabelecimento: boolean;
  saldoAnterior: number;
  debito: number;
  credito: number;
  saldoAtual: number;
  valores?: { [mes: number]: number; total: number };
  filhos?: ContaRelatorio[];
}

export interface RelatorioResultado {
  empresaId?: string;
  empresaNome: string;
  uf?: string;
  ano: number;
  tipo: 'FILIAL' | 'CONSOLIDADO';
  periodo: {
    mes: number;
    nome: string;
  }[];
  contas: ContaRelatorio[];
}

export interface ContaComparativa {
  classificacao: string;
  conta?: string;
  nomeConta: string;
  nivel: number;
  valorPeriodo1: number;
  valorPeriodo2: number;
  diferenca: number;
  percentual: number;
  filhos?: ContaComparativa[];
}

export interface RelatorioComparativo {
  periodo1: {
    ano: number;
    mes: number;
    label: string;
  };
  periodo2: {
    ano: number;
    mes: number;
    label: string;
  };
  tipo: 'FILIAL' | 'CONSOLIDADO';
  empresaId?: string;
  empresaNome: string;
  uf?: string;
  contas: ContaComparativa[];
  totais: {
    periodo1: number;
    periodo2: number;
    diferenca: number;
    percentual: number;
  };
}
