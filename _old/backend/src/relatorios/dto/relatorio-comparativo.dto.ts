export interface ContaComparativa {
  classificacao: string;
  conta?: string; // Número da conta (ex: "1053")
  nomeConta: string;
  nivel: number;
  valorPeriodo1: number;
  valorPeriodo2: number;
  diferenca: number; // valorPeriodo2 - valorPeriodo1
  percentual: number; // ((valorPeriodo2 - valorPeriodo1) / valorPeriodo1) * 100
  filhos?: ContaComparativa[]; // Para hierarquia
}

export interface RelatorioComparativo {
  periodo1: {
    ano: number;
    mes: number;
    label: string; // "Janeiro/2024"
  };
  periodo2: {
    ano: number;
    mes: number;
    label: string; // "Fevereiro/2024"
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
