import { Injectable, BadRequestException } from '@nestjs/common';

export interface PedidoRawData {
  numeroPedido: string;
  dataPedido: string;
  nomeFantasia: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  idDoc?: string;
  idProd?: string;
  referencia?: string;
  descricaoProduto?: string;
}

@Injectable()
export class PedidosValidatorService {
  /**
   * Valida e transforma uma linha do Excel em objeto Pedido
   */
  validateAndTransform(
    row: Record<string, unknown>,
    mapping: Record<string, string | undefined>,
    rowNumber: number,
  ): PedidoRawData {
    const errors: string[] = [];

    // Campos obrigatórios
    const numeroPedido = this.getField(row, mapping.numeroPedido);
    let numeroPedidoStr = '';
    if (numeroPedido) {
      if (typeof numeroPedido === 'string') {
        numeroPedidoStr = numeroPedido;
      } else if (
        typeof numeroPedido === 'number' ||
        typeof numeroPedido === 'boolean' ||
        numeroPedido === null
      ) {
        numeroPedidoStr = String(numeroPedido);
      }
    }
    if (!numeroPedido || numeroPedidoStr.trim() === '') {
      errors.push(`Linha ${rowNumber}: NUMERO_PEDIDO é obrigatório`);
    }

    const dataPedido = this.getField(row, mapping.data);
    if (!dataPedido) {
      errors.push(`Linha ${rowNumber}: DATA é obrigatória`);
    }

    const nomeFantasia = this.getField(row, mapping.nomeFantasia);
    let nomeFantasiaStr = '';
    if (nomeFantasia) {
      if (typeof nomeFantasia === 'string') {
        nomeFantasiaStr = nomeFantasia;
      } else if (
        typeof nomeFantasia === 'number' ||
        typeof nomeFantasia === 'boolean' ||
        nomeFantasia === null
      ) {
        nomeFantasiaStr = String(nomeFantasia);
      }
    }
    if (!nomeFantasia || nomeFantasiaStr.trim() === '') {
      errors.push(`Linha ${rowNumber}: NOME_FANTASIA é obrigatório`);
    }

    const quantidade = this.parseNumber(this.getField(row, mapping.qtd));
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

    const valorTotal = this.parseNumber(this.getField(row, mapping.valorTotal));
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
      parsedDate = this.parseDate(dataPedido);
    } catch {
      let dataPedidoStr = 'undefined';
      if (dataPedido) {
        if (typeof dataPedido === 'string') {
          dataPedidoStr = dataPedido;
        } else if (
          typeof dataPedido === 'number' ||
          typeof dataPedido === 'boolean'
        ) {
          dataPedidoStr = String(dataPedido);
        }
      }
      throw new BadRequestException(
        `Linha ${rowNumber}: DATA inválida: ${dataPedidoStr}`,
      );
    }

    return {
      numeroPedido: String(numeroPedido).trim(),
      dataPedido: parsedDate.toISOString(),
      nomeFantasia: String(nomeFantasia).trim(),
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
      descricaoProduto: this.getField(row, mapping.descricaoProduto)
        ? String(this.getField(row, mapping.descricaoProduto)).trim()
        : undefined,
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

    // Tentar formato brasileiro com hora: DD/MM/YYYY HH:MM:SS
    const brFormatWithTime = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const matchWithTime = dateStr.match(brFormatWithTime);
    if (matchWithTime) {
      const day = parseInt(matchWithTime[1], 10);
      const month = parseInt(matchWithTime[2], 10) - 1;
      const year = parseInt(matchWithTime[3], 10);
      const hour = parseInt(matchWithTime[4], 10);
      const minute = parseInt(matchWithTime[5], 10);
      const second = parseInt(matchWithTime[6], 10);
      // Criar data em UTC para evitar problemas de timezone
      const date = new Date(Date.UTC(year, month, day, hour, minute, second));
      // Verificar se a data é válida usando UTC
      if (
        date.getUTCDate() === day &&
        date.getUTCMonth() === month &&
        date.getUTCFullYear() === year &&
        date.getUTCHours() === hour &&
        date.getUTCMinutes() === minute &&
        date.getUTCSeconds() === second
      ) {
        return date;
      }
    }

    // Tentar formato brasileiro DD/MM/YYYY ou DD/MM/YY (sem hora)
    const brFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
    const match = dateStr.match(brFormat);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      let year = parseInt(match[3], 10);
      if (year < 100) {
        year += 2000; // Assumir anos 2000+
      }
      // Criar data em UTC para evitar problemas de timezone
      const date = new Date(Date.UTC(year, month, day));
      // Verificar se a data é válida usando UTC
      if (
        date.getUTCDate() === day &&
        date.getUTCMonth() === month &&
        date.getUTCFullYear() === year
      ) {
        return date;
      }
    }

    // Tentar ISO format
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    throw new Error(`Data inválida: ${dateStr}`);
  }
}

