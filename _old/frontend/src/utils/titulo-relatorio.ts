import { TipoRelatorio, type Empresa, type RelatorioResultado } from '@/types/api';

/**
 * Constrói o título do relatório de resultado econômico de forma dinâmica
 * baseado no tipo de relatório, empresas selecionadas e ano.
 * 
 * @param tipo - Tipo do relatório (FILIAL ou CONSOLIDADO)
 * @param empresaIds - Array de IDs das empresas selecionadas (para CONSOLIDADO)
 * @param empresasList - Lista completa de empresas disponíveis
 * @param relatorio - Dados do relatório retornado pelo backend (pode ser null)
 * @param ano - Ano do relatório
 * @returns String formatada do título do relatório
 */
export function construirTituloRelatorio(
  tipo: TipoRelatorio,
  empresaIds: string[],
  empresasList: Empresa[],
  relatorio: RelatorioResultado | null,
  ano: number
): string {
  // Cenário 1: Tipo FILIAL
  if (tipo === TipoRelatorio.FILIAL) {
    const empresaNome = relatorio?.empresaNome || '';
    const uf = relatorio?.uf || '';
    return `RESULTADO ECONÔMICO ${empresaNome.toUpperCase()}${uf ? ` - ${uf}` : ''} ${ano}`;
  }
  
  // Tipo CONSOLIDADO
  if (empresaIds.length === 0) {
    // Cenário 2: Todas as empresas (nenhuma selecionada = todas)
    return `RESULTADO ECONÔMICO CONSOLIDADO - ${ano}`;
  }
  
  // Cenário 3 e 4: Empresas selecionadas
  const nomesEmpresas = empresaIds
    .map(id => {
      const empresa = empresasList.find(e => e.id === id);
      return empresa?.razaoSocial || null;
    })
    .filter((nome): nome is string => nome !== null);
  
  // Se não encontrou nenhuma empresa válida, retornar título padrão
  if (nomesEmpresas.length === 0) {
    return `RESULTADO ECONÔMICO CONSOLIDADO - ${ano}`;
  }
  
  // Formatar nomes das empresas
  const nomesFormatados = nomesEmpresas.join(', ');
  
  return `RESULTADO ECONÔMICO CONSOLIDADO - ${nomesFormatados} - ${ano}`;
}

