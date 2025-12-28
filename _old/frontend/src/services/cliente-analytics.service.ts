/**
 * Service para API de análise de perfil de cliente
 */
import api from '@/lib/http';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface ClienteAnalyticsFilters {
  ano?: number[];
  mes?: number[];
  nomeFantasia?: string[];
  empresaId?: string[];
  uf?: string[];
  segmento?: string[];
  limit?: number;
  offset?: number;
}

export interface VisaoGeralClientes {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  receitaTotal: number;
  receitaMediaPorCliente: number;
  ticketMedioGeral: number;
  lifetimeValueMedio: number;
  lifetimeValueTotal: number;
  distribuicaoSegmentos: {
    segmento: string;
    quantidade: number;
    percentual: number;
    receitaTotal: number;
  }[];
  topClientes: {
    nomeFantasia: string;
    receita: number;
    segmento: string;
  }[];
  totalAlertas: number;
  alertasPorTipo: {
    tipo: string;
    quantidade: number;
  }[];
  tendenciaGeral: 'crescente' | 'estavel' | 'decrescente';
  crescimentoReceita: number;
  receitaPotencial: number;
  clientesComOportunidade: number;
}

export interface RelatorioPerfilCliente {
  nomeFantasia: string;
  empresaId?: string;
  uf?: string;
  metricas: MetricasFinanceirasCliente;
  comportamento: ComportamentoCompraCliente;
  segmentacao: SegmentacaoCliente;
  alertas: AlertaCliente[];
  recomendacoes: RecomendacaoAcao[];
  dataGeracao: Date;
  periodoAnalise: {
    inicio: Date;
    fim: Date;
  };
}

export interface MetricasFinanceirasCliente {
  nomeFantasia: string;
  empresaId?: string;
  uf?: string;
  receitaTotal: number;
  receitaMedia: number;
  receitaMediaMensal: number;
  receitaMediaAnual: number;
  ticketMedio: number;
  lifetimeValue: number;
  lifetimeValueProjetado: number;
  tendenciaReceita: 'crescente' | 'estavel' | 'decrescente';
  crescimentoPercentual: number;
  primeiraCompra: Date;
  ultimaCompra: Date;
  mesesAtivo: number;
  frequenciaCompra: number;
  receitaMensal: ReceitaMensalCliente[];
  receitaTrimestral: ReceitaTrimestralCliente[];
  receitaAnual: ReceitaAnualCliente[];
}

export interface ReceitaMensalCliente {
  ano: number;
  mes: number;
  receita: number;
  quantidadeCompras: number;
  ticketMedio: number;
}

export interface ReceitaTrimestralCliente {
  ano: number;
  trimestre: number;
  receita: number;
  quantidadeCompras: number;
  ticketMedio: number;
}

export interface ReceitaAnualCliente {
  ano: number;
  receita: number;
  quantidadeCompras: number;
  ticketMedio: number;
}

export interface ComportamentoCompraCliente {
  nomeFantasia: string;
  empresaId?: string;
  marcasPrincipais: MarcaComprada[];
  marcasFavoritas: string[];
  gruposPrincipais: GrupoComprado[];
  subgruposPrincipais: SubgrupoComprado[];
  padraoSazonal: PadraoSazonalCliente;
  oportunidadesCrossSelling: OportunidadeCrossSelling[];
  diversidadeMarcas: number;
  diversidadeGrupos: number;
  concentracaoCompra: number;
}

export interface MarcaComprada {
  marca: string;
  quantidadeCompras: number;
  valorTotal: number;
  percentualReceita: number;
  frequencia: 'alta' | 'media' | 'baixa';
  ultimaCompra: Date;
}

export interface GrupoComprado {
  grupo: string;
  quantidadeCompras: number;
  valorTotal: number;
  percentualReceita: number;
  marcasPrincipais: string[];
}

export interface SubgrupoComprado {
  subgrupo: string;
  grupo: string;
  quantidadeCompras: number;
  valorTotal: number;
  percentualReceita: number;
}

export interface PadraoSazonalCliente {
  mesesAlta: number[];
  mesesBaixa: number[];
  sazonalidade: 'alta' | 'media' | 'baixa';
  receitaPorMes: { mes: number; receita: number }[];
}

export interface OportunidadeCrossSelling {
  marcaAtual: string;
  marcaSugerida: string;
  razao: string;
  potencialReceita: number;
  probabilidade: 'alta' | 'media' | 'baixa';
}

export interface SegmentacaoCliente {
  nomeFantasia: string;
  empresaId?: string;
  recencia: number;
  frequencia: number;
  valorMonetario: number;
  scoreRecencia: number;
  scoreFrequencia: number;
  scoreMonetario: number;
  scoreRFM: number;
  segmento: SegmentoCliente;
  descricaoSegmento: string;
  potencialCrescimento: 'alto' | 'medio' | 'baixo';
  valorPotencial: number;
  riscoChurn: 'alto' | 'medio' | 'baixo';
  probabilidadeChurn: number;
}

export type SegmentoCliente =
  | 'campeoes'
  | 'fieis'
  | 'grandes_gastadores'
  | 'promissores'
  | 'necessitam_atencao'
  | 'em_risco'
  | 'perdidos'
  | 'hibernando';

export interface AlertaCliente {
  nomeFantasia: string;
  empresaId?: string;
  tipo: TipoAlerta;
  prioridade: 'alta' | 'media' | 'baixa';
  mensagem: string;
  diasSemCompra?: number;
  ultimaCompra?: Date;
  receitaPotencialPerdida?: number;
  acaoRecomendada: string;
}

export type TipoAlerta =
  | 'inativo_30_dias'
  | 'inativo_60_dias'
  | 'inativo_90_dias'
  | 'queda_receita'
  | 'risco_churn'
  | 'oportunidade_upselling';

export interface RecomendacaoAcao {
  nomeFantasia: string;
  tipo: TipoRecomendacao;
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  impactoEstimado: number;
  probabilidadeSucesso: number;
  acoes: string[];
}

export type TipoRecomendacao =
  | 'upselling'
  | 'cross_selling'
  | 'reativacao'
  | 'retencao'
  | 'fidelizacao'
  | 'expansao';

// ============================================================
// SERVICE
// ============================================================

class ClienteAnalyticsService {
  /**
   * Busca visão geral (dashboard) de clientes
   */
  async getVisaoGeral(filters?: ClienteAnalyticsFilters): Promise<VisaoGeralClientes> {
    const params = this.buildQueryParams(filters);
    const queryString = params.toString();
    const url = queryString
      ? `/vendas/cliente-analytics/visao-geral?${queryString}`
      : '/vendas/cliente-analytics/visao-geral';

    const { data } = await api.get<VisaoGeralClientes>(url);
    return data;
  }

  /**
   * Busca relatórios de múltiplos clientes
   */
  async getRelatorios(filters?: ClienteAnalyticsFilters): Promise<RelatorioPerfilCliente[]> {
    const params = this.buildQueryParams(filters);
    const queryString = params.toString();
    const url = queryString
      ? `/vendas/cliente-analytics/relatorios?${queryString}`
      : '/vendas/cliente-analytics/relatorios';

    const { data } = await api.get<RelatorioPerfilCliente[]>(url);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Busca relatório de um cliente específico
   */
  async getRelatorioCliente(
    nomeFantasia: string,
    filters?: Omit<ClienteAnalyticsFilters, 'nomeFantasia'>,
  ): Promise<RelatorioPerfilCliente> {
    const params = this.buildQueryParams(filters);
    params.append('nomeFantasia', nomeFantasia);

    const queryString = params.toString();
    const url = `/vendas/cliente-analytics/cliente?${queryString}`;

    const { data } = await api.get<RelatorioPerfilCliente>(url);
    return data;
  }

  /**
   * Busca alertas de clientes
   */
  async getAlertas(filters?: ClienteAnalyticsFilters): Promise<AlertaCliente[]> {
    const params = this.buildQueryParams(filters);
    const queryString = params.toString();
    const url = queryString
      ? `/vendas/cliente-analytics/alertas?${queryString}`
      : '/vendas/cliente-analytics/alertas';

    const { data } = await api.get<AlertaCliente[]>(url);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Constrói query params para filtros
   */
  private buildQueryParams(filters?: ClienteAnalyticsFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (!filters) return params;

    if (filters.ano?.length) {
      params.append('ano', filters.ano.join(','));
    }
    if (filters.mes?.length) {
      params.append('mes', filters.mes.join(','));
    }
    if (filters.nomeFantasia?.length) {
      params.append('nomeFantasia', filters.nomeFantasia.join(','));
    }
    if (filters.empresaId?.length) {
      params.append('empresaId', filters.empresaId.join(','));
    }
    if (filters.uf?.length) {
      params.append('uf', filters.uf.join(','));
    }
    if (filters.segmento?.length) {
      params.append('segmento', filters.segmento.join(','));
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    return params;
  }
}

export const clienteAnalyticsService = new ClienteAnalyticsService();
