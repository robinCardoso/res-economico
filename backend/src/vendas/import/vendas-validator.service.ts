import { Injectable, BadRequestException } from '@nestjs/common';

export interface VendaRawData {
  nfe: string;
  dataVenda: string;
  razaoSocial: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  idDoc?: string;
  idProd?: string;
  referencia?: string;
  prodCodMestre?: string;
  tipoOperacao?: string;
  nomeFantasia?: string;
  cnpjCliente?: string;
  ufDestino?: string;
  ufOrigem?: string;
  descricaoProduto?: string;
}

@Injectable()
export class VendasValidatorService {
  /**
   * Valida e transforma uma linha do Excel em objeto Venda
   */
  validateAndTransform(
    row: any,
    mapping: any,
    rowNumber: number,
  ): VendaRawData {
    const errors: string[] = [];

    // Campos obrigatórios
    const nfe = this.getField(row, mapping.nfe, 'NFE');
    if (!nfe || nfe.toString().trim() === '') {
      errors.push(`Linha ${rowNumber}: NFE é obrigatório`);
    }

    const dataVenda = this.getField(row, mapping.data, 'DATA');
    if (!dataVenda) {
      errors.push(`Linha ${rowNumber}: DATA é obrigatória`);
    }

    const razaoSocial = this.getField(row, mapping.razaoSocial, 'RAZAO_SOCIAL');
    if (!razaoSocial || razaoSocial.toString().trim() === '') {
      errors.push(`Linha ${rowNumber}: RAZAO_SOCIAL é obrigatório`);
    }

    const quantidade = this.parseNumber(
      this.getField(row, mapping.qtd, 'QTD'),
      'quantidade',
      rowNumber,
    );
    if (quantidade === null) {
      errors.push(`Linha ${rowNumber}: QTD é obrigatória e deve ser numérica`);
    }

    const valorUnitario = this.parseNumber(
      this.getField(row, mapping.valorUnit, 'VALOR_UNIT'),
      'valor unitário',
      rowNumber,
    );
    if (valorUnitario === null) {
      errors.push(
        `Linha ${rowNumber}: VALOR_UNIT é obrigatório e deve ser numérico`,
      );
    }

    const valorTotal = this.parseNumber(
      this.getField(row, mapping.valorTotal, 'VALOR_TOTAL'),
      'valor total',
      rowNumber,
    );
    if (valorTotal === null) {
      errors.push(
        `Linha ${rowNumber}: VALOR_TOTAL é obrigatório e deve ser numérico`,
      );
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }

    // Parse data
    let parsedDate: Date;
    try {
      parsedDate = this.parseDate(dataVenda);
    } catch (error) {
      throw new BadRequestException(
        `Linha ${rowNumber}: DATA inválida: ${dataVenda}`,
      );
    }

    return {
      nfe: nfe.toString().trim(),
      dataVenda: parsedDate.toISOString(),
      razaoSocial: razaoSocial.toString().trim(),
      quantidade: quantidade!,
      valorUnitario: valorUnitario!,
      valorTotal: valorTotal!,
      idDoc: this.getField(row, mapping.idDoc, 'ID_DOC')?.toString().trim(),
      idProd: this.getField(row, mapping.idProd, 'ID_PROD')?.toString().trim(),
      referencia: this.getField(row, mapping.referencia, 'REFERENCIA')
        ?.toString()
        .trim(),
      prodCodMestre: this.getField(
        row,
        mapping.prodCodMestre,
        'PROD_COD_MAESTRE',
      )
        ?.toString()
        .trim(),
      tipoOperacao: this.getField(row, mapping.tipoOperacao, 'TIPO_OPERACAO')
        ?.toString()
        .trim(),
      nomeFantasia: this.getField(row, mapping.nomeFantasia, 'NOME_FANTASIA')
        ?.toString()
        .trim(),
      cnpjCliente: undefined, // Não mapeado no exemplo, mas pode ser adicionado
      ufDestino: this.getField(row, mapping.ufDestino, 'UF_DESTINO')
        ?.toString()
        .trim(),
      ufOrigem: this.getField(row, mapping.ufOrigem, 'UF_ORIGEM')
        ?.toString()
        .trim(),
      descricaoProduto: undefined, // Não mapeado no exemplo
    };
  }

  private getField(row: any, columnName: string | undefined, fieldName: string): any {
    if (!columnName) return undefined;
    return row[columnName] ?? undefined;
  }

  private parseNumber(
    value: any,
    fieldName: string,
    rowNumber: number,
  ): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    // Tenta converter para número
    const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(',', '.'));

    if (isNaN(num)) {
      return null;
    }

    return num;
  }

  private parseDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      // Excel serial date
      return new Date((value - 25569) * 86400 * 1000);
    }

    // String date
    const dateStr = value.toString().trim();
    const parsed = new Date(dateStr);

    if (isNaN(parsed.getTime())) {
      throw new Error(`Data inválida: ${dateStr}`);
    }

    return parsed;
  }
}
