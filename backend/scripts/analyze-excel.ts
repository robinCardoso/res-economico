import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../../Balancete MATRIZ 01 JAN 2025.xls');

if (!fs.existsSync(filePath)) {
  console.error('Arquivo não encontrado:', filePath);
  process.exit(1);
}

console.log('Lendo arquivo Excel...');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log(`\nAba: ${sheetName}`);
console.log(`Total de linhas: ${worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']!).e.r + 1 : 0}`);

// Ler como array de arrays
const rawData = XLSX.utils.sheet_to_json(worksheet, {
  raw: false,
  defval: null,
  header: 1,
}) as any[][];

console.log(`\nTotal de linhas lidas: ${rawData.length}`);

// Mostrar primeiras 10 linhas
console.log('\n=== Primeiras 10 linhas ===');
for (let i = 0; i < Math.min(10, rawData.length); i++) {
  console.log(`Linha ${i + 1}:`, JSON.stringify(rawData[i]));
}

// Encontrar linha de cabeçalho
console.log('\n=== Procurando linha de cabeçalho ===');
let headerRowIndex = -1;
for (let i = 0; i < Math.min(10, rawData.length); i++) {
  const row = rawData[i];
  if (Array.isArray(row)) {
    const textCells = row.filter((cell: any) => {
      if (cell === null || cell === undefined || cell === '') return false;
      const str = String(cell).trim();
      return isNaN(Number(str)) && str.length > 2;
    });
    console.log(`Linha ${i + 1}: ${textCells.length} células de texto - ${JSON.stringify(textCells.slice(0, 5))}`);
    if (textCells.length >= 3 && headerRowIndex === -1) {
      headerRowIndex = i;
      console.log(`  -> Cabeçalho detectado na linha ${i + 1}`);
    }
  }
}

if (headerRowIndex >= 0) {
  const headers = rawData[headerRowIndex];
  console.log('\n=== Cabeçalhos detectados ===');
  headers.forEach((h, idx) => {
    console.log(`Coluna ${idx + 1}: "${h}"`);
  });

  // Mostrar primeira linha de dados
  if (rawData.length > headerRowIndex + 1) {
    console.log('\n=== Primeira linha de dados ===');
    const firstDataRow = rawData[headerRowIndex + 1];
    headers.forEach((header, idx) => {
      const value = firstDataRow[idx];
      console.log(`${header}: ${value} (tipo: ${typeof value})`);
    });
  }
}

// Tentar ler como objeto (método antigo)
console.log('\n=== Método antigo (sheet_to_json sem header:1) ===');
const oldMethod = XLSX.utils.sheet_to_json(worksheet, {
  raw: false,
  defval: '',
});
if (oldMethod.length > 0) {
  console.log('Primeira linha:', JSON.stringify(oldMethod[0]));
  console.log('Chaves:', Object.keys(oldMethod[0] as any));
}

