/**
 * ============================================
 * INTERFACES - BRAVO ERP CLIENT
 * ============================================
 */

export interface BravoProduto {
  product_id?: string;
  id_produto?: string;
  tipo?: string;
  titulo?: string;
  descricao?: string;
  codigo_gtin?: string;
  referencia?: string;
  ref?: string;
  codigo_ncm?: string;
  ncm?: string;
  codigo_cest?: string;
  cest?: string;
  unidade_abreviacao?: string;
  unidade_descricao?: string;
  unidade_qtd_embalagem?: number;
  marca_id?: string;
  id_marca?: string;
  marca_nome?: string;
  categoria_id?: string;
  id_produto_categoria?: string;
  categoria_nome?: string;
  grupo_id?: string;
  grupo_nome?: string;
  subgrupo_id?: string;
  subgrupo_nome?: string;
  _data_ult_modif?: string;
  dataUltModif?: string;
  preco_venda?: number;
  venda_preco_base_val?: number;
  preco_custo?: number;
  estoque_atual?: number;
  ativo?: boolean;
  excluido?: string; // 'S' ou 'N'
  gtin?: any; // Pode ser array ou objeto
  _ref?: any; // Objetos aninhados
  peso_bruto_un_kg?: number;
  peso_liq_un_kg?: number;
}

export interface BravoResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  count?: number;
  page?: number;
  totalPages?: number;
}

export interface ConsultarProdutosOptions {
  page?: number;
  sortCol?: string | string[];
  sortOrder?: 'ASC' | 'DESC' | ('ASC' | 'DESC')[];
  filterDate?: string; // Formato: "< YYYY-MM-DD" ou "> YYYY-MM-DD"
  limit?: number;
  useNewSorting?: boolean; // Nova ordenação dupla conforme orientação do programador
}

export interface BravoConfig {
  baseUrl: string;
  cliente: string;
  token: string;
  ambiente: 'p' | 'h';
  server: string;
  timeout: number;
}
