import readXlsxFile from 'read-excel-file';
import * as XLSX from 'xlsx';

export const EMPTY_VALUE_PLACEHOLDER = '(Vazio)';

export type RowData = { [key: string]: string | number | boolean };
export type MappingInfo = { fileColumn: string | null; dataType: 'text' | 'integer' | 'decimal' | 'currency' | 'date' };

/**
 * Parses a date string from multiple formats into a UTC Date object.
 * It now handles DD/MM/YYYY, YYYY-MM-DD, and native Date objects.
 * @param dateValue The date value to parse (string, number, or Date).
 * @returns A Date object or null if parsing fails.
 */
function parseDate(dateValue: unknown): Date | null {
    if (!dateValue) return null;

    // If it's already a valid Date object
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        return dateValue;
    }
    
    // If it's a string, try various formats
    if (typeof dateValue === 'string') {
        const dateStr = dateValue.trim();
        
        // Try parsing ISO format (YYYY-MM-DD) which JS handles well, but force UTC
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10);
            const day = parseInt(isoMatch[3], 10);
            const utcDate = new Date(Date.UTC(year, month - 1, day));
             if (!isNaN(utcDate.getTime())) return utcDate;
        }

        // Try parsing DD/MM/YYYY format
        const ptBrMatch = dateStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
        if (ptBrMatch) {
            const day = parseInt(ptBrMatch[1], 10);
            const month = parseInt(ptBrMatch[2], 10);
            const year = parseInt(ptBrMatch[3], 10);
            const utcDate = new Date(Date.UTC(year, month - 1, day));
             if (!isNaN(utcDate.getTime())) return utcDate;
        }
        
        // Fallback to generic JS parsing, which might be risky but is a last resort
        const genericDate = new Date(dateStr);
        if (!isNaN(genericDate.getTime())) {
             // Create a UTC date from the parsed components to avoid timezone issues
             return new Date(Date.UTC(genericDate.getFullYear(), genericDate.getMonth(), genericDate.getDate()));
        }
    }

    return null; // Return null if all parsing attempts fail
}


// Limite de linhas para processamento no frontend (para evitar travamento)
// Reduzido para 2000 para evitar bloqueio da UI em arquivos grandes
const MAX_FRONTEND_ROWS = 2000; // Processar apenas 2k linhas no frontend para preview

export async function processFile(file: File, onProgress: (p: number) => void): Promise<{ headers: string[], data: RowData[], headerRowIndex: number }> {
    return new Promise(async (resolve, reject) => {
        try {
            onProgress(10);
            
            // Verificar tamanho do arquivo antes de processar
            const fileSizeMB = file.size / (1024 * 1024);
            const isLargeFileBySize = fileSizeMB > 5; // Arquivos maiores que 5MB
            
            let rows: Array<Array<unknown>>;
            
            if (isLargeFileBySize) {
                // Para arquivos grandes, usar XLSX diretamente com processamento mais eficiente
                onProgress(20);
                
                // Yield para permitir que o navegador atualize a UI
                await new Promise(resolve => setTimeout(resolve, 10));
                
                const arrayBuffer = await file.arrayBuffer();
                onProgress(30);
                
                // Yield antes de processar o workbook (operação pesada)
                await new Promise(resolve => setTimeout(resolve, 10));
                
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // Ler apenas uma amostra para preview (primeiras MAX_FRONTEND_ROWS linhas)
                // Usar range para limitar o processamento
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                const maxRowsToRead = Math.min(range.e.r + 1, MAX_FRONTEND_ROWS + 20); // +20 para cabeçalho
                
                // Criar range limitado
                const limitedRange = { ...range, e: { ...range.e, r: maxRowsToRead - 1 } };
                worksheet['!ref'] = XLSX.utils.encode_range(limitedRange);
                
                // Yield antes de converter para JSON (operação pesada)
                await new Promise(resolve => setTimeout(resolve, 10));
                
                rows = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1, 
                    defval: null,
                    raw: false 
                }) as Array<Array<unknown>>;
                
                onProgress(40);
            } else {
                // Para arquivos pequenos, usar readXlsxFile normalmente
                // Yield antes de processar
                await new Promise(resolve => setTimeout(resolve, 10));
                
                rows = await readXlsxFile(file);
                onProgress(30);
            }

            if (rows.length === 0) {
                 reject(new Error("A planilha está vazia."));
                 return;
            }

            // Avisar se o arquivo é muito grande
            const totalRows = rows.length;
            const hasTooManyRows = totalRows > MAX_FRONTEND_ROWS;
            
            if (hasTooManyRows) {
                console.warn(`⚠️ Arquivo grande detectado: ${totalRows} linhas. Processando apenas ${MAX_FRONTEND_ROWS} linhas para preview. O processamento completo será feito no backend.`);
            }
            
            // Yield após ler o arquivo para permitir que o navegador atualize
            await new Promise(resolve => setTimeout(resolve, 10));

            let headerRowIndex = -1;
            let maxCols = 0;
            const rowsToScan = Math.min(rows.length, 20);

            // Processar busca de cabeçalho com yields para não bloquear
            for (let i = 0; i < rowsToScan; i++) {
                const row = rows[i] || [];
                const nonEmptyCells = row.filter(cell => cell !== null && String(cell).trim() !== '').length;
                if (nonEmptyCells > maxCols) {
                    maxCols = nonEmptyCells;
                    headerRowIndex = i;
                }
                
                // Yield a cada 5 linhas para não bloquear
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            }

            if (headerRowIndex === -1) {
                reject(new Error("Não foi possível encontrar um cabeçalho válido nas primeiras 20 linhas do arquivo."));
                return;
            }
            
            const headerRow = rows[headerRowIndex];
            // Limitar linhas de dados processadas no frontend para arquivos grandes
            const dataRowsToProcess = hasTooManyRows 
                ? rows.slice(headerRowIndex + 1, headerRowIndex + 1 + MAX_FRONTEND_ROWS)
                : rows.slice(headerRowIndex + 1);

            onProgress(50);

            const originalHeaders = headerRow.map(h => String(h || '').trim());
            const headerCounts: Record<string, number> = {};
            const uniqueHeaders = originalHeaders.map(header => {
                if (!header) return header;
                headerCounts[header] = (headerCounts[header] || 0) + 1;
                return headerCounts[header] > 1 ? `${header}_${headerCounts[header]}` : header;
            });

            // Função para detectar se uma linha é de totalização
            const isTotalizationRow = (row: Array<unknown>): boolean => {
                if (!row || row.length === 0) return false;
                
                const rowValues = row.map(cell => String(cell || '').trim().toLowerCase());
                
                // Palavras que indicam linha de total
                const totalKeywords = ['total', 'subtotal', 'soma', 'resumo', 'conclusão', 'final', 'todos'];
                
                // Verificar se alguma célula contém palavras de total
                const hasTotalKeyword = rowValues.some(value => 
                    totalKeywords.some(keyword => value.includes(keyword))
                );
                
                // Verificar se é uma linha com poucos valores não vazios (comum em totais)
                const nonEmptyCount = row.filter(cell => cell !== null && String(cell).trim() !== '').length;
                const isEmptyRow = nonEmptyCount <= 2; // Linhas de total geralmente têm 1-2 valores
                
                // Verificar se contém valores monetários muito altos (indicativo de total)
                const hasHighValues = row.some(cell => {
                    const numValue = parseFloat(String(cell || '').replace(/[^\d,.-]/g, '').replace(',', '.'));
                    return !isNaN(numValue) && numValue > 10000; // Valores acima de R$ 10.000
                });
                
                return hasTotalKeyword || (isEmptyRow && hasHighValues);
            };

            // Processar em chunks menores para não travar o navegador
            // Reduzido para 100 linhas por chunk para melhor responsividade
            const CHUNK_SIZE = 100; // Processar 100 linhas por vez
            const jsonData: RowData[] = [];
            
            onProgress(60);
            
            // Processar em chunks com yield para não bloquear a UI
            for (let i = 0; i < dataRowsToProcess.length; i += CHUNK_SIZE) {
                const chunk = dataRowsToProcess.slice(i, i + CHUNK_SIZE);
                
                // Yield antes de processar cada chunk
                await new Promise(resolve => setTimeout(resolve, 5));
                
                const chunkData = chunk
                    .filter(row => {
                        // Filtrar linhas vazias
                        if (!row || row.every(cell => cell === null || String(cell).trim() === '')) {
                            return false;
                        }
                        
                        // Filtrar linhas de totalização
                        if (isTotalizationRow(row)) {
                            return false;
                        }
                        
                        return true;
                    })
                    .map(row => {
                        const rowObject: RowData = {};
                        uniqueHeaders.forEach((header, index) => {
                            if (header) {
                                const value = row[index];
                                // Converter unknown para tipos aceitos por RowData
                                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                                    rowObject[header] = value;
                                } else if (value === null || value === undefined) {
                                    rowObject[header] = '';
                                } else {
                                    rowObject[header] = String(value);
                                }
                            }
                        });
                        return rowObject;
                    });
                
                jsonData.push(...chunkData);
                
                // Atualizar progresso durante processamento
                const progress = 60 + Math.floor((i / dataRowsToProcess.length) * 30);
                onProgress(Math.min(progress, 95));
                
                // Yield mais longo para permitir que o navegador processe outros eventos
                // Aumentado para 10ms para dar mais tempo ao navegador
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            onProgress(100);
            
            const result = { 
                headers: uniqueHeaders.filter(h => h), 
                data: jsonData, 
                headerRowIndex 
            };
            
            // Adicionar aviso se arquivo foi truncado
            if (hasTooManyRows) {
                console.warn(`📊 Preview limitado: ${jsonData.length} de ${totalRows - headerRowIndex - 1} linhas processadas. O backend processará todas as ${totalRows} linhas durante a importação.`);
            }
            
            resolve(result);

        } catch (error: unknown) {
            console.error("Erro ao processar arquivo:", error);
            reject(new Error("Ocorreu um erro ao ler a planilha. Verifique se o formato é válido e não está corrompido."));
        }
    });
}


export const convertValue = (value: unknown, type: MappingInfo['dataType']): string | number | null | Date => {
    if (value === null || value === undefined || String(value).trim() === '') return null;

    if (type === 'date') {
        return parseDate(value);
    }

    if (type === 'currency' || type === 'decimal') {
        if (typeof value === 'number') {
            return value;
        }
        const strValue = String(value).trim();
        const cleanedValue = strValue
            .replace('R$', '')
            .trim()
            .replace(/\./g, '')
            .replace(',', '.');

        const num = parseFloat(cleanedValue);
        return isNaN(num) ? null : num;
    }
    
    const strValue = String(value).trim();
    
    switch (type) {
        case 'integer': {
            const intValue = parseInt(strValue.replace(/[^\d-]/g, ''), 10);
            return isNaN(intValue) ? null : intValue;
        }
        case 'text':
        default:
            return String(value);
    }
};

export const formatValueForPreview = (value: unknown, dbFieldValue: string, dataType: MappingInfo['dataType']): string => {
  if (value === null || value === undefined) return '';

  if (dataType === 'date') {
    if (value instanceof Date && !isNaN(value.getTime())) {
        // Format the date as DD/MM/YYYY, ensuring UTC components are used.
        const day = String(value.getUTCDate()).padStart(2, '0');
        const month = String(value.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = value.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
    return 'Data Inválida';
  }
  
  if (dataType === 'currency' && typeof value === 'number') {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'});
  }
  
  if (dataType === 'decimal' && typeof value === 'number') {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return String(value);
};

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
