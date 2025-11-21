import * as XLSX from 'xlsx';
import type { RelatorioResultado, ContaRelatorio, RelatorioComparativo, ContaComparativa } from '@/types/api';

// Tipo para jsPDF
type JsPDFConstructor = new (options?: {
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm';
  format?: string | number[];
}) => {
  setFontSize: (size: number) => void;
  setFont: (font: string, style?: string) => void;
  text: (text: string | string[], x: number, y: number, options?: { align?: string }) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  setLineWidth: (width: number) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  addPage: () => void;
  save: (filename: string) => void;
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
};

// Importação dinâmica do jsPDF apenas no cliente
const getJsPDF = async (): Promise<JsPDFConstructor | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const jspdf = await import('jspdf');
    // jsPDF é o export default, não uma propriedade
    return (jspdf.default || jspdf) as JsPDFConstructor;
  } catch {
    return null;
  }
};

/**
 * Formata um valor numérico para exibição (moeda brasileira)
 */
const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
};

/**
 * Coleta todas as contas de forma linear (flat) mantendo a hierarquia através da indentação
 */
const coletarContasLinear = (
  contas: ContaRelatorio[] | undefined,
  nivel = 0,
  resultado: Array<{ conta: ContaRelatorio; nivel: number }> = []
): Array<{ conta: ContaRelatorio; nivel: number }> => {
  if (!contas || contas.length === 0) return resultado;

  for (const conta of contas) {
    resultado.push({ conta, nivel });
    if (conta.filhos && conta.filhos.length > 0) {
      coletarContasLinear(conta.filhos, nivel + 1, resultado);
    }
  }

  return resultado;
};

/**
 * Exporta o relatório para Excel
 */
export const exportarParaExcel = (relatorio: RelatorioResultado): void => {
  if (!relatorio || !relatorio.contas || relatorio.contas.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  // Coletar todas as contas de forma linear
  const contasLinear = coletarContasLinear(relatorio.contas);

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Preparar dados da planilha
  type CellValue = string | number;
  const dados: CellValue[][] = [];

  // Cabeçalho
  const cabecalho: CellValue[] = ['CLASSI', 'DESCRI'];
  relatorio.periodo.forEach((p) => {
    cabecalho.push(p.nome);
  });
  cabecalho.push('Total');
  dados.push(cabecalho);

  // Dados das contas
  contasLinear.forEach(({ conta, nivel }) => {
    const linha: CellValue[] = [];

    // CLASSI - com indentação visual baseada no nível
    const indentacao = '  '.repeat(nivel); // 2 espaços por nível
    linha.push(`${indentacao}${conta.classificacao}`);

    // DESCRI - com indentação visual baseada no nível
    linha.push(`${indentacao}${conta.nomeConta}`);

    // Valores dos meses - cada valor em sua própria célula
    relatorio.periodo.forEach((p) => {
      const valor = conta.valores?.[p.mes] || 0;
      linha.push(valor); // Número puro para Excel calcular
    });

    // Total - em sua própria célula
    linha.push(conta.valores?.total || 0);

    dados.push(linha);
  });

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(dados);

  // Ajustar larguras das colunas
  const colWidths: Array<{ wch: number }> = [
    { wch: 15 }, // CLASSI
    { wch: 50 }, // DESCRI
  ];
  relatorio.periodo.forEach(() => {
    colWidths.push({ wch: 15 }); // Cada mês
  });
  colWidths.push({ wch: 15 }); // Total
  ws['!cols'] = colWidths;

  // Formatar células de valores como número com 2 decimais e separador de milhar
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    // Pular cabeçalho (linha 0)
    for (let C = 2; C <= range.e.c; C++) {
      // Começar da coluna C (índice 2) que são os valores
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && typeof cell.v === 'number') {
        // Formatar como número com separador de milhar e 2 decimais
        // Formato brasileiro: #.##0,00
        cell.z = '#,##0.00';
        // Garantir que é número, não texto
        cell.t = 'n'; // tipo numérico
      }
    }
  }

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Resultado Econômico');

  // Gerar nome do arquivo
  const tipoNome = relatorio.tipo === 'FILIAL' ? 'Filial' : 'Consolidado';
  const empresaNome = relatorio.empresaNome.replace(/[^a-zA-Z0-9]/g, '_');
  const ufSufixo = relatorio.uf ? `_${relatorio.uf}` : '';
  const nomeArquivo = `DRE_${tipoNome}_${empresaNome}${ufSufixo}_${relatorio.ano}.xlsx`;

  // Salvar arquivo
  XLSX.writeFile(wb, nomeArquivo);
};

/**
 * Exporta o relatório para PDF
 */
export const exportarParaPDF = async (relatorio: RelatorioResultado): Promise<void> => {
  if (!relatorio || !relatorio.contas || relatorio.contas.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  const JsPDF = await getJsPDF();
  if (!JsPDF) {
    alert('Exportação PDF não disponível.');
    return;
  }

  // Criar documento PDF
  const doc = new JsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Configurações
  const marginLeft = 10;
  const marginTop = 15;
  const marginRight = 10;
  const marginBottom = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPos = marginTop;
  const lineHeight = 6;
  const smallFontSize = 8;

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titulo = `RESULTADO ECONÔMICO ${relatorio.tipo === 'FILIAL' ? relatorio.empresaNome.toUpperCase() : 'CONSOLIDADO'}${relatorio.uf ? ` - ${relatorio.uf}` : ''} ${relatorio.ano}`;
  doc.text(titulo, marginLeft, yPos);
  yPos += lineHeight * 1.5;

  // Coletar todas as contas de forma linear
  const contasLinear = coletarContasLinear(relatorio.contas);

  // Calcular larguras das colunas
  const colClassi = 25;
  const colDescri = 80;
  const colValor = 20;

  // Cabeçalho da tabela
  doc.setFontSize(smallFontSize);
  doc.setFont('helvetica', 'bold');
  let xPos = marginLeft;
  doc.text('CLASSI', xPos, yPos);
  xPos += colClassi;
  doc.text('DESCRI', xPos, yPos);
  xPos += colDescri;

  relatorio.periodo.forEach((p) => {
    doc.text(p.nome, xPos, yPos);
    xPos += colValor;
  });

  doc.text('Total', xPos, yPos);
  yPos += lineHeight;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += lineHeight * 0.5;

  // Dados das contas
  doc.setFontSize(smallFontSize);
  doc.setFont('helvetica', 'normal');

  contasLinear.forEach(({ conta, nivel }) => {
    // Verificar se precisa de nova página
    if (yPos > pageHeight - marginBottom - lineHeight * 2) {
      doc.addPage();
      yPos = marginTop;
    }

    xPos = marginLeft;

    // CLASSI - com indentação baseada no nível
    const indentacao = nivel * 3; // 3mm por nível
    doc.text(`${conta.classificacao}`, xPos + indentacao, yPos);
    xPos += colClassi;

    // DESCRI - com indentação baseada no nível
    const descricao = doc.splitTextToSize(conta.nomeConta, colDescri - indentacao);
    doc.text(descricao, xPos + indentacao, yPos);
    xPos += colDescri;

    // Valores dos meses
    relatorio.periodo.forEach((p) => {
      const valor = conta.valores?.[p.mes] || 0;
      const valorFormatado = formatarValor(valor);
      doc.text(valorFormatado, xPos, yPos, { align: 'right' });
      xPos += colValor;
    });

    // Total
    const totalFormatado = formatarValor(conta.valores?.total || 0);
    doc.text(totalFormatado, xPos, yPos, { align: 'right' });

    yPos += lineHeight * Math.max(1, descricao.length);
  });

  // Gerar nome do arquivo
  const tipoNome = relatorio.tipo === 'FILIAL' ? 'Filial' : 'Consolidado';
  const empresaNome = relatorio.empresaNome.replace(/[^a-zA-Z0-9]/g, '_');
  const ufSufixo = relatorio.uf ? `_${relatorio.uf}` : '';
  const nomeArquivo = `DRE_${tipoNome}_${empresaNome}${ufSufixo}_${relatorio.ano}.pdf`;

  // Salvar arquivo
  doc.save(nomeArquivo);
};

/**
 * Coleta todas as contas comparativas de forma linear (flat) mantendo a hierarquia através da indentação
 */
const coletarContasComparativasLinear = (
  contas: ContaComparativa[] | undefined,
  nivel = 0,
  resultado: Array<{ conta: ContaComparativa; nivel: number }> = []
): Array<{ conta: ContaComparativa; nivel: number }> => {
  if (!contas || contas.length === 0) return resultado;

  for (const conta of contas) {
    resultado.push({ conta, nivel });
    if (conta.filhos && conta.filhos.length > 0) {
      coletarContasComparativasLinear(conta.filhos, nivel + 1, resultado);
    }
  }

  return resultado;
};

/**
 * Exporta o relatório comparativo para Excel
 */
export const exportarComparativoParaExcel = (relatorio: RelatorioComparativo): void => {
  if (!relatorio || !relatorio.contas || relatorio.contas.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  // Coletar todas as contas de forma linear
  const contasLinear = coletarContasComparativasLinear(relatorio.contas);

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Preparar dados da planilha
  type CellValue = string | number;
  const dados: CellValue[][] = [];

  // Cabeçalho
  const cabecalho: CellValue[] = ['CLASSI', 'DESCRI', relatorio.periodo1.label, relatorio.periodo2.label, 'Diferença', 'Variação %'];
  dados.push(cabecalho);

  // Dados das contas
  contasLinear.forEach(({ conta, nivel }) => {
    const linha: CellValue[] = [];

    // CLASSI - com indentação visual baseada no nível
    const indentacao = '  '.repeat(nivel); // 2 espaços por nível
    linha.push(`${indentacao}${conta.classificacao}`);

    // DESCRI - com indentação visual baseada no nível
    linha.push(`${indentacao}${conta.nomeConta}`);

    // Período 1
    linha.push(conta.valorPeriodo1);

    // Período 2
    linha.push(conta.valorPeriodo2);

    // Diferença
    linha.push(conta.diferenca);

    // Variação %
    linha.push(conta.percentual / 100); // Converter para decimal (ex: 20% = 0.20)

    dados.push(linha);
  });

  // Linha de totais
  const linhaTotais: CellValue[] = [
    'TOTAL',
    'TOTAL GERAL',
    relatorio.totais.periodo1,
    relatorio.totais.periodo2,
    relatorio.totais.diferenca,
    relatorio.totais.percentual / 100,
  ];
  dados.push(linhaTotais);

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(dados);

  // Ajustar larguras das colunas
  const colWidths: Array<{ wch: number }> = [
    { wch: 15 }, // CLASSI
    { wch: 50 }, // DESCRI
    { wch: 18 }, // Período 1
    { wch: 18 }, // Período 2
    { wch: 18 }, // Diferença
    { wch: 15 }, // Variação %
  ];
  ws['!cols'] = colWidths;

  // Formatar células de valores como número com 2 decimais e separador de milhar
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    // Pular cabeçalho (linha 0)
    // Colunas C, D, E (índices 2, 3, 4) - Período 1, Período 2, Diferença - valores monetários
    for (let C = 2; C <= 4; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && typeof cell.v === 'number') {
        cell.z = '#,##0.00';
        cell.t = 'n';
      }
    }
    // Coluna F (índice 5) - Variação % - formato percentual
    const cellPercentual = XLSX.utils.encode_cell({ r: R, c: 5 });
    const cellP = ws[cellPercentual];
    if (cellP && typeof cellP.v === 'number') {
      cellP.z = '0.00%';
      cellP.t = 'n';
    }
  }

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Comparativo');

  // Gerar nome do arquivo
  const tipoNome = relatorio.tipo === 'FILIAL' ? 'Filial' : 'Consolidado';
  const empresaNome = relatorio.empresaNome.replace(/[^a-zA-Z0-9]/g, '_');
  const ufSufixo = relatorio.uf ? `_${relatorio.uf}` : '';
  const periodo1Str = relatorio.periodo1.label.replace(/\//g, '_');
  const periodo2Str = relatorio.periodo2.label.replace(/\//g, '_');
  const nomeArquivo = `Comparativo_${tipoNome}_${empresaNome}${ufSufixo}_${periodo1Str}_vs_${periodo2Str}.xlsx`;

  // Salvar arquivo
  XLSX.writeFile(wb, nomeArquivo);
};

/**
 * Exporta o relatório comparativo para PDF
 */
export const exportarComparativoParaPDF = async (relatorio: RelatorioComparativo): Promise<void> => {
  if (!relatorio || !relatorio.contas || relatorio.contas.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  const JsPDF = await getJsPDF();
  if (!JsPDF) {
    alert('Exportação PDF não disponível.');
    return;
  }

  // Criar documento PDF
  const doc = new JsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Configurações
  const marginLeft = 10;
  const marginTop = 15;
  const marginRight = 10;
  const marginBottom = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPos = marginTop;
  const lineHeight = 6;
  const smallFontSize = 8;

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titulo = `RELATÓRIO COMPARATIVO ${relatorio.tipo === 'FILIAL' ? relatorio.empresaNome.toUpperCase() : 'CONSOLIDADO'}${relatorio.uf ? ` - ${relatorio.uf}` : ''}`;
  doc.text(titulo, marginLeft, yPos);
  yPos += lineHeight;

  // Subtítulo com períodos
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const subtitulo = `${relatorio.periodo1.label} vs ${relatorio.periodo2.label}`;
  doc.text(subtitulo, marginLeft, yPos);
  yPos += lineHeight * 1.5;

  // Coletar todas as contas de forma linear
  const contasLinear = coletarContasComparativasLinear(relatorio.contas);

  // Calcular larguras das colunas
  const colClassi = 25;
  const colDescri = 70;
  const colValor = 20;
  const colDiferenca = 20;

  // Cabeçalho da tabela
  doc.setFontSize(smallFontSize);
  doc.setFont('helvetica', 'bold');
  let xPos = marginLeft;
  doc.text('CLASSI', xPos, yPos);
  xPos += colClassi;
  doc.text('DESCRI', xPos, yPos);
  xPos += colDescri;
  doc.text(relatorio.periodo1.label, xPos, yPos);
  xPos += colValor;
  doc.text(relatorio.periodo2.label, xPos, yPos);
  xPos += colValor;
  doc.text('Diferença', xPos, yPos);
  xPos += colDiferenca;
  doc.text('Var. %', xPos, yPos);
  yPos += lineHeight;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += lineHeight * 0.5;

  // Dados das contas
  doc.setFontSize(smallFontSize);
  doc.setFont('helvetica', 'normal');

  contasLinear.forEach(({ conta, nivel }) => {
    // Verificar se precisa de nova página
    if (yPos > pageHeight - marginBottom - lineHeight * 2) {
      doc.addPage();
      yPos = marginTop;
    }

    xPos = marginLeft;

    // CLASSI - com indentação baseada no nível
    const indentacao = nivel * 3; // 3mm por nível
    doc.text(`${conta.classificacao}`, xPos + indentacao, yPos);
    xPos += colClassi;

    // DESCRI - com indentação baseada no nível
    const descricao = doc.splitTextToSize(conta.nomeConta, colDescri - indentacao);
    doc.text(descricao, xPos + indentacao, yPos);
    xPos += colDescri;

    // Período 1
    const valor1Formatado = formatarValor(conta.valorPeriodo1);
    doc.text(valor1Formatado, xPos, yPos, { align: 'right' });
    xPos += colValor;

    // Período 2
    const valor2Formatado = formatarValor(conta.valorPeriodo2);
    doc.text(valor2Formatado, xPos, yPos, { align: 'right' });
    xPos += colValor;

    // Diferença
    const diferencaFormatada = formatarValor(conta.diferenca);
    doc.text(diferencaFormatada, xPos, yPos, { align: 'right' });
    xPos += colDiferenca;

    // Variação %
    const percentualFormatado = `${conta.percentual >= 0 ? '+' : ''}${conta.percentual.toFixed(2)}%`;
    doc.text(percentualFormatado, xPos, yPos, { align: 'right' });

    yPos += lineHeight * Math.max(1, descricao.length);
  });

  // Linha de totais
  if (yPos > pageHeight - marginBottom - lineHeight * 3) {
    doc.addPage();
    yPos = marginTop;
  }

  // Linha separadora antes dos totais
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += lineHeight * 0.5;

  doc.setFont('helvetica', 'bold');
  xPos = marginLeft;
  doc.text('TOTAL', xPos, yPos);
  xPos += colClassi;
  doc.text('TOTAL GERAL', xPos, yPos);
  xPos += colDescri;
  doc.text(formatarValor(relatorio.totais.periodo1), xPos, yPos, { align: 'right' });
  xPos += colValor;
  doc.text(formatarValor(relatorio.totais.periodo2), xPos, yPos, { align: 'right' });
  xPos += colValor;
  doc.text(formatarValor(relatorio.totais.diferenca), xPos, yPos, { align: 'right' });
  xPos += colDiferenca;
  const totalPercentualFormatado = `${relatorio.totais.percentual >= 0 ? '+' : ''}${relatorio.totais.percentual.toFixed(2)}%`;
  doc.text(totalPercentualFormatado, xPos, yPos, { align: 'right' });

  // Gerar nome do arquivo
  const tipoNome = relatorio.tipo === 'FILIAL' ? 'Filial' : 'Consolidado';
  const empresaNome = relatorio.empresaNome.replace(/[^a-zA-Z0-9]/g, '_');
  const ufSufixo = relatorio.uf ? `_${relatorio.uf}` : '';
  const periodo1Str = relatorio.periodo1.label.replace(/\//g, '_');
  const periodo2Str = relatorio.periodo2.label.replace(/\//g, '_');
  const nomeArquivo = `Comparativo_${tipoNome}_${empresaNome}${ufSufixo}_${periodo1Str}_vs_${periodo2Str}.pdf`;

  // Salvar arquivo
  doc.save(nomeArquivo);
};

