import * as XLSX from 'xlsx';
import type {
  CrescimentoEmpresaResponse,
  CrescimentoFilialResponse,
  CrescimentoMarcaResponse,
  CrescimentoAssociadoResponse,
  FilialAssociadoResponse,
} from '@/services/vendas.service';

// Tipo para células de dados do Excel (pode ser string, número ou null)
type ExcelCellValue = string | number | null;
type ExcelRow = ExcelCellValue[];

/**
 * Formata valor monetário para exibição
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata evolução percentual
 */
function formatEvolucao(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Exporta dados de Crescimento Empresa para Excel
 */
export function exportCrescimentoEmpresaExcel(
  data: CrescimentoEmpresaResponse,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();
  const dados: ExcelRow[] = [];

  // Cabeçalho
  const header = ['Mês'];
  data.anosDisponiveis.forEach((ano) => {
    header.push(`${ano} - Venda`);
    header.push(`${ano} - Evolução %`);
  });
  dados.push(header);

  // Dados dos meses
  data.meses.forEach((mes) => {
    const linha: ExcelRow = [mes.nomeMes];
    data.anosDisponiveis.forEach((ano) => {
      const dadosAno = mes.dados[ano];
      linha.push(dadosAno?.venda || 0);
      linha.push(dadosAno?.evolucao ?? null);
    });
    dados.push(linha);
  });

  // Linha de total geral
  const linhaTotal: ExcelRow = ['TOTAL GERAL'];
  data.anosDisponiveis.forEach((ano) => {
    const totalAno = data.totalGeral[ano];
    linhaTotal.push(totalAno?.venda || 0);
    linhaTotal.push(totalAno?.evolucao ?? null);
  });
  dados.push(linhaTotal);

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(dados);

  // Ajustar larguras das colunas
  const colWidths: Array<{ wch: number }> = [{ wch: 15 }]; // Mês
  data.anosDisponiveis.forEach(() => {
    colWidths.push({ wch: 18 }); // Venda
    colWidths.push({ wch: 15 }); // Evolução %
  });
  ws['!cols'] = colWidths;

  // Formatar células
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    // Para cada ano, formatar coluna de venda (índices ímpares) e evolução (índices pares)
    data.anosDisponiveis.forEach((_, indexAno) => {
      const colVenda = 1 + indexAno * 2 + 1; // Coluna de venda
      const colEvolucao = colVenda + 1; // Coluna de evolução

      // Formatar venda como moeda
      const cellVenda = XLSX.utils.encode_cell({ r: R, c: colVenda });
      if (ws[cellVenda] && typeof ws[cellVenda].v === 'number') {
        ws[cellVenda].z = '#,##0.00';
        ws[cellVenda].t = 'n';
      }

      // Formatar evolução como percentual
      const cellEvolucao = XLSX.utils.encode_cell({ r: R, c: colEvolucao });
      if (ws[cellEvolucao] && ws[cellEvolucao].v !== null) {
        if (typeof ws[cellEvolucao].v === 'number') {
          ws[cellEvolucao].z = '0.00%';
          ws[cellEvolucao].t = 'n';
        }
      }
    });
  }

  XLSX.utils.book_append_sheet(workbook, ws, 'Crescimento Empresa');

  // Salvar arquivo
  const nomeArquivo = filename || `crescimento-empresa_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
}

/**
 * Exporta dados de Crescimento Empresa para CSV
 */
export function exportCrescimentoEmpresaCSV(
  data: CrescimentoEmpresaResponse,
  filename?: string
): void {
  const linhas: string[] = [];

  // Cabeçalho
  const header = ['Mês'];
  data.anosDisponiveis.forEach((ano) => {
    header.push(`${ano} - Venda`);
    header.push(`${ano} - Evolução %`);
  });
  linhas.push(header.map((h) => `"${h}"`).join(';'));

  // Dados dos meses
  data.meses.forEach((mes) => {
    const linha: string[] = [mes.nomeMes];
    data.anosDisponiveis.forEach((ano) => {
      const dadosAno = mes.dados[ano];
      linha.push(formatCurrency(dadosAno?.venda || 0));
      linha.push(formatEvolucao(dadosAno?.evolucao));
    });
    linhas.push(linha.map((v) => `"${v}"`).join(';'));
  });

  // Linha de total geral
  const linhaTotal: string[] = ['TOTAL GERAL'];
  data.anosDisponiveis.forEach((ano) => {
    const totalAno = data.totalGeral[ano];
    linhaTotal.push(formatCurrency(totalAno?.venda || 0));
    linhaTotal.push(formatEvolucao(totalAno?.evolucao));
  });
  linhas.push(linhaTotal.map((v) => `"${v}"`).join(';'));

  // Criar blob e fazer download
  const csvContent = '\ufeff' + linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `crescimento-empresa_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta dados de Crescimento Filial para Excel
 */
export function exportCrescimentoFilialExcel(
  data: CrescimentoFilialResponse,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();
  const dados: ExcelRow[] = [];

  // Cabeçalho
  const header = ['Filial (UF)'];
  data.anosDisponiveis.forEach((ano) => {
    header.push(`${ano} - Vendas`);
    header.push(`${ano} - Evolução %`);
  });
  dados.push(header);

  // Dados das filiais
  data.filiais.forEach((filial) => {
    const linha: ExcelRow = [filial.uf];
    data.anosDisponiveis.forEach((ano) => {
      const dadosAno = filial.dados[ano];
      linha.push(dadosAno?.vendas || 0);
      linha.push(dadosAno?.evolucao ?? null);
    });
    dados.push(linha);
  });

  // Linha de total geral
  const linhaTotal: ExcelRow = ['TOTAL GERAL'];
  data.anosDisponiveis.forEach((ano) => {
    const totalAno = data.totalGeral[ano];
    linhaTotal.push(totalAno?.vendas || 0);
    linhaTotal.push(totalAno?.evolucao ?? null);
  });
  dados.push(linhaTotal);

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(dados);

  // Ajustar larguras das colunas
  const colWidths: Array<{ wch: number }> = [{ wch: 15 }]; // Filial
  data.anosDisponiveis.forEach(() => {
    colWidths.push({ wch: 18 }); // Vendas
    colWidths.push({ wch: 15 }); // Evolução %
  });
  ws['!cols'] = colWidths;

  // Formatar células
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    data.anosDisponiveis.forEach((_, indexAno) => {
      const colVenda = 1 + indexAno * 2 + 1;
      const colEvolucao = colVenda + 1;

      const cellVenda = XLSX.utils.encode_cell({ r: R, c: colVenda });
      if (ws[cellVenda] && typeof ws[cellVenda].v === 'number') {
        ws[cellVenda].z = '#,##0.00';
        ws[cellVenda].t = 'n';
      }

      const cellEvolucao = XLSX.utils.encode_cell({ r: R, c: colEvolucao });
      if (ws[cellEvolucao] && ws[cellEvolucao].v !== null) {
        if (typeof ws[cellEvolucao].v === 'number') {
          ws[cellEvolucao].z = '0.00%';
          ws[cellEvolucao].t = 'n';
        }
      }
    });
  }

  XLSX.utils.book_append_sheet(workbook, ws, 'Crescimento Filial');

  const nomeArquivo = filename || `crescimento-filial_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
}

/**
 * Exporta dados de Crescimento Filial para CSV
 */
export function exportCrescimentoFilialCSV(
  data: CrescimentoFilialResponse,
  filename?: string
): void {
  const linhas: string[] = [];

  const header = ['Filial (UF)'];
  data.anosDisponiveis.forEach((ano) => {
    header.push(`${ano} - Vendas`);
    header.push(`${ano} - Evolução %`);
  });
  linhas.push(header.map((h) => `"${h}"`).join(';'));

  data.filiais.forEach((filial) => {
    const linha: string[] = [filial.uf];
    data.anosDisponiveis.forEach((ano) => {
      const dadosAno = filial.dados[ano];
      linha.push(formatCurrency(dadosAno?.vendas || 0));
      linha.push(formatEvolucao(dadosAno?.evolucao));
    });
    linhas.push(linha.map((v) => `"${v}"`).join(';'));
  });

  const linhaTotal: string[] = ['TOTAL GERAL'];
  data.anosDisponiveis.forEach((ano) => {
    const totalAno = data.totalGeral[ano];
    linhaTotal.push(formatCurrency(totalAno?.vendas || 0));
    linhaTotal.push(formatEvolucao(totalAno?.evolucao));
  });
  linhas.push(linhaTotal.map((v) => `"${v}"`).join(';'));

  const csvContent = '\ufeff' + linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `crescimento-filial_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta dados de Crescimento Marca para Excel
 */
export function exportCrescimentoMarcaExcel(
  data: CrescimentoMarcaResponse,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();
  const dados: ExcelRow[] = [];

  const header = ['Marca'];
  data.anosDisponiveis.forEach((ano) => {
    header.push(`${ano} - Venda`);
    header.push(`${ano} - Evolução %`);
  });
  dados.push(header);

  data.marcas.forEach((marca) => {
    const linha: ExcelRow = [marca.marca];
    data.anosDisponiveis.forEach((ano) => {
      const dadosAno = marca.dados[ano];
      linha.push(dadosAno?.venda || 0);
      linha.push(dadosAno?.evolucao ?? null);
    });
    dados.push(linha);
  });

  const linhaTotal: ExcelRow = ['TOTAL GERAL'];
  data.anosDisponiveis.forEach((ano) => {
    const totalAno = data.totalGeral[ano];
    linhaTotal.push(totalAno?.venda || 0);
    linhaTotal.push(totalAno?.evolucao ?? null);
  });
  dados.push(linhaTotal);

  const ws = XLSX.utils.aoa_to_sheet(dados);

  const colWidths: Array<{ wch: number }> = [{ wch: 20 }]; // Marca
  data.anosDisponiveis.forEach(() => {
    colWidths.push({ wch: 18 }); // Venda
    colWidths.push({ wch: 15 }); // Evolução %
  });
  ws['!cols'] = colWidths;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    data.anosDisponiveis.forEach((_, indexAno) => {
      const colVenda = 1 + indexAno * 2 + 1;
      const colEvolucao = colVenda + 1;

      const cellVenda = XLSX.utils.encode_cell({ r: R, c: colVenda });
      if (ws[cellVenda] && typeof ws[cellVenda].v === 'number') {
        ws[cellVenda].z = '#,##0.00';
        ws[cellVenda].t = 'n';
      }

      const cellEvolucao = XLSX.utils.encode_cell({ r: R, c: colEvolucao });
      if (ws[cellEvolucao] && ws[cellEvolucao].v !== null) {
        if (typeof ws[cellEvolucao].v === 'number') {
          ws[cellEvolucao].z = '0.00%';
          ws[cellEvolucao].t = 'n';
        }
      }
    });
  }

  XLSX.utils.book_append_sheet(workbook, ws, 'Crescimento Marca');

  const nomeArquivo = filename || `crescimento-marca_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
}

/**
 * Exporta dados de Crescimento Marca para CSV
 */
export function exportCrescimentoMarcaCSV(
  data: CrescimentoMarcaResponse,
  filename?: string
): void {
  const linhas: string[] = [];

  const header = ['Marca'];
  data.anosDisponiveis.forEach((ano) => {
    header.push(`${ano} - Venda`);
    header.push(`${ano} - Evolução %`);
  });
  linhas.push(header.map((h) => `"${h}"`).join(';'));

  data.marcas.forEach((marca) => {
    const linha: string[] = [marca.marca];
    data.anosDisponiveis.forEach((ano) => {
      const dadosAno = marca.dados[ano];
      linha.push(formatCurrency(dadosAno?.venda || 0));
      linha.push(formatEvolucao(dadosAno?.evolucao));
    });
    linhas.push(linha.map((v) => `"${v}"`).join(';'));
  });

  const linhaTotal: string[] = ['TOTAL GERAL'];
  data.anosDisponiveis.forEach((ano) => {
    const totalAno = data.totalGeral[ano];
    linhaTotal.push(formatCurrency(totalAno?.venda || 0));
    linhaTotal.push(formatEvolucao(totalAno?.evolucao));
  });
  linhas.push(linhaTotal.map((v) => `"${v}"`).join(';'));

  const csvContent = '\ufeff' + linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `crescimento-marca_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta dados de Crescimento Associado para Excel
 */
export function exportCrescimentoAssociadoExcel(
  data: CrescimentoAssociadoResponse,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();
  const dados: ExcelRow[] = [];

  const header = ['Nome Fantasia (Associado)'];
  data.anosDisponiveis.forEach((ano) => {
    header.push(`${ano} - Venda`);
    header.push(`${ano} - Evolução %`);
  });
  dados.push(header);

  data.associados.forEach((associado) => {
    const linha: ExcelRow = [associado.nomeFantasia];
    data.anosDisponiveis.forEach((ano) => {
      const dadosAno = associado.dados[ano];
      linha.push(dadosAno?.venda || 0);
      linha.push(dadosAno?.evolucao ?? null);
    });
    dados.push(linha);
  });

  const linhaTotal: ExcelRow = ['TOTAL GERAL'];
  data.anosDisponiveis.forEach((ano) => {
    const totalAno = data.totalGeral[ano];
    linhaTotal.push(totalAno?.venda || 0);
    linhaTotal.push(totalAno?.evolucao ?? null);
  });
  dados.push(linhaTotal);

  const ws = XLSX.utils.aoa_to_sheet(dados);

  const colWidths: Array<{ wch: number }> = [{ wch: 30 }]; // Nome Fantasia
  data.anosDisponiveis.forEach(() => {
    colWidths.push({ wch: 18 }); // Venda
    colWidths.push({ wch: 15 }); // Evolução %
  });
  ws['!cols'] = colWidths;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    data.anosDisponiveis.forEach((_, indexAno) => {
      const colVenda = 1 + indexAno * 2 + 1;
      const colEvolucao = colVenda + 1;

      const cellVenda = XLSX.utils.encode_cell({ r: R, c: colVenda });
      if (ws[cellVenda] && typeof ws[cellVenda].v === 'number') {
        ws[cellVenda].z = '#,##0.00';
        ws[cellVenda].t = 'n';
      }

      const cellEvolucao = XLSX.utils.encode_cell({ r: R, c: colEvolucao });
      if (ws[cellEvolucao] && ws[cellEvolucao].v !== null) {
        if (typeof ws[cellEvolucao].v === 'number') {
          ws[cellEvolucao].z = '0.00%';
          ws[cellEvolucao].t = 'n';
        }
      }
    });
  }

  XLSX.utils.book_append_sheet(workbook, ws, 'Crescimento Associado');

  const nomeArquivo = filename || `crescimento-associado_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
}

/**
 * Exporta dados de Crescimento Associado para CSV
 */
export function exportCrescimentoAssociadoCSV(
  data: CrescimentoAssociadoResponse,
  filename?: string
): void {
  const linhas: string[] = [];

  const header = ['Nome Fantasia (Associado)'];
  data.anosDisponiveis.forEach((ano) => {
    header.push(`${ano} - Venda`);
    header.push(`${ano} - Evolução %`);
  });
  linhas.push(header.map((h) => `"${h}"`).join(';'));

  data.associados.forEach((associado) => {
    const linha: string[] = [associado.nomeFantasia];
    data.anosDisponiveis.forEach((ano) => {
      const dadosAno = associado.dados[ano];
      linha.push(formatCurrency(dadosAno?.venda || 0));
      linha.push(formatEvolucao(dadosAno?.evolucao));
    });
    linhas.push(linha.map((v) => `"${v}"`).join(';'));
  });

  const linhaTotal: string[] = ['TOTAL GERAL'];
  data.anosDisponiveis.forEach((ano) => {
    const totalAno = data.totalGeral[ano];
    linhaTotal.push(formatCurrency(totalAno?.venda || 0));
    linhaTotal.push(formatEvolucao(totalAno?.evolucao));
  });
  linhas.push(linhaTotal.map((v) => `"${v}"`).join(';'));

  const csvContent = '\ufeff' + linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `crescimento-associado_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta dados de Filial/Associado para Excel
 */
export function exportFilialAssociadoExcel(
  data: FilialAssociadoResponse,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();
  const dados: ExcelRow[] = [];

  // Cabeçalho
  const header = ['UF-DESTINC.', 'Nome Fantasia'];
  data.mesesDisponiveis.forEach((mes) => {
    header.push(`Mês ${mes}`);
  });
  header.push('Total Geral');
  dados.push(header);

  // Dados por UF e Associado
  data.ufs.forEach((ufData) => {
    // Linhas de associados
    ufData.associados.forEach((associado) => {
      const linha: ExcelRow = [ufData.uf, associado.nomeFantasia];
      data.mesesDisponiveis.forEach((mes) => {
        linha.push(associado.monthlySales[mes] || 0);
      });
      linha.push(associado.totalGeral);
      dados.push(linha);
    });

    // Linha de subtotal da UF
    const linhaSubtotal: ExcelRow = [`${ufData.uf} Total`, ''];
    data.mesesDisponiveis.forEach((mes) => {
      linhaSubtotal.push(ufData.monthlyTotals[mes] || 0);
    });
    linhaSubtotal.push(ufData.totalGeral);
    dados.push(linhaSubtotal);
  });

  // Linha de total geral
  const linhaTotal: ExcelRow = ['Total Geral', ''];
  data.mesesDisponiveis.forEach((mes) => {
    linhaTotal.push(data.totalGeral[mes] || 0);
  });
  linhaTotal.push(data.totalGeral.total);
  dados.push(linhaTotal);

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(dados);

  // Ajustar larguras das colunas
  const colWidths: Array<{ wch: number }> = [
    { wch: 15 }, // UF
    { wch: 30 }, // Nome Fantasia
  ];
  data.mesesDisponiveis.forEach(() => {
    colWidths.push({ wch: 18 }); // Mês
  });
  colWidths.push({ wch: 18 }); // Total Geral
  ws['!cols'] = colWidths;

  // Formatar células monetárias
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    // Formatar colunas de meses e total (a partir da coluna 3)
    for (let C = 2; C <= range.e.c; C++) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws[cell] && typeof ws[cell].v === 'number') {
        ws[cell].z = '#,##0.00';
        ws[cell].t = 'n';
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, ws, 'Filial/Associado');

  const nomeArquivo = filename || `filial-associado_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
}

/**
 * Exporta dados de Filial/Associado para CSV
 */
export function exportFilialAssociadoCSV(
  data: FilialAssociadoResponse,
  filename?: string
): void {
  const linhas: string[] = [];

  // Cabeçalho
  const header = ['UF-DESTINC.', 'Nome Fantasia'];
  data.mesesDisponiveis.forEach((mes) => {
    header.push(`Mês ${mes}`);
  });
  header.push('Total Geral');
  linhas.push(header.map((h) => `"${h}"`).join(';'));

  // Dados por UF e Associado
  data.ufs.forEach((ufData) => {
    // Linhas de associados
    ufData.associados.forEach((associado) => {
      const linha: string[] = [ufData.uf, associado.nomeFantasia];
      data.mesesDisponiveis.forEach((mes) => {
        linha.push(formatCurrency(associado.monthlySales[mes] || 0));
      });
      linha.push(formatCurrency(associado.totalGeral));
      linhas.push(linha.map((v) => `"${v}"`).join(';'));
    });

    // Linha de subtotal da UF
    const linhaSubtotal: string[] = [`${ufData.uf} Total`, ''];
    data.mesesDisponiveis.forEach((mes) => {
      linhaSubtotal.push(formatCurrency(ufData.monthlyTotals[mes] || 0));
    });
    linhaSubtotal.push(formatCurrency(ufData.totalGeral));
    linhas.push(linhaSubtotal.map((v) => `"${v}"`).join(';'));
  });

  // Linha de total geral
  const linhaTotal: string[] = ['Total Geral', ''];
  data.mesesDisponiveis.forEach((mes) => {
    linhaTotal.push(formatCurrency(data.totalGeral[mes] || 0));
  });
  linhaTotal.push(formatCurrency(data.totalGeral.total));
  linhas.push(linhaTotal.map((v) => `"${v}"`).join(';'));

  const csvContent = '\ufeff' + linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `filial-associado_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
