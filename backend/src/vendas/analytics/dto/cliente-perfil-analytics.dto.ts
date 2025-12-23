/**
 * DTOs para Análise de Perfil de Cliente
 * Sistema completo de análise de comportamento e métricas de clientes
 */

// =====================================================
// FILTROS DE ANÁLISE
// =====================================================

export class FiltrosPerfilClienteDto {
  // Filtros temporais
  dataInicio?: Date;
  dataFim?: Date;
  ano?: number[];
  mes?: number[];

  // Filtros de cliente
  nomeFantasia?: string[];
  empresaId?: string[];
  uf?: string[];

  // Filtros de segmentação
  segmento?: string[]; // 'alto_valor', 'medio', 'baixo_engajamento', 'inativo'
  
  // Limite de resultados
  limit?: number;
  offset?: number;
}

// =====================================================
// MÉTRICAS FINANCEIRAS
// =====================================================

export interface MetricasFinanceirasCliente {
  nomeFantasia: string;
  empresaId?: string;
  uf?: string;
  
  // Receita
  receitaTotal: number;
  receitaMedia: number;
  receitaMediaMensal: number;
  receitaMediaAnual: number;
  
  // Ticket médio
  ticketMedio: number;
  
  // Customer Lifetime Value
  lifetimeValue: number;
  lifetimeValueProjetado: number; // LTV projetado para 12 meses
  
  // Tendências
  tendenciaReceita: 'crescente' | 'estavel' | 'decrescente';
  crescimentoPercentual: number; // % de crescimento comparado ao período anterior
  
  // Temporalidade
  primeiraCompra: Date;
  ultimaCompra: Date;
  mesesAtivo: number;
  frequenciaCompra: number; // Compras por mês
  
  // Métricas por período
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
  trimestre: number; // 1-4
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

// =====================================================
// ANÁLISE DE COMPORTAMENTO DE COMPRA
// =====================================================

export interface ComportamentoCompraCliente {
  nomeFantasia: string;
  empresaId?: string;
  
  // Marcas
  marcasPrincipais: MarcaComprada[];
  marcasFavoritas: string[]; // Top 3 marcas
  
  // Produtos
  gruposPrincipais: GrupoComprado[];
  subgruposPrincipais: SubgrupoComprado[];
  
  // Sazonalidade
  padraoSazonal: PadraoSazonalCliente;
  
  // Cross-selling
  oportunidadesCrossSelling: OportunidadeCrossSelling[];
  
  // Diversificação
  diversidadeMarcas: number; // Quantidade de marcas diferentes compradas
  diversidadeGrupos: number; // Quantidade de grupos diferentes
  concentracaoCompra: number; // % da receita nas top 3 marcas (0-100)
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
  mesesAlta: number[]; // Meses com maior volume de compras
  mesesBaixa: number[]; // Meses com menor volume de compras
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

// =====================================================
// SEGMENTAÇÃO DE CLIENTES
// =====================================================

export interface SegmentacaoCliente {
  nomeFantasia: string;
  empresaId?: string;
  
  // RFM (Recency, Frequency, Monetary)
  recencia: number; // Dias desde última compra
  frequencia: number; // Número de compras
  valorMonetario: number; // Valor total gasto
  
  // Scores RFM (1-5)
  scoreRecencia: number;
  scoreFrequencia: number;
  scoreMonetario: number;
  scoreRFM: number; // Score combinado
  
  // Segmento
  segmento: SegmentoCliente;
  descricaoSegmento: string;
  
  // Potencial
  potencialCrescimento: 'alto' | 'medio' | 'baixo';
  valorPotencial: number; // Receita potencial estimada
  
  // Risco
  riscoChurn: 'alto' | 'medio' | 'baixo';
  probabilidadeChurn: number; // 0-100%
}

export type SegmentoCliente = 
  | 'campeoes' // Alta recência, frequência e valor
  | 'fieis' // Alta frequência
  | 'grandes_gastadores' // Alto valor
  | 'promissores' // Recentes, baixa frequência
  | 'necessitam_atencao' // Recência média caindo
  | 'em_risco' // Gastavam muito, não compram recentemente
  | 'perdidos' // Última compra há muito tempo
  | 'hibernando'; // Baixa frequência, última compra antiga

// =====================================================
// ALERTAS E RECOMENDAÇÕES
// =====================================================

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
  impactoEstimado: number; // Receita estimada
  probabilidadeSucesso: number; // 0-100%
  acoes: string[];
}

export type TipoRecomendacao =
  | 'upselling' // Aumentar valor do pedido
  | 'cross_selling' // Vender produtos complementares
  | 'reativacao' // Reativar cliente inativo
  | 'retencao' // Reter cliente em risco
  | 'fidelizacao' // Aumentar frequência
  | 'expansao'; // Vender novas categorias

// =====================================================
// RELATÓRIO CONSOLIDADO
// =====================================================

export interface RelatorioPerfilCliente {
  // Informações do cliente
  nomeFantasia: string;
  empresaId?: string;
  uf?: string;
  
  // Métricas financeiras
  metricas: MetricasFinanceirasCliente;
  
  // Comportamento de compra
  comportamento: ComportamentoCompraCliente;
  
  // Segmentação
  segmentacao: SegmentacaoCliente;
  
  // Alertas ativos
  alertas: AlertaCliente[];
  
  // Recomendações
  recomendacoes: RecomendacaoAcao[];
  
  // Metadata
  dataGeracao: Date;
  periodoAnalise: {
    inicio: Date;
    fim: Date;
  };
}

// =====================================================
// VISÃO GERAL (DASHBOARD)
// =====================================================

export interface VisaoGeralClientes {
  // Resumo geral
  totalClientes: number;
  clientesAtivos: number; // Compraram nos últimos 90 dias
  clientesInativos: number; // Não compram há mais de 90 dias
  
  // Receita
  receitaTotal: number;
  receitaMediaPorCliente: number;
  ticketMedioGeral: number;
  
  // LTV
  lifetimeValueMedio: number;
  lifetimeValueTotal: number;
  
  // Segmentação
  distribuicaoSegmentos: {
    segmento: SegmentoCliente;
    quantidade: number;
    percentual: number;
    receitaTotal: number;
  }[];
  
  // Top clientes
  topClientes: {
    nomeFantasia: string;
    receita: number;
    segmento: SegmentoCliente;
  }[];
  
  // Alertas
  totalAlertas: number;
  alertasPorTipo: {
    tipo: TipoAlerta;
    quantidade: number;
  }[];
  
  // Tendências
  tendenciaGeral: 'crescente' | 'estavel' | 'decrescente';
  crescimentoReceita: number; // % comparado ao período anterior
  
  // Oportunidades
  receitaPotencial: number; // Soma de todas as oportunidades
  clientesComOportunidade: number;
  
  // Dados para gráficos
  receitaMensalAgregada: {
    ano: number;
    mes: number;
    mesDescricao: string;
    receita: number;
  }[];
  
  marcasMaisCompradas: {
    marca: string;
    quantidade: number;
    valor: number;
  }[];
  
  sazonalidadeAgregada: {
    mes: number;
    mesDescricao: string;
    receita: number;
  }[];
}
