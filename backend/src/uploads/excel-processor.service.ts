import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

interface ExcelRow {
  classificacao?: string;
  conta?: string;
  subConta?: string;
  nomeConta?: string;
  tipoConta?: string;
  nivel?: number;
  titulo?: boolean;
  estabelecimento?: boolean;
  saldoAnterior?: number;
  debito?: number;
  credito?: number;
  saldoAtual?: number;
}

interface TemplateMapping {
  classificacao?: string;
  conta?: string;
  subConta?: string;
  nomeConta?: string;
  tipoConta?: string;
  nivel?: string;
  titulo?: string;
  estabelecimento?: string;
  saldoAnterior?: string;
  debito?: string;
  credito?: string;
  saldoAtual?: string;
}

@Injectable()
export class ExcelProcessorService {
  private readonly logger = new Logger(ExcelProcessorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processa um arquivo Excel e cria os registros de LinhaUpload
   */
  async processUpload(uploadId: string): Promise<void> {
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: { template: true, empresa: true },
    });

    if (!upload) {
      throw new Error(`Upload ${uploadId} não encontrado`);
    }

    if (upload.status !== 'PROCESSANDO') {
      this.logger.warn(`Upload ${uploadId} não está em status PROCESSANDO`);
      return;
    }

    try {
      // Ler arquivo Excel
      const filePath = upload.arquivoUrl.replace('/uploads/', './uploads/');
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Primeira aba
      const worksheet = workbook.Sheets[sheetName];

      // Converter para JSON (primeira linha como cabeçalho)
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: '', // Valor padrão para células vazias
      });

      // Obter mapeamento de colunas (template ou padrão ou auto-detect)
      const mapping = this.getColumnMapping(
        upload.template?.configuracao as any,
        rawData.length > 0 ? rawData[0] : {},
      );

      // Processar linhas
      const linhas = this.parseRows(rawData, mapping);
      this.logger.log(`Processadas ${linhas.length} linhas do arquivo`);

      // Validar e criar registros
      const linhasValidas = linhas.filter((linha) => this.isValidRow(linha));
      this.logger.log(`${linhasValidas.length} linhas válidas encontradas`);

      // Criar registros no banco
      await this.createLinhaUploads(uploadId, upload.empresaId, linhasValidas);

      // Atualizar catálogo de contas (deve ser feito antes de detectar alertas)
      await this.updateContaCatalogo(upload.empresaId, linhasValidas);

      // Detectar alertas (após criar linhas e atualizar catálogo)
      await this.detectAlerts(uploadId, linhasValidas, upload.empresaId);

      // Atualizar status do upload
      const alertasCount = await this.prisma.alerta.count({
        where: { uploadId, status: 'ABERTO' },
      });

      await this.prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: alertasCount > 0 ? 'COM_ALERTAS' : 'CONCLUIDO',
          totalLinhas: linhasValidas.length,
        },
      });

      this.logger.log(`Upload ${uploadId} processado com sucesso. ${alertasCount} alertas gerados.`);
    } catch (error) {
      this.logger.error(`Erro ao processar upload ${uploadId}:`, error);
      
      await this.prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: 'CANCELADO',
        },
      });

      throw error;
    }
  }

  /**
   * Obtém o mapeamento de colunas do template ou usa padrão/auto-detect
   */
  private getColumnMapping(templateConfig?: any, firstRow?: any): TemplateMapping {
    if (templateConfig?.columnMapping) {
      return templateConfig.columnMapping;
    }

    // Tentar auto-detectar colunas baseado nos nomes das colunas
    if (firstRow) {
      const columnNames = Object.keys(firstRow);
      const mapping: TemplateMapping = {};

      // Mapear por palavras-chave (case-insensitive)
      for (const colName of columnNames) {
        const colLower = colName.toLowerCase().trim();
        
        if (colLower.includes('classificação') || colLower.includes('classificacao')) {
          mapping.classificacao = colName;
        } else if (colLower.includes('conta') && !colLower.includes('sub') && !colLower.includes('nome')) {
          mapping.conta = colName;
        } else if (colLower.includes('sub') && colLower.includes('conta')) {
          mapping.subConta = colName;
        } else if (colLower.includes('nome') && colLower.includes('conta')) {
          mapping.nomeConta = colName;
        } else if (colLower.includes('tipo')) {
          mapping.tipoConta = colName;
        } else if (colLower.includes('nível') || colLower.includes('nivel')) {
          mapping.nivel = colName;
        } else if (colLower.includes('título') || colLower.includes('titulo')) {
          mapping.titulo = colName;
        } else if (colLower.includes('estabelecimento')) {
          mapping.estabelecimento = colName;
        } else if (colLower.includes('saldo') && colLower.includes('anterior')) {
          mapping.saldoAnterior = colName;
        } else if (colLower.includes('débito') || colLower.includes('debito')) {
          mapping.debito = colName;
        } else if (colLower.includes('crédito') || colLower.includes('credito')) {
          mapping.credito = colName;
        } else if (colLower.includes('saldo') && (colLower.includes('atual') || colLower.includes('final'))) {
          mapping.saldoAtual = colName;
        }
      }

      // Se encontrou pelo menos alguns campos, usar o mapeamento auto-detectado
      if (Object.keys(mapping).length >= 3) {
        return mapping;
      }
    }

    // Mapeamento padrão baseado no formato esperado do balancete
    return {
      classificacao: 'Classificação',
      conta: 'Conta',
      subConta: 'Sub Conta',
      nomeConta: 'Nome da Conta',
      tipoConta: 'Tipo',
      nivel: 'Nível',
      titulo: 'Título',
      estabelecimento: 'Estabelecimento',
      saldoAnterior: 'Saldo Anterior',
      debito: 'Débito',
      credito: 'Crédito',
      saldoAtual: 'Saldo Atual',
    };
  }

  /**
   * Parse das linhas do Excel para o formato esperado
   */
  private parseRows(rawData: any[], mapping: TemplateMapping): ExcelRow[] {
    return rawData.map((row) => {
      const parsed: ExcelRow = {};

      // Mapear colunas
      if (mapping.classificacao && row[mapping.classificacao]) {
        parsed.classificacao = String(row[mapping.classificacao]).trim();
      }
      if (mapping.conta && row[mapping.conta]) {
        parsed.conta = String(row[mapping.conta]).trim();
      }
      if (mapping.subConta && row[mapping.subConta]) {
        parsed.subConta = String(row[mapping.subConta]).trim();
      }
      if (mapping.nomeConta && row[mapping.nomeConta]) {
        parsed.nomeConta = String(row[mapping.nomeConta]).trim();
      }
      if (mapping.tipoConta && row[mapping.tipoConta]) {
        parsed.tipoConta = String(row[mapping.tipoConta]).trim();
      }
      if (mapping.nivel && row[mapping.nivel]) {
        parsed.nivel = this.parseNumber(row[mapping.nivel]);
      }
      if (mapping.titulo && row[mapping.titulo] !== undefined) {
        parsed.titulo = this.parseBoolean(row[mapping.titulo]);
      }
      if (mapping.estabelecimento && row[mapping.estabelecimento] !== undefined) {
        parsed.estabelecimento = this.parseBoolean(row[mapping.estabelecimento]);
      }
      if (mapping.saldoAnterior && row[mapping.saldoAnterior] !== undefined) {
        parsed.saldoAnterior = this.parseDecimal(row[mapping.saldoAnterior]);
      }
      if (mapping.debito && row[mapping.debito] !== undefined) {
        parsed.debito = this.parseDecimal(row[mapping.debito]);
      }
      if (mapping.credito && row[mapping.credito] !== undefined) {
        parsed.credito = this.parseDecimal(row[mapping.credito]);
      }
      if (mapping.saldoAtual && row[mapping.saldoAtual] !== undefined) {
        parsed.saldoAtual = this.parseDecimal(row[mapping.saldoAtual]);
      }

      return parsed;
    });
  }

  /**
   * Valida se uma linha tem os dados mínimos necessários
   */
  private isValidRow(row: ExcelRow): boolean {
    return !!(
      row.classificacao &&
      row.conta &&
      row.nomeConta &&
      row.tipoConta !== undefined &&
      row.nivel !== undefined
    );
  }

  /**
   * Cria os registros de LinhaUpload no banco
   */
  private async createLinhaUploads(
    uploadId: string,
    empresaId: string,
    linhas: ExcelRow[],
  ): Promise<void> {
    const linhasParaCriar = linhas.map((linha) => {
      const hashLinha = this.calculateLineHash(linha);

      return {
        uploadId,
        classificacao: linha.classificacao!,
        conta: linha.conta!,
        subConta: linha.subConta || null,
        nomeConta: linha.nomeConta!,
        tipoConta: linha.tipoConta!,
        nivel: linha.nivel!,
        titulo: linha.titulo ?? false,
        estabelecimento: linha.estabelecimento ?? false,
        saldoAnterior: new Decimal(linha.saldoAnterior ?? 0),
        debito: new Decimal(linha.debito ?? 0),
        credito: new Decimal(linha.credito ?? 0),
        saldoAtual: new Decimal(linha.saldoAtual ?? 0),
        hashLinha,
      };
    });

    // Criar em lotes para melhor performance
    const batchSize = 100;
    for (let i = 0; i < linhasParaCriar.length; i += batchSize) {
      const batch = linhasParaCriar.slice(i, i + batchSize);
      await this.prisma.linhaUpload.createMany({
        data: batch,
      });
    }
  }

  /**
   * Atualiza o catálogo de contas
   */
  private async updateContaCatalogo(empresaId: string, linhas: ExcelRow[]): Promise<void> {
    for (const linha of linhas) {
      if (!linha.classificacao || !linha.nomeConta || !linha.tipoConta || linha.nivel === undefined) {
        continue;
      }

      const contaExistente = await this.prisma.contaCatalogo.findFirst({
        where: {
          empresaId,
          classificacao: linha.classificacao,
        },
      });

      if (contaExistente) {
        // Atualizar última importação
        await this.prisma.contaCatalogo.update({
          where: { id: contaExistente.id },
          data: {
            ultimaImportacao: new Date(),
            status: 'ATIVA',
          },
        });
      } else {
        // Nova conta
        await this.prisma.contaCatalogo.create({
          data: {
            empresaId,
            classificacao: linha.classificacao,
            nomeConta: linha.nomeConta,
            tipoConta: linha.tipoConta,
            nivel: linha.nivel,
            primeiraImportacao: new Date(),
            ultimaImportacao: new Date(),
            status: 'NOVA',
          },
        });
      }
    }
  }

  /**
   * Detecta alertas (saldos divergentes, contas novas)
   */
  private async detectAlerts(uploadId: string, linhas: ExcelRow[], empresaId: string): Promise<void> {
    const alertas: Array<{
      uploadId: string;
      linhaId?: string;
      tipo: 'SALDO_DIVERGENTE' | 'CONTA_NOVA' | 'DADO_INCONSISTENTE';
      severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
      mensagem: string;
    }> = [];

    // Buscar linhas criadas para obter IDs
    const linhasCriadas = await this.prisma.linhaUpload.findMany({
      where: { uploadId },
      orderBy: { createdAt: 'asc' },
    });

    // Buscar contas novas do catálogo
    const contasNovas = await this.prisma.contaCatalogo.findMany({
      where: {
        empresaId,
        status: 'NOVA',
      },
    });

    const contasNovasSet = new Set(contasNovas.map((c) => c.classificacao));

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const linhaCriada = linhasCriadas[i];

      // Verificar saldo divergente
      if (
        linha.saldoAnterior !== undefined &&
        linha.debito !== undefined &&
        linha.credito !== undefined &&
        linha.saldoAtual !== undefined
      ) {
        const saldoCalculado = linha.saldoAnterior + linha.debito - linha.credito;
        const diferenca = Math.abs(saldoCalculado - linha.saldoAtual);

        // Tolerância de 0.01 para diferenças de arredondamento
        if (diferenca > 0.01) {
          alertas.push({
            uploadId,
            linhaId: linhaCriada?.id,
            tipo: 'SALDO_DIVERGENTE',
            severidade: diferenca > 1000 ? 'ALTA' : diferenca > 100 ? 'MEDIA' : 'BAIXA',
            mensagem: `Saldo divergente na conta ${linha.classificacao}: esperado ${saldoCalculado.toFixed(2)}, encontrado ${linha.saldoAtual.toFixed(2)}`,
          });
        }
      }

      // Verificar conta nova
      if (linha.classificacao && contasNovasSet.has(linha.classificacao)) {
        alertas.push({
          uploadId,
          linhaId: linhaCriada?.id,
          tipo: 'CONTA_NOVA',
          severidade: 'MEDIA',
          mensagem: `Nova conta detectada: ${linha.classificacao} - ${linha.nomeConta}`,
        });
      }

      // Verificar dados inconsistentes
      if (
        !linha.classificacao ||
        !linha.nomeConta ||
        linha.nivel === undefined ||
        linha.tipoConta === undefined
      ) {
        alertas.push({
          uploadId,
          linhaId: linhaCriada?.id,
          tipo: 'DADO_INCONSISTENTE',
          severidade: 'BAIXA',
          mensagem: `Dados inconsistentes na linha: campos obrigatórios ausentes`,
        });
      }
    }

    // Criar alertas em lote
    if (alertas.length > 0) {
      await this.prisma.alerta.createMany({
        data: alertas,
      });
    }
  }

  /**
   * Calcula hash de uma linha para detecção de mudanças
   */
  private calculateLineHash(linha: ExcelRow): string {
    const data = JSON.stringify({
      classificacao: linha.classificacao,
      conta: linha.conta,
      subConta: linha.subConta,
      nomeConta: linha.nomeConta,
      tipoConta: linha.tipoConta,
      nivel: linha.nivel,
      saldoAnterior: linha.saldoAnterior,
      debito: linha.debito,
      credito: linha.credito,
      saldoAtual: linha.saldoAtual,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Converte valor para número
   */
  private parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  /**
   * Converte valor para decimal
   */
  private parseDecimal(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  /**
   * Converte valor para boolean
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    const str = String(value).toLowerCase().trim();
    return str === 'true' || str === '1' || str === 'sim' || str === 's' || str === 'x';
  }
}

