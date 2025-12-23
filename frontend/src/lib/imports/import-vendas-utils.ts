// Re-export das funções utilitárias genéricas de importação
export {
  EMPTY_VALUE_PLACEHOLDER,
  convertValue,
  formatValueForPreview,
  processFile,
  parseDate,
  type RowData,
  type MappingInfo,
} from './import-utils';

/**
 * Valida se uma string é um CNPJ válido.
 * Função específica para validações de vendas.
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  cnpj = cnpj.replace(/[^\d]+/g, ''); // remove caracteres não numéricos
  if (cnpj.length !== 14) return false;

  // elimina CPFs/CNPJs inválidos conhecidos
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho++;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}
