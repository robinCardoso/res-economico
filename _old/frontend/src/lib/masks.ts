/**
 * Aplica máscara de CNPJ: XX.XXX.XXX/XXXX-XX
 */
export function maskCNPJ(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  // Aplica a máscara
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
}

/**
 * Remove máscara de CNPJ, retornando apenas números
 */
export function unmaskCNPJ(value: string): string {
  return value.replace(/\D/g, '');
}

