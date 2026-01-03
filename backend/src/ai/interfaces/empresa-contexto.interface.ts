export interface EmpresaContexto {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  uf?: string;
  tipo: 'MATRIZ' | 'FILIAL';
  setor?: string;
  porte?: 'MICRO' | 'PEQUENA' | 'MEDIA' | 'GRANDE';
  dataFundacao?: Date;
  descricao?: string;
  website?: string;

  // Modelo de negócio
  modeloNegocio?:
    | 'ASSOCIACAO'
    | 'COMERCIO'
    | 'INDUSTRIA'
    | 'SERVICOS'
    | 'AGROPECUARIA'
    | 'OUTRO';
  modeloNegocioDetalhes?: Record<string, unknown>;
  contasReceita?: Record<string, string>; // Ex: { mensalidades: "3.1.01.01", bonificacoes: "3.1.02.01" }
  custosCentralizados?: boolean;
  receitasCentralizadas?: boolean; // Se receitas (ex: bonificações) estão centralizadas na matriz
  contasCustos?: Record<string, string>; // Ex: { funcionarios: "4.1.01", sistema: "4.1.02", contabilidade: "4.1.03" }

  totalUploads: number;
  mesesComDados: string[];
  periodoMaisAntigo?: string;
  periodoMaisRecente?: string;
  estatisticas?: {
    receitaMediaMensal?: number;
    variacaoMediaReceita?: number;
    principaisContas?: Array<{ nome: string; saldoMedio: number }>;
  };

  metricasModelo?: {
    coberturaCustosPorMensalidades?: number;
    proporcaoMensalidadesBonificacoes?: number;
    custoPorAssociado?: number;
    margemSeguranca?: number;
  } | null;
}
