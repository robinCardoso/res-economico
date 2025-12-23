import { Injectable } from '@nestjs/common';

export interface ColumnMapping {
  numeroPedido?: string;
  data?: string;
  idDoc?: string;
  idProd?: string;
  referencia?: string;
  descricaoProduto?: string;
  qtd?: string;
  valorUnit?: string;
  valorTotal?: string;
  nomeFantasia?: string;
}

@Injectable()
export class ColumnMapperService {
  /**
   * Mapeia nomes de colunas do Excel para campos internos
   * Suporta variações comuns de nomes
   */
  mapColumns(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};

    headers.forEach((header, index) => {
      if (!header) return;

      const normalized = header.toString().trim().toUpperCase();

      // NUMERO_PEDIDO
      if (
        normalized.includes('NUMERO_PEDIDO') ||
        normalized.includes('NÚMERO PEDIDO') ||
        normalized.includes('NUMERO PEDIDO') ||
        normalized.includes('NUM_PEDIDO') ||
        normalized.includes('NÚM PEDIDO') ||
        normalized.includes('NUM PEDIDO') ||
        normalized.includes('PEDIDO') ||
        normalized === 'PEDIDO'
      ) {
        mapping.numeroPedido = headers[index];
      }

      // DATA
      if (
        normalized.includes('DATA') ||
        normalized.includes('DATE') ||
        normalized.includes('DT')
      ) {
        mapping.data = headers[index];
      }

      // ID_DOC
      if (
        normalized.includes('ID_DOC') ||
        normalized.includes('ID DOC') ||
        normalized.includes('IDDOC') ||
        normalized.includes('DOCUMENTO')
      ) {
        mapping.idDoc = headers[index];
      }

      // ID_PROD
      if (
        normalized.includes('ID_PROD') ||
        normalized.includes('ID PROD') ||
        normalized.includes('IDPROD') ||
        (normalized.includes('ID') && normalized.includes('PROD'))
      ) {
        mapping.idProd = headers[index];
      }

      // REFERENCIA
      if (
        normalized.includes('REFERENCIA') ||
        normalized.includes('REFERÊNCIA') ||
        normalized.includes('REF') ||
        normalized.includes('CODIGO PRODUTO') ||
        normalized.includes('CÓDIGO PRODUTO')
      ) {
        mapping.referencia = headers[index];
      }

      // DESCRICAO_PRODUTO
      if (
        normalized.includes('DESCRICAO_PRODUTO') ||
        normalized.includes('DESCRIÇÃO PRODUTO') ||
        normalized.includes('DESCRICAO PRODUTO') ||
        normalized.includes('DESC_PRODUTO') ||
        normalized.includes('DESC PRODUTO') ||
        normalized.includes('DESCRICAO') ||
        normalized.includes('DESCRIÇÃO') ||
        normalized.includes('DESC')
      ) {
        mapping.descricaoProduto = headers[index];
      }

      // QTD
      if (
        normalized.includes('QTD') ||
        normalized.includes('QUANTIDADE') ||
        normalized.includes('QTD_PEDIDO')
      ) {
        mapping.qtd = headers[index];
      }

      // VALOR_UNIT
      if (
        normalized.includes('VALOR_UNIT') ||
        normalized.includes('VALOR UNIT') ||
        normalized.includes('VALOR_UNITARIO') ||
        normalized.includes('VALOR UNITÁRIO') ||
        normalized.includes('PRECO_UNITARIO') ||
        normalized.includes('PREÇO UNITÁRIO') ||
        normalized.includes('PRECO UNIT') ||
        normalized.includes('PREÇO UNIT') ||
        normalized.includes('PRECO_UNIT') ||
        normalized.includes('PREÇO_UNIT') ||
        normalized.includes('UNITARIO') ||
        normalized.includes('UNITÁRIO') ||
        normalized.includes('VALOR UNIT') ||
        normalized.includes('VLR UNIT') ||
        normalized.includes('VL UNIT') ||
        normalized.includes('PRECO') ||
        normalized.includes('PREÇO')
      ) {
        // Evitar conflito com VALOR_TOTAL - só mapear se não for TOTAL
        if (!normalized.includes('TOTAL') && !normalized.includes('LIQ')) {
          mapping.valorUnit = headers[index];
        }
      }

      // VALOR_TOTAL
      if (
        normalized.includes('VALOR_TOTAL') ||
        normalized.includes('VALOR TOTAL') ||
        normalized.includes('TOTAL') ||
        normalized.includes('TOTAL LIQ') ||
        normalized.includes('TOTAL_LIQ') ||
        normalized.includes('TOTAL LIQUIDO') ||
        normalized.includes('TOTAL_LIQUIDO') ||
        normalized.includes('TOTAL LÍQUIDO') ||
        normalized.includes('TOTAL_LÍQUIDO')
      ) {
        mapping.valorTotal = headers[index];
      }

      // NOME_FANTASIA
      if (
        normalized.includes('NOME_FANTASIA') ||
        normalized.includes('NOME FANTASIA') ||
        normalized.includes('FANTASIA') ||
        normalized.includes('CLIENTE')
      ) {
        mapping.nomeFantasia = headers[index];
      }
    });

    return mapping;
  }

  /**
   * Detecta a linha de cabeçalho no arquivo Excel
   */
  detectHeaderRow(rawData: any[][]): number {
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      // Verifica se a linha contém pelo menos 3 campos de texto (não numéricos)
      const textFields = row.filter(
        (cell) => cell && typeof cell === 'string' && cell.trim().length > 0,
      ).length;

      if (textFields >= 3) {
        return i;
      }
    }

    return 0; // Fallback para primeira linha
  }
}

