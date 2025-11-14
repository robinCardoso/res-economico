import * as XLSX from 'xlsx';

export interface ValidationAlert {
  tipo: 'SALDO_DIVERGENTE' | 'CELULA_VAZIA' | 'DADO_INCONSISTENTE';
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
  linha: number;
  coluna?: string;
  mensagem: string;
}

export interface ValidationResult {
  isValid: boolean;
  alerts: ValidationAlert[];
  totalLinhas: number;
  linhasValidas: number;
}

/**
 * Converte valor do Excel para número (formato brasileiro)
 */
function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  const str = String(value).trim();
  if (!str) {
    return 0;
  }

  // Formato brasileiro: ponto para milhar, vírgula para decimal
  let cleaned = str.replace(/\./g, ''); // Remove pontos
  cleaned = cleaned.replace(',', '.'); // Substitui vírgula por ponto
  cleaned = cleaned.replace(/[^\d.-]/g, ''); // Remove outros caracteres

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Valida arquivo Excel e retorna alertas
 */
export function validateExcelFile(
  workbook: XLSX.WorkBook,
  headers: string[],
): ValidationResult {
  const alerts: ValidationAlert[] = [];
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

  if (jsonData.length === 0) {
    return {
      isValid: false,
      alerts: [
        {
          tipo: 'DADO_INCONSISTENTE',
          severidade: 'ALTA',
          linha: 0,
          mensagem: 'Arquivo Excel está vazio',
        },
      ],
      totalLinhas: 0,
      linhasValidas: 0,
    };
  }

  // Encontrar linha de cabeçalho
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, jsonData.length); i++) {
    const row = jsonData[i];
    if (Array.isArray(row)) {
      const textCells = row.filter((cell: unknown) => {
        if (cell === null || cell === undefined || cell === '') return false;
        const str = String(cell).trim();
        return isNaN(Number(str)) && str.length > 2;
      });
      if (textCells.length >= 3) {
        headerRowIndex = i;
        break;
      }
    }
  }

  const dataRows = jsonData.slice(headerRowIndex + 1);
  let linhasValidas = 0;

  // Mapear índices das colunas importantes
  const colIndices: Record<string, number> = {};
  const headerRow = jsonData[headerRowIndex] as unknown[];
  
  headerRow.forEach((header, index) => {
    if (header) {
      const headerStr = String(header).toLowerCase().trim();
      if (headerStr.includes('saldo') && headerStr.includes('anterior')) {
        colIndices.saldoAnterior = index;
      } else if (headerStr.includes('débito') || headerStr.includes('debito')) {
        colIndices.debito = index;
      } else if (headerStr.includes('crédito') || headerStr.includes('credito')) {
        colIndices.credito = index;
      } else if (headerStr.includes('saldo') && (headerStr.includes('atual') || headerStr.includes('final'))) {
        colIndices.saldoAtual = index;
      } else if (headerStr.includes('classificação') || headerStr.includes('classificacao')) {
        colIndices.classificacao = index;
      } else if (headerStr.includes('conta') && !headerStr.includes('sub') && !headerStr.includes('nome')) {
        colIndices.conta = index;
      } else if (headerStr.includes('nome') && headerStr.includes('conta')) {
        colIndices.nomeConta = index;
      }
    }
  });

  // Validar cada linha
  dataRows.forEach((row, index) => {
    const linhaNumero = headerRowIndex + 2 + index; // +2 porque começa em 1 e pula header
    const linha = row as unknown[];

    // Verificar se linha está vazia
    const linhaVazia = !linha.some(
      (cell) => cell !== null && cell !== undefined && cell !== '',
    );
    if (linhaVazia) {
      return; // Pular linhas vazias
    }

    // Verificar células vazias em campos importantes
    const camposCriticos = ['classificacao', 'conta', 'nomeConta'];
    camposCriticos.forEach((campo) => {
      const colIndex = colIndices[campo];
      if (colIndex !== undefined) {
        const value = linha[colIndex];
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          alerts.push({
            tipo: 'CELULA_VAZIA',
            severidade: 'ALTA',
            linha: linhaNumero,
            coluna: campo,
            mensagem: `Célula vazia na linha ${linhaNumero}, coluna ${campo}`,
          });
        }
      }
    });

    // Validar saldo
    if (
      colIndices.saldoAnterior !== undefined &&
      colIndices.debito !== undefined &&
      colIndices.credito !== undefined &&
      colIndices.saldoAtual !== undefined
    ) {
      const saldoAnterior = parseNumber(linha[colIndices.saldoAnterior]);
      const debito = parseNumber(linha[colIndices.debito]);
      const credito = parseNumber(linha[colIndices.credito]);
      const saldoAtual = parseNumber(linha[colIndices.saldoAtual]);

      // Fórmula contábil conforme formato do Excel: Saldo Atual = Saldo Anterior + Débito + Crédito
      // No Excel, o crédito já vem com o sinal correto (negativo para saída, positivo para entrada)
      // Então simplesmente somamos todos os valores
      const saldoCalculado = saldoAnterior + debito + credito;
      const diferenca = Math.abs(saldoCalculado - saldoAtual);

      // Tolerância de 0.01 para arredondamento
      if (diferenca > 0.01) {
        const severidade =
          diferenca > 1000 ? 'ALTA' : diferenca > 100 ? 'MEDIA' : 'BAIXA';
        alerts.push({
          tipo: 'SALDO_DIVERGENTE',
          severidade,
          linha: linhaNumero,
          mensagem: `Saldo divergente na linha ${linhaNumero}: esperado ${saldoCalculado.toFixed(2)}, encontrado ${saldoAtual.toFixed(2)} (diferença: ${diferenca.toFixed(2)})`,
        });
      }
    }

    linhasValidas++;
  });

  const hasCriticalErrors = alerts.some((a) => a.severidade === 'ALTA');
  const isValid = !hasCriticalErrors;

  return {
    isValid,
    alerts,
    totalLinhas: dataRows.length,
    linhasValidas,
  };
}

