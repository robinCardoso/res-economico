import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../../Balancete MATRIZ 01 JAN 2025.xls');

if (!fs.existsSync(filePath)) {
  console.error('❌ Arquivo não encontrado:', filePath);
  process.exit(1);
}

console.log('📊 Analisando arquivo Excel...\n');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const totalRows = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']!).e.r + 1 : 0;
console.log(`📄 Aba: ${sheetName}`);
console.log(`📏 Total de linhas no arquivo: ${totalRows}`);

// Ler como array de arrays
const rawData = XLSX.utils.sheet_to_json(worksheet, {
  raw: false,
  defval: null,
  header: 1,
}) as any[][];

console.log(`📊 Total de linhas lidas: ${rawData.length}\n`);

// Encontrar linha de cabeçalho
console.log('🔍 === Procurando linha de cabeçalho ===');
let headerRowIndex = -1;
for (let i = 0; i < Math.min(10, rawData.length); i++) {
  const row = rawData[i];
  if (Array.isArray(row)) {
    const textCells = row.filter((cell: any) => {
      if (cell === null || cell === undefined || cell === '') return false;
      const str = String(cell).trim();
      return isNaN(Number(str)) && str.length > 2;
    });
    console.log(`Linha ${i + 1}: ${textCells.length} células de texto`);
    if (textCells.length >= 3 && headerRowIndex === -1) {
      headerRowIndex = i;
      console.log(`  ✅ Cabeçalho detectado na linha ${i + 1}\n`);
      break;
    }
  }
}

if (headerRowIndex < 0) {
  console.error('❌ Não foi possível encontrar a linha de cabeçalho');
  process.exit(1);
}

const headers = rawData[headerRowIndex] as any[];
const cleanHeaders = headers.map((h, idx) => {
  if (h === null || h === undefined || h === '') {
    return `Coluna_${idx + 1}`;
  }
  return String(h).trim();
});

console.log('📋 === Cabeçalhos detectados ===');
cleanHeaders.forEach((h, idx) => {
  console.log(`  Coluna ${idx + 1}: "${h}"`);
});

// Processar linhas de dados
const dataRows = rawData.slice(headerRowIndex + 1)
  .filter((row: any[]) => {
    return Array.isArray(row) && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '');
  })
  .map((row: any[]) => {
    const obj: any = {};
    cleanHeaders.forEach((header, index) => {
      const value = row[index];
      obj[header] = (value === '' || value === undefined) ? null : value;
    });
    return obj;
  });

console.log(`\n📈 Total de linhas de dados: ${dataRows.length}`);

// Analisar células vazias
console.log('\n🔍 === Análise de Células Vazias ===');
let totalLinhasComCelulasVazias = 0;
const camposVaziosPorColuna: Record<string, number> = {};

for (let i = 0; i < Math.min(100, dataRows.length); i++) {
  const row = dataRows[i];
  const celulasVazias: string[] = [];
  
  cleanHeaders.forEach((header) => {
    const value = row[header];
    const isEmpty = value === null || value === undefined || value === '' || 
                    (typeof value === 'string' && value.trim() === '');
    
    if (isEmpty) {
      celulasVazias.push(header);
      camposVaziosPorColuna[header] = (camposVaziosPorColuna[header] || 0) + 1;
    }
  });
  
  if (celulasVazias.length > 0) {
    totalLinhasComCelulasVazias++;
    if (i < 10) {
      console.log(`⚠️  Linha ${i + 1} (Classificação: ${row[cleanHeaders[0]] || 'N/A'}): ${celulasVazias.length} células vazias - ${celulasVazias.join(', ')}`);
    }
  }
}

console.log(`\n📊 Resumo de células vazias (primeiras 100 linhas):`);
console.log(`  Total de linhas com células vazias: ${totalLinhasComCelulasVazias}`);
console.log(`  Colunas com células vazias:`);
Object.entries(camposVaziosPorColuna)
  .sort((a, b) => b[1] - a[1])
  .forEach(([coluna, count]) => {
    console.log(`    - ${coluna}: ${count} células vazias`);
  });

// Mostrar primeiras 5 linhas de dados detalhadas
console.log('\n📋 === Primeiras 5 linhas de dados (detalhado) ===');
for (let i = 0; i < Math.min(5, dataRows.length); i++) {
  const row = dataRows[i];
  console.log(`\nLinha ${i + 1}:`);
  cleanHeaders.forEach((header) => {
    const value = row[header];
    const isEmpty = value === null || value === undefined || value === '' || 
                    (typeof value === 'string' && value.trim() === '');
    const status = isEmpty ? '❌ VAZIO' : '✅';
    console.log(`  ${status} ${header}: ${value === null ? 'null' : value === undefined ? 'undefined' : `"${value}"`} (${typeof value})`);
  });
}

// Verificar formato de números
console.log('\n💰 === Análise de Formato de Números ===');
const camposNumericos = ['Saldo anterior', 'Débito', 'Crédito', 'Saldo atual'];
const exemplosNumericos: Record<string, any[]> = {};

camposNumericos.forEach((campo) => {
  const header = cleanHeaders.find(h => h.toLowerCase().includes(campo.toLowerCase()));
  if (header) {
    const valores = dataRows
      .slice(0, 10)
      .map(row => row[header])
      .filter(v => v !== null && v !== undefined && v !== '');
    
    if (valores.length > 0) {
      exemplosNumericos[header] = valores.slice(0, 3);
    }
  }
});

Object.entries(exemplosNumericos).forEach(([campo, valores]) => {
  console.log(`  ${campo}:`);
  valores.forEach((v, idx) => {
    console.log(`    Exemplo ${idx + 1}: "${v}" (tipo: ${typeof v})`);
  });
});

console.log('\n✅ Análise concluída!');

