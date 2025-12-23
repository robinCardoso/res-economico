// Re-export das funções utilitárias genéricas de importação
export {
  EMPTY_VALUE_PLACEHOLDER,
  convertValue,
  formatValueForPreview,
  parseDate,
  type RowData,
  type MappingInfo,
} from './import-utils';

import { processFile as processFileBase } from './import-utils';
import type { RowData } from './import-utils';

/**
 * Processa o arquivo Excel removendo a última linha que contém totais.
 * Função específica para pedidos, pois os arquivos de pedidos sempre têm uma linha de totais no final.
 */
export async function processFile(file: File, onProgress: (p: number) => void): Promise<{ headers: string[], data: RowData[], headerRowIndex: number }> {
  const result = await processFileBase(file, onProgress);
  
  // Remover a última linha de dados (linha de totais)
  if (result.data.length > 0) {
    result.data = result.data.slice(0, -1);
  }
  
  return result;
}
