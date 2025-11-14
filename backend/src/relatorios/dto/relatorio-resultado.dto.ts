export interface ContaRelatorio {
  classificacao: string; // 3., 3.01, 3.01.01, etc.
  nomeConta: string;
  nivel: number;
  valores: {
    [mes: number]: number; // 1-12 (Janeiro a Dezembro)
    total: number;
  };
  filhos?: ContaRelatorio[]; // Para hierarquia
}

export interface RelatorioResultado {
  empresaId?: string;
  empresaNome: string;
  uf?: string;
  ano: number;
  tipo: 'FILIAL' | 'CONSOLIDADO';
  periodo: {
    mes: number;
    nome: string; // Janeiro, Fevereiro, etc.
  }[];
  contas: ContaRelatorio[];
}

