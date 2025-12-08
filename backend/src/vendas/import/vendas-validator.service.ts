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
    row: Record<string, unknown>,
    mapping: Record<string, string | undefined>,
    rowNumber: number,
  ): VendaRawData {
    const errors: string[] = [];

    // Campos obrigatórios
    const nfe = this.getField(row, mapping.nfe);
    let nfeStr = '';
    if (nfe) {
      if (typeof nfe === 'string') {
        nfeStr = nfe;
      } else if (
        typeof nfe === 'number' ||
        typeof nfe === 'boolean' ||
        nfe === null
      ) {
        nfeStr = String(nfe);
      }
    }
    if (!nfe || nfeStr.trim() === '') {
      errors.push(`Linha ${rowNumber}: NFE é obrigatório`);
    }

    const dataVenda = this.getField(row, mapping.data);
    if (!dataVenda) {
      errors.push(`Linha ${rowNumber}: DATA é obrigatória`);
    }

    const razaoSocial = this.getField(row, mapping.razaoSocial);
    let razaoSocialStr = '';
    if (razaoSocial) {
      if (typeof razaoSocial === 'string') {
        razaoSocialStr = razaoSocial;
      } else if (
        typeof razaoSocial === 'number' ||
        typeof razaoSocial === 'boolean' ||
        razaoSocial === null
      ) {
        razaoSocialStr = String(razaoSocial);
      }
    }
    if (!razaoSocial || razaoSocialStr.trim() === '') {
      errors.push(`Linha ${rowNumber}: RAZAO_SOCIAL é obrigatório`);
    }

    const quantidade = this.parseNumber(
      this.getField(row, mapping.qtd),
    );
    if (quantidade === null) {
      errors.push(`Linha ${rowNumber}: QTD é obrigatória e deve ser numérica`);
    }

    const valorUnitario = this.parseNumber(
      this.getField(row, mapping.valorUnit),
    );
    if (valorUnitario === null) {
      errors.push(
        `Linha ${rowNumber}: VALOR_UNIT é obrigatório e deve ser numérico`,
      );
    }

    const valorTotal = this.parseNumber(
      this.getField(row, mapping.valorTotal),
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
    } catch {
      let dataVendaStr = 'undefined';
      if (dataVenda) {
        if (typeof dataVenda === 'string') {
          dataVendaStr = dataVenda;
        } else if (
          typeof dataVenda === 'number' ||
          typeof dataVenda === 'boolean'
        ) {
          dataVendaStr = String(dataVenda);
        }
      }
      throw new BadRequestException(
        `Linha ${rowNumber}: DATA inválida: ${dataVendaStr}`,
      );
    }

    return {
      nfe: String(nfe).trim(),
      dataVenda: parsedDate.toISOString(),
      razaoSocial: String(razaoSocial).trim(),
      quantidade: quantidade!,
      valorUnitario: valorUnitario!,
      valorTotal: valorTotal!,
      idDoc: this.getField(row, mapping.idDoc)
        ? String(this.getField(row, mapping.idDoc)).trim()
        : undefined,
      idProd: this.getField(row, mapping.idProd)
        ? String(this.getField(row, mapping.idProd)).trim()
        : undefined,
      referencia: this.getField(row, mapping.referencia)
        ? String(this.getField(row, mapping.referencia)).trim()
        : undefined,
      prodCodMestre: this.getField(row, mapping.prodCodMestre)
        ? String(this.getField(row, mapping.prodCodMestre)).trim()
        : undefined,
      tipoOperacao: this.getField(row, mapping.tipoOperacao)
        ? String(this.getField(row, mapping.tipoOperacao)).trim()
        : undefined,
      nomeFantasia: this.getField(row, mapping.nomeFantasia)
        ? String(this.getField(row, mapping.nomeFantasia)).trim()
        : undefined,
      cnpjCliente: undefined, // Não mapeado no exemplo, mas pode ser adicionado
      ufDestino: this.getField(row, mapping.ufDestino)
        ? String(this.getField(row, mapping.ufDestino)).trim()
        : undefined,
      ufOrigem: this.getField(row, mapping.ufOrigem)
        ? String(this.getField(row, mapping.ufOrigem)).trim()
        : undefined,
      descricaoProduto: undefined, // Não mapeado no exemplo
    };
  }

  private getField(
    row: Record<string, unknown>,
    columnName: string | undefined,
  ): unknown {
    if (!columnName) return undefined;
    return row[columnName] ?? undefined;
  }

  private parseNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    // Tenta converter para número
    let valueStr = '';
    if (typeof value === 'string') {
      valueStr = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      valueStr = String(value);
    } else if (value === null || value === undefined) {
      valueStr = '';
    }
    const num = parseFloat(valueStr.replace(',', '.'));

    if (isNaN(num)) {
      return null;
    }

    return num;
  }

  private parseDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      // Excel serial date
      return new Date((value - 25569) * 86400 * 1000);
    }

    // String date
    const dateStr = String(value).trim();
    const parsed = new Date(dateStr);

    if (isNaN(parsed.getTime())) {
      throw new Error(`Data inválida: ${dateStr}`);
    }

    return parsed;
  }
}
