export interface Insight {
  tipo: 'POSITIVO' | 'ATENCAO' | 'CRITICO' | 'INFORMATIVO';
  titulo: string;
  descricao: string;
  recomendacao?: string;
  dados: Record<string, unknown>;
  confianca: number; // 0-100
}

export interface AnaliseResponse {
  id: string;
  tipo: string;
  dataAnalise: Date;
  insights: Insight[];
  padroesAnomalos: Array<{
    tipo: string;
    descricao: string;
    severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
    dados: Record<string, unknown>;
  }>;
  sugestoesCorrecao: Array<{
    alertaId?: string;
    problema: string;
    solucao: string;
    confianca: number;
  }>;
  resumo: string;
}
