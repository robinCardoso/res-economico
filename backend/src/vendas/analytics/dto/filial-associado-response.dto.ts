export interface FilialAssociadoResponse {
  ufs: UFData[];
  totalGeral: {
    [mes: number]: number; // 1-12
    total: number;
  };
  mesesDisponiveis: number[]; // [1, 2, 3, ..., 12]
}

export interface UFData {
  uf: string;
  totalGeral: number;
  monthlyTotals: {
    [mes: number]: number; // 1-12
  };
  associados: AssociadoData[];
}

export interface AssociadoData {
  nomeFantasia: string;
  totalGeral: number;
  monthlySales: {
    [mes: number]: number; // 1-12
  };
}
