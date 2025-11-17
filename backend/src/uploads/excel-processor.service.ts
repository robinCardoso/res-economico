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
  // Rastreamento de células vazias para alertas
  _celulasVazias?: string[]; // Nomes das colunas que estavam vazias
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
   * @param uploadId ID do upload a ser processado
   * @param onProgress Callback opcional para atualizar progresso (0-100)
   */
  async processUpload(
    uploadId: string,
    onProgress?: (progress: number, etapa: string) => void,
  ): Promise<void> {
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
      // Etapa 1: Ler arquivo Excel (10-20%)
      onProgress?.(10, 'Lendo arquivo Excel...');
      const filePath = upload.arquivoUrl.replace('/uploads/', './uploads/');
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Primeira aba
      const worksheet = workbook.Sheets[sheetName];

      // Converter para array de arrays (mantém estrutura original)
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: null, // null para células vazias (não string vazia)
        header: 1, // Primeira linha como array de valores
      });

      // Log para debug - verificar estrutura
      this.logger.log(`Total de linhas no Excel: ${rawData.length}`);

      // Encontrar a primeira linha que parece ser cabeçalho (tem texto, não números)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(5, rawData.length); i++) {
        const row = rawData[i];
        if (Array.isArray(row)) {
          // Verificar se a linha tem pelo menos 3 células com texto (não números)
          const textCells = row.filter((cell: any) => {
            if (cell === null || cell === undefined || cell === '')
              return false;
            const str = String(cell).trim();
            // Se for texto (não número puro) e tiver mais de 2 caracteres
            return isNaN(Number(str)) && str.length > 2;
          });
          if (textCells.length >= 3) {
            headerRowIndex = i;
            this.logger.log(`Cabeçalho encontrado na linha ${i + 1}`);
            break;
          }
        }
      }

      if (rawData.length === 0) {
        throw new Error('Arquivo Excel está vazio');
      }

      const headers = rawData[headerRowIndex];
      this.logger.log(
        `Cabeçalhos detectados (linha ${headerRowIndex + 1}): ${JSON.stringify(headers)}`,
      );

      // Limpar e normalizar cabeçalhos

      const cleanHeaders = (headers as unknown[]).map(
        (h: unknown, idx: number) => {
          if (h === null || h === undefined || h === '') {
            return `Coluna_${idx + 1}`;
          }
          if (typeof h === 'string' || typeof h === 'number') {
            return String(h).trim();
          }
          return `Coluna_${idx + 1}`;
        },
      );

      this.logger.log(`Cabeçalhos limpos: ${JSON.stringify(cleanHeaders)}`);

      // Converter linhas de dados para objetos (pular linha do cabeçalho)

      const dataRows = (rawData as unknown[][])
        .slice(headerRowIndex + 1)
        .filter((row: unknown) => {
          // Filtrar linhas completamente vazias
          return (
            Array.isArray(row) &&
            row.some(
              (cell: unknown) =>
                cell !== null && cell !== undefined && cell !== '',
            )
          );
        })
        .map((row: unknown[]) => {
          const obj: Record<string, unknown> = {};
          cleanHeaders.forEach((header, index) => {
            const value = row[index];
            // Manter null/undefined como está, mas converter strings vazias para null
            obj[header] = value === '' || value === undefined ? null : value;
          });
          return obj;
        });

      this.logger.log(`Total de linhas de dados: ${dataRows.length}`);
      if (dataRows.length > 0) {
        this.logger.log(
          `Primeira linha de dados: ${JSON.stringify(dataRows[0])}`,
        );
      }

      // Obter mapeamento de colunas (template ou padrão ou auto-detect)

      const mapping = this.getColumnMapping(
        upload.template?.configuracao as
          | { columnMapping?: TemplateMapping }
          | undefined,
        dataRows.length > 0 ? dataRows[0] : {},
        cleanHeaders,
      );

      this.logger.log(`Mapeamento de colunas: ${JSON.stringify(mapping)}`);

      // Verificar se todas as colunas mapeadas existem nos dados
      if (dataRows.length > 0) {
        const firstRow = dataRows[0];
        Object.entries(mapping).forEach(([key, colName]) => {
          const colNameStr = colName as string | undefined;
          if (colNameStr && firstRow[colNameStr] === undefined) {
            this.logger.warn(
              `Coluna mapeada "${colNameStr}" (${key}) não encontrada na primeira linha. Chaves disponíveis: ${Object.keys(firstRow).join(', ')}`,
            );
          } else if (colNameStr) {
            const value = firstRow[colNameStr];
            const valueStr =
              value === null || value === undefined
                ? ''
                : typeof value === 'string' || typeof value === 'number'
                  ? String(value)
                  : JSON.stringify(value);
            this.logger.log(`Coluna "${colNameStr}" (${key}) = "${valueStr}"`);
          }
        });
      }

      // Detectar alterações no cabeçalho (antes de processar linhas)
      await this.detectHeaderChanges(
        uploadId,
        cleanHeaders,
        mapping,
        upload.empresaId,
        upload.template
          ? {
              configuracao: upload.template.configuracao as
                | { columnMapping?: TemplateMapping }
                | undefined,
            }
          : null,
      );

      // Etapa 2: Processar e validar linhas (20-50%)
      onProgress?.(20, 'Processando linhas do arquivo...');
      const linhas = this.parseRows(dataRows, mapping);
      this.logger.log(`Processadas ${linhas.length} linhas do arquivo`);

      // Validar e criar registros
      const linhasValidas = linhas.filter((linha) => this.isValidRow(linha));
      this.logger.log(`${linhasValidas.length} linhas válidas encontradas`);
      onProgress?.(30, `${linhasValidas.length} linhas válidas encontradas`);

      // Etapa 3: Criar registros no banco (50-70%)
      onProgress?.(50, 'Criando registros no banco de dados...');
      await this.createLinhaUploads(uploadId, upload.empresaId, linhasValidas);
      onProgress?.(60, 'Registros criados com sucesso');

      // Etapa 4: Atualizar catálogo de contas (70-80%)
      onProgress?.(70, 'Atualizando catálogo de contas...');
      await this.updateContaCatalogo(upload.empresaId, linhasValidas);
      onProgress?.(80, 'Catálogo atualizado');

      // Etapa 5: Detectar alertas (80-95%)
      onProgress?.(80, 'Detectando alertas...');
      await this.detectAlerts(uploadId, linhasValidas, upload.empresaId);
      onProgress?.(95, 'Análise de alertas concluída');

      // Etapa 6: Finalizar processamento (95-100%)
      onProgress?.(95, 'Finalizando processamento...');
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

      onProgress?.(100, 'Processamento concluído');
      this.logger.log(
        `Upload ${uploadId} processado com sucesso. ${alertasCount} alertas gerados.`,
      );
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

  private getColumnMapping(
    templateConfig?:
      | { columnMapping?: TemplateMapping }
      | Record<string, unknown>,

    firstRow?: Record<string, unknown>,
    headers?: string[],
  ): TemplateMapping {
    if (templateConfig?.columnMapping) {
      return templateConfig.columnMapping;
    }

    // Usar headers se disponível, senão usar keys do firstRow

    const columnNames = headers || (firstRow ? Object.keys(firstRow) : []);
    const mapping: TemplateMapping = {};

    // Mapear por palavras-chave (case-insensitive)
    for (const colName of columnNames) {
      if (!colName) continue;

      const colLower = colName.toLowerCase().trim();

      // Classificação - pode ter acento ou não
      if (
        (colLower.includes('classificação') ||
          colLower.includes('classificacao')) &&
        !mapping.classificacao
      ) {
        mapping.classificacao = colName;
      }
      // Conta - mas não "Sub Conta" ou "Nome da Conta"
      else if (
        colLower.includes('conta') &&
        !colLower.includes('sub') &&
        !colLower.includes('nome') &&
        !colLower.includes('título') &&
        !colLower.includes('titulo') &&
        !mapping.conta
      ) {
        mapping.conta = colName;
      }
      // Sub Conta
      else if (
        (colLower.includes('sub') || colLower === 'sub') &&
        !mapping.subConta
      ) {
        mapping.subConta = colName;
      }
      // Nome da conta
      else if (
        colLower.includes('nome') &&
        (colLower.includes('conta') || colLower.includes('contábil')) &&
        !mapping.nomeConta
      ) {
        mapping.nomeConta = colName;
      }
      // Tipo conta
      else if (
        colLower.includes('tipo') &&
        colLower.includes('conta') &&
        !mapping.tipoConta
      ) {
        mapping.tipoConta = colName;
      }
      // Nível
      else if (
        (colLower.includes('nível') || colLower.includes('nivel')) &&
        !mapping.nivel
      ) {
        mapping.nivel = colName;
      }
      // Cta. título ou Título
      else if (
        (colLower.includes('título') ||
          colLower.includes('titulo') ||
          colLower.includes('cta. título')) &&
        !mapping.titulo
      ) {
        mapping.titulo = colName;
      }
      // Estabelecimento ou Estab.
      else if (
        (colLower.includes('estabelecimento') || colLower.includes('estab.')) &&
        !mapping.estabelecimento
      ) {
        mapping.estabelecimento = colName;
      }
      // Saldo anterior
      else if (
        colLower.includes('saldo') &&
        colLower.includes('anterior') &&
        !mapping.saldoAnterior
      ) {
        mapping.saldoAnterior = colName;
      }
      // Débito
      else if (
        (colLower.includes('débito') || colLower.includes('debito')) &&
        !mapping.debito
      ) {
        mapping.debito = colName;
      }
      // Crédito
      else if (
        (colLower.includes('crédito') || colLower.includes('credito')) &&
        !mapping.credito
      ) {
        mapping.credito = colName;
      }
      // Saldo atual
      else if (
        colLower.includes('saldo') &&
        (colLower.includes('atual') || colLower.includes('final')) &&
        !mapping.saldoAtual
      ) {
        mapping.saldoAtual = colName;
      }
    }

    // Se encontrou pelo menos alguns campos, usar o mapeamento auto-detectado
    if (Object.keys(mapping).length >= 3) {
      this.logger.log(
        `Auto-detecção encontrou ${Object.keys(mapping).length} colunas mapeadas`,
      );
      return mapping;
    }

    // Mapeamento padrão baseado no formato esperado do balancete
    this.logger.log('Usando mapeamento padrão');
    return {
      classificacao: 'Classificação',
      conta: 'Conta',
      subConta: 'Sub',
      nomeConta: 'Nome da conta contábil/C. Custo',
      tipoConta: 'Tipo conta',
      nivel: 'Nível',
      titulo: 'Cta. título',
      estabelecimento: 'Estab.',
      saldoAnterior: 'Saldo anterior',
      debito: 'Débito',
      credito: 'Crédito',
      saldoAtual: 'Saldo atual',
    };
  }

  /**
   * Parse das linhas do Excel para o formato esperado
   */

  private parseRows(
    rawData: Record<string, unknown>[],
    mapping: TemplateMapping,
  ): ExcelRow[] {
    return rawData.map((row: Record<string, unknown>, index: number) => {
      const parsed: ExcelRow = {};
      const celulasVazias: string[] = [];

      // Função auxiliar para verificar se célula está vazia

      const isCellEmpty = (value: unknown): boolean => {
        return (
          value === undefined ||
          value === null ||
          value === '' ||
          (typeof value === 'string' && value.trim() === '')
        );
      };

      // Mapear colunas - verificar se a chave existe no objeto

      if (mapping.classificacao) {
        if (isCellEmpty(row[mapping.classificacao])) {
          celulasVazias.push('Classificação');
        } else {
          parsed.classificacao = String(row[mapping.classificacao]).trim();
        }
      }

      if (mapping.conta) {
        if (isCellEmpty(row[mapping.conta])) {
          celulasVazias.push('Conta');
        } else {
          parsed.conta = String(row[mapping.conta]).trim();
        }
      }

      if (mapping.subConta) {
        if (isCellEmpty(row[mapping.subConta])) {
          // SubConta pode ser opcional, não adicionar aos alertas
        } else {
          parsed.subConta = String(row[mapping.subConta]).trim();
        }
      }

      if (mapping.nomeConta) {
        if (isCellEmpty(row[mapping.nomeConta])) {
          celulasVazias.push('Nome da Conta');
        } else {
          parsed.nomeConta = String(row[mapping.nomeConta]).trim();
        }
      }

      if (mapping.tipoConta) {
        if (isCellEmpty(row[mapping.tipoConta])) {
          celulasVazias.push('Tipo Conta');
        } else {
          parsed.tipoConta = String(row[mapping.tipoConta]).trim();
        }
      }

      if (mapping.nivel) {
        if (isCellEmpty(row[mapping.nivel])) {
          celulasVazias.push('Nível');
        } else {
          // Nível pode ser "1" ou "1-Sim" ou "2-Não" - extrair apenas o número

          const nivelValue = String(row[mapping.nivel]).trim();
          const nivelMatch = nivelValue.match(/^(\d+)/);
          parsed.nivel = nivelMatch
            ? parseInt(nivelMatch[1], 10)
            : this.parseNumber(nivelValue);
        }
      }

      if (mapping.titulo) {
        if (isCellEmpty(row[mapping.titulo])) {
          // Título pode ser opcional (boolean), não adicionar aos alertas
        } else {
          parsed.titulo = this.parseBoolean(row[mapping.titulo]);
        }
      }

      if (mapping.estabelecimento) {
        if (isCellEmpty(row[mapping.estabelecimento])) {
          // Estabelecimento pode ser opcional (boolean), não adicionar aos alertas
        } else {
          parsed.estabelecimento = this.parseBoolean(
            row[mapping.estabelecimento],
          );
        }
      }

      if (mapping.saldoAnterior) {
        if (isCellEmpty(row[mapping.saldoAnterior])) {
          celulasVazias.push('Saldo Anterior');
        } else {
          parsed.saldoAnterior = this.parseDecimal(row[mapping.saldoAnterior]);
        }
      }

      if (mapping.debito) {
        if (isCellEmpty(row[mapping.debito])) {
          celulasVazias.push('Débito');
        } else {
          parsed.debito = this.parseDecimal(row[mapping.debito]);
        }
      }

      if (mapping.credito) {
        if (isCellEmpty(row[mapping.credito])) {
          celulasVazias.push('Crédito');
        } else {
          parsed.credito = this.parseDecimal(row[mapping.credito]);
        }
      }

      if (mapping.saldoAtual) {
        if (isCellEmpty(row[mapping.saldoAtual])) {
          celulasVazias.push('Saldo Atual');
        } else {
          parsed.saldoAtual = this.parseDecimal(row[mapping.saldoAtual]);
        }
      }

      // Armazenar células vazias para detecção de alertas
      if (celulasVazias.length > 0) {
        parsed._celulasVazias = celulasVazias;
      }

      // Log da primeira linha para debug
      if (index === 0) {
        this.logger.log(`Primeira linha parseada: ${JSON.stringify(parsed)}`);
        if (celulasVazias.length > 0) {
          this.logger.warn(
            `Células vazias detectadas na primeira linha: ${celulasVazias.join(', ')}`,
          );
        }
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
  private async updateContaCatalogo(
    empresaId: string, // Mantido para compatibilidade, mas não será usado
    linhas: ExcelRow[],
  ): Promise<void> {
    for (const linha of linhas) {
      if (
        !linha.classificacao ||
        !linha.nomeConta ||
        !linha.tipoConta ||
        linha.nivel === undefined
      ) {
        continue;
      }

      // Buscar conta pela classificação (única no sistema)
      const contaExistente = await this.prisma.contaCatalogo.findUnique({
        where: {
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
        // Nova conta (única no sistema, não por empresa)
        await this.prisma.contaCatalogo.create({
          data: {
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
   * Detecta alterações no cabeçalho do Excel
   */
  private async detectHeaderChanges(
    uploadId: string,
    currentHeaders: string[],
    mapping: TemplateMapping,
    empresaId: string,
    template?: { configuracao?: { columnMapping?: TemplateMapping } } | null,
  ): Promise<void> {
    const alertas: Array<{
      uploadId: string;
      tipo: 'CABECALHO_ALTERADO';
      severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
      mensagem: string;
    }> = [];

    // Obter cabeçalhos esperados do template ou do último upload
    const ultimoUpload = await this.prisma.upload.findFirst({
      where: {
        empresaId,
        status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    // Cabeçalhos esperados baseados no mapeamento
    const expectedHeaders = new Set<string>();
    Object.values(mapping).forEach((colName) => {
      if (colName && typeof colName === 'string') {
        expectedHeaders.add(colName);
      }
    });

    // Se há template configurado, usar os cabeçalhos do template como referência
    let templateHeaders: string[] = [];
    if (template?.configuracao?.columnMapping) {
      templateHeaders = Object.values(template.configuracao.columnMapping).filter(
        (col): col is string => typeof col === 'string' && col !== '',
      );
    }

    // Detectar colunas esperadas que não foram encontradas
    const colunasAusentes: string[] = [];
    expectedHeaders.forEach((expectedCol) => {
      // Verificar se a coluna existe (comparação case-insensitive e com normalização)
      const found = currentHeaders.some(
        (currentCol) =>
          currentCol.toLowerCase().trim() === expectedCol.toLowerCase().trim(),
      );
      if (!found) {
        colunasAusentes.push(expectedCol);
      }
    });

    // Detectar colunas novas (que não estavam no mapeamento esperado)
    const colunasNovas: string[] = [];
    currentHeaders.forEach((currentCol) => {
      if (currentCol && currentCol.trim() !== '') {
        const found = Array.from(expectedHeaders).some(
          (expectedCol) =>
            currentCol.toLowerCase().trim() === expectedCol.toLowerCase().trim(),
        );
        if (!found) {
          colunasNovas.push(currentCol);
        }
      }
    });

    // Gerar alertas
    if (colunasAusentes.length > 0) {
      const colunasAusentesStr = colunasAusentes.join(', ');
      const templateInfo = templateHeaders.length > 0 
        ? ' (conforme template configurado)' 
        : ' (conforme mapeamento esperado)';
      alertas.push({
        uploadId,
        tipo: 'CABECALHO_ALTERADO',
        severidade: 'ALTA',
        mensagem: `⚠️ ATENÇÃO: Colunas esperadas não encontradas no arquivo${templateInfo}: ${colunasAusentesStr}. Verifique se o formato do arquivo foi alterado pela contabilidade. O processamento pode ser afetado.`,
      });
    }

    if (colunasNovas.length > 0) {
      const colunasNovasStr = colunasNovas.join(', ');
      const templateInfo = templateHeaders.length > 0 
        ? ' (não estão no template configurado)' 
        : ' (não estavam no mapeamento esperado)';
      
      // Verificar se são colunas extras conhecidas (Mês, UF) que devem ser ignoradas
      const colunasExtrasConhecidas = colunasNovas.filter(col => {
        const colLower = col.toLowerCase().trim();
        return colLower === 'mês' || colLower === 'mes' || colLower === 'uf';
      });
      
      const colunasExtrasDesconhecidas = colunasNovas.filter(col => {
        const colLower = col.toLowerCase().trim();
        return colLower !== 'mês' && colLower !== 'mes' && colLower !== 'uf';
      });

      // Alerta para colunas extras conhecidas (informativo, severidade baixa)
      if (colunasExtrasConhecidas.length > 0) {
        const extrasStr = colunasExtrasConhecidas.join(', ');
        alertas.push({
          uploadId,
          tipo: 'CABECALHO_ALTERADO',
          severidade: 'BAIXA',
          mensagem: `ℹ️ Colunas extras detectadas: ${extrasStr}. Essas colunas serão ignoradas no processamento (o sistema já coleta mês/ano via formulário e UF não é necessário).`,
        });
      }

      // Alerta para colunas extras desconhecidas (mais crítico)
      if (colunasExtrasDesconhecidas.length > 0) {
        const desconhecidasStr = colunasExtrasDesconhecidas.join(', ');
        alertas.push({
          uploadId,
          tipo: 'CABECALHO_ALTERADO',
          severidade: colunasExtrasDesconhecidas.length > 3 ? 'ALTA' : 'MEDIA',
          mensagem: `⚠️ Colunas novas detectadas no arquivo${templateInfo}: ${desconhecidasStr}. Essas colunas serão ignoradas no processamento. O formato do arquivo pode ter sido alterado pela contabilidade.`,
        });
      }
    }

    // Comparar com último upload (se existir)
    if (ultimoUpload && ultimoUpload.id !== uploadId) {
      // Buscar headers do último upload (armazenar em metadata ou comparar estrutura)
      // Por enquanto, vamos apenas alertar sobre diferença no número de colunas
      const ultimoUploadLinhas = await this.prisma.linhaUpload.findFirst({
        where: { uploadId: ultimoUpload.id },
      });

      if (ultimoUploadLinhas) {
        // Comparar número de colunas detectadas
        const numColunasAtual = currentHeaders.filter((h) => h && h.trim() !== '').length;
        // Estimativa: se o número de colunas mudou significativamente, alertar
        if (numColunasAtual < expectedHeaders.size * 0.8) {
          alertas.push({
            uploadId,
            tipo: 'CABECALHO_ALTERADO',
            severidade: 'ALTA',
            mensagem: `Número de colunas detectado (${numColunasAtual}) é significativamente menor que o esperado. O formato do arquivo pode ter sido alterado.`,
          });
        }
      }
    }

    // Criar alertas
    if (alertas.length > 0) {
      await this.prisma.alerta.createMany({
        data: alertas,
      });
      this.logger.warn(
        `Alterações no cabeçalho detectadas: ${alertas.length} alertas criados`,
      );
    }
  }

  /**
   * Detecta alertas (saldos divergentes, contas novas)
   */
  private async detectAlerts(
    uploadId: string,
    linhas: ExcelRow[],
    empresaId: string,
  ): Promise<void> {
    const alertas: Array<{
      uploadId: string;
      linhaId?: string;
      tipo: 'SALDO_DIVERGENTE' | 'CONTA_NOVA' | 'DADO_INCONSISTENTE' | 'CONTINUIDADE_TEMPORAL_DIVERGENTE';
      severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
      mensagem: string;
    }> = [];

    // Buscar informações do upload atual
    const uploadAtual = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      select: { mes: true, ano: true },
    });

    if (!uploadAtual) {
      this.logger.error(`Upload ${uploadId} não encontrado`);
      return;
    }

    // Buscar linhas criadas para obter IDs
    const linhasCriadas = await this.prisma.linhaUpload.findMany({
      where: { uploadId },
      orderBy: { createdAt: 'asc' },
    });

    // Buscar upload do mês anterior para validação de continuidade temporal
    let uploadAnterior: { id: string; mes: number; ano: number; totalLinhas: number } | null = null;
    // Usar chave composta: classificacao + conta + subConta (pode haver múltiplas linhas com mesma classificação e conta)
    let linhasAnteriores: Map<string, { saldoAtual: number }> = new Map();

    if (uploadAtual.mes > 1) {
      // Mês anterior no mesmo ano
      // Buscar todos os uploads do mês anterior para verificar se há múltiplos
      const uploadsAnteriores = await this.prisma.upload.findMany({
        where: {
          empresaId,
          mes: uploadAtual.mes - 1,
          ano: uploadAtual.ano,
          status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, mes: true, ano: true, totalLinhas: true },
      });

      if (uploadsAnteriores.length > 0) {
        // Se há múltiplos uploads, preferir o que tem mais linhas (mais completo)
        uploadAnterior = uploadsAnteriores.reduce((prev, current) => 
          (current.totalLinhas > prev.totalLinhas) ? current : prev
        );
        
        if (uploadsAnteriores.length > 1) {
          this.logger.warn(
            `Múltiplos uploads encontrados para ${uploadAtual.mes - 1}/${uploadAtual.ano}: ${uploadsAnteriores.length}. Usando o upload com mais linhas (ID: ${uploadAnterior.id}, ${uploadAnterior.totalLinhas} linhas).`,
          );
        }
      }
    } else if (uploadAtual.mes === 1) {
      // Janeiro: mês anterior é dezembro do ano anterior
      const uploadsAnteriores = await this.prisma.upload.findMany({
        where: {
          empresaId,
          mes: 12,
          ano: uploadAtual.ano - 1,
          status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, mes: true, ano: true, totalLinhas: true },
      });

      if (uploadsAnteriores.length > 0) {
        // Se há múltiplos uploads, preferir o que tem mais linhas (mais completo)
        uploadAnterior = uploadsAnteriores.reduce((prev, current) => 
          (current.totalLinhas > prev.totalLinhas) ? current : prev
        );
        
        if (uploadsAnteriores.length > 1) {
          this.logger.warn(
            `Múltiplos uploads encontrados para 12/${uploadAtual.ano - 1}: ${uploadsAnteriores.length}. Usando o upload com mais linhas (ID: ${uploadAnterior.id}, ${uploadAnterior.totalLinhas} linhas).`,
          );
        }
      }
    }

    // Se encontrou upload anterior, buscar suas linhas
    if (uploadAnterior) {
      const linhasAnterioresData = await this.prisma.linhaUpload.findMany({
        where: { uploadId: uploadAnterior.id },
        select: { classificacao: true, conta: true, subConta: true, saldoAtual: true, nomeConta: true },
      });

      // Criar mapa usando chave composta: classificacao + conta + subConta
      // Isso garante que estamos comparando a linha correta (pode haver múltiplas linhas com mesma classificação e conta)
      for (const linha of linhasAnterioresData) {
        const saldoAtualNum = Number(linha.saldoAtual);
        // subConta pode ser null, então usar string vazia nesse caso
        const subContaStr = linha.subConta || '';
        const chave = `${linha.classificacao}|${linha.conta}|${subContaStr}`;
        linhasAnteriores.set(chave, {
          saldoAtual: saldoAtualNum,
        });
      }

      this.logger.log(
        `Upload anterior encontrado: ${uploadAnterior.mes}/${uploadAnterior.ano} (ID: ${uploadAnterior.id}) com ${linhasAnteriores.size} linhas`,
      );
      
      // Log de debug: verificar se a linha específica foi encontrada
      if (linhasAnteriores.size > 0) {
        const primeiraLinha = linhasAnterioresData[0];
        this.logger.log(
          `Exemplo de linha do upload anterior: ${primeiraLinha.classificacao} - ${primeiraLinha.nomeConta} - Saldo Atual: ${Number(primeiraLinha.saldoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        );
      }
    } else {
      this.logger.log(
        `Nenhum upload anterior encontrado para ${uploadAtual.mes}/${uploadAtual.ano}. Validação de continuidade temporal será ignorada.`,
      );
    }

    // Buscar contas novas do catálogo (agora unificado, sem empresaId)
    const contasNovas = await this.prisma.contaCatalogo.findMany({
      where: {
        status: 'NOVA',
      },
    });

    const contasNovasSet = new Set(contasNovas.map((c) => c.classificacao));

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const linhaCriada = linhasCriadas[i];

      // Verificar saldo divergente
      // Fórmula contábil conforme formato do Excel: Saldo Atual = Saldo Anterior + Débito + Crédito
      // No Excel, o crédito já vem com o sinal correto (negativo para saída, positivo para entrada)
      // Então simplesmente somamos todos os valores
      if (
        linha.saldoAnterior !== undefined &&
        linha.debito !== undefined &&
        linha.credito !== undefined &&
        linha.saldoAtual !== undefined
      ) {
        const saldoCalculado = linha.saldoAnterior + linha.debito + linha.credito;
        const diferenca = Math.abs(saldoCalculado - linha.saldoAtual);

        // Tolerância de 0.01 para diferenças de arredondamento
        if (diferenca > 0.01) {
          // Montar identificação completa da conta
          // Importante: dentro de uma Classificação podem existir várias contas
          const partesIdentificacao: string[] = [];
          
          if (linha.classificacao) {
            partesIdentificacao.push(`Classificação: ${linha.classificacao}`);
          }
          
          if (linha.conta) {
            partesIdentificacao.push(`Conta: ${linha.conta}`);
          } else {
            partesIdentificacao.push(`Conta: não informada`);
          }
          
          if (linha.subConta) {
            partesIdentificacao.push(`SubConta: ${linha.subConta}`);
          }
          
          const identificacaoCompleta = partesIdentificacao.join(' | ');
          const nomeContaCompleto = linha.nomeConta || 'Sem nome';
          
          alertas.push({
            uploadId,
            linhaId: linhaCriada?.id,
            tipo: 'SALDO_DIVERGENTE',
            severidade:
              diferenca > 1000 ? 'ALTA' : diferenca > 100 ? 'MEDIA' : 'BAIXA',
            mensagem: `Saldo divergente na conta "${nomeContaCompleto}" identificada por ${identificacaoCompleta}: esperado ${saldoCalculado.toFixed(2)}, encontrado ${linha.saldoAtual.toFixed(2)} (Saldo Anterior: ${linha.saldoAnterior.toFixed(2)}, Débito: ${linha.debito.toFixed(2)}, Crédito: ${linha.credito.toFixed(2)})`,
          });
        }
      }

      // Verificar continuidade temporal: saldo atual do mês anterior deve ser igual ao saldo anterior do mês atual
      if (
        uploadAnterior &&
        linha.classificacao &&
        linha.conta &&
        linha.saldoAnterior !== undefined
      ) {
        // Usar chave composta: classificacao + conta + subConta
        // subConta pode ser undefined/null, então usar string vazia nesse caso
        const subContaStr = linha.subConta || '';
        const chave = `${linha.classificacao}|${linha.conta}|${subContaStr}`;
        const linhaAnterior = linhasAnteriores.get(chave);
        
        if (linhaAnterior) {
          const saldoAtualMesAnterior = linhaAnterior.saldoAtual;
          const saldoAnteriorMesAtual = linha.saldoAnterior;
          const diferenca = Math.abs(saldoAtualMesAnterior - saldoAnteriorMesAtual);

          // Log de debug para investigação
          const subContaInfo = linha.subConta ? ` (SubConta: ${linha.subConta})` : '';
          this.logger.log(
            `Validação continuidade temporal - Conta: ${linha.classificacao} (${linha.conta})${subContaInfo} - ${linha.nomeConta} | Saldo Atual ${uploadAnterior.mes}/${uploadAnterior.ano}: ${saldoAtualMesAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Saldo Anterior ${uploadAtual.mes}/${uploadAtual.ano}: ${saldoAnteriorMesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Diferença: ${diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          );

          // Tolerância de 0.01 para diferenças de arredondamento
          if (diferenca > 0.01) {
            const mesAnteriorNome = this.getMesNome(uploadAnterior.mes);
            const mesAtualNome = this.getMesNome(uploadAtual.mes);
            
            // Montar identificação completa da conta
            // Importante: dentro de uma Classificação podem existir várias contas
            // Por isso precisamos identificar claramente: Classificação + Conta + SubConta
            const partesIdentificacao: string[] = [];
            
            if (linha.classificacao) {
              partesIdentificacao.push(`Classificação: ${linha.classificacao}`);
            }
            
            if (linha.conta) {
              partesIdentificacao.push(`Conta: ${linha.conta}`);
            } else {
              partesIdentificacao.push(`Conta: não informada`);
            }
            
            if (linha.subConta) {
              partesIdentificacao.push(`SubConta: ${linha.subConta}`);
            }
            
            const identificacaoCompleta = partesIdentificacao.join(' | ');
            const nomeContaCompleto = linha.nomeConta || 'Sem nome';
            
            alertas.push({
              uploadId,
              linhaId: linhaCriada?.id,
              tipo: 'CONTINUIDADE_TEMPORAL_DIVERGENTE',
              severidade:
                diferenca > 10000 ? 'ALTA' : diferenca > 1000 ? 'MEDIA' : 'BAIXA',
              mensagem: `⚠️ ALTERAÇÃO RETROATIVA DETECTADA: A conta "${nomeContaCompleto}" identificada por ${identificacaoCompleta} teve seu saldo alterado retroativamente. Saldo Atual de ${mesAnteriorNome}/${uploadAnterior.ano}: ${saldoAtualMesAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, mas Saldo Anterior de ${mesAtualNome}/${uploadAtual.ano}: ${saldoAnteriorMesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. A contabilidade pode ter feito um acerto no mês anterior sem avisar. Diferença: ${diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
            });
          }
        } else {
          // Log quando a linha não é encontrada no upload anterior
          const subContaInfo = linha.subConta ? ` (SubConta: ${linha.subConta})` : '';
          this.logger.warn(
            `Linha ${linha.classificacao} (${linha.conta})${subContaInfo} - ${linha.nomeConta} não encontrada no upload anterior ${uploadAnterior.mes}/${uploadAnterior.ano}. Pode ser uma conta nova ou a conta/subConta mudou.`,
          );
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

      // Verificar dados inconsistentes (campos obrigatórios ausentes)
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
          severidade: 'ALTA',
          mensagem: `Dados inconsistentes na linha: campos obrigatórios ausentes (Classificação, Nome da Conta, Tipo Conta ou Nível)`,
        });
      }

      // Verificar células vazias - em um balancete, todas as células são importantes
      if (linha._celulasVazias && linha._celulasVazias.length > 0) {
        // Campos numéricos vazios são mais críticos
        const camposCriticos = [
          'Saldo Anterior',
          'Débito',
          'Crédito',
          'Saldo Atual',
        ];
        const camposObrigatorios = [
          'Classificação',
          'Conta',
          'Nome da Conta',
          'Tipo Conta',
          'Nível',
        ];

        const temCampoCriticoVazio = linha._celulasVazias.some((campo) =>
          camposCriticos.includes(campo),
        );
        const temCampoObrigatorioVazio = linha._celulasVazias.some((campo) =>
          camposObrigatorios.includes(campo),
        );

        let severidade: 'BAIXA' | 'MEDIA' | 'ALTA' = 'MEDIA';
        if (temCampoCriticoVazio || temCampoObrigatorioVazio) {
          severidade = 'ALTA';
        }

        const camposVaziosStr = linha._celulasVazias.join(', ');
        alertas.push({
          uploadId,
          linhaId: linhaCriada?.id,
          tipo: 'DADO_INCONSISTENTE',
          severidade,
          mensagem: `Células vazias detectadas na linha ${linha.classificacao || 'sem classificação'}: ${camposVaziosStr}. Em um balancete, todas as células devem conter dados.`,
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
   * Converte valor para número (formato brasileiro: 1.234,56)
   */
  private parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    if (typeof value === 'number') {
      return value;
    }

    const str = String(value).trim();
    if (!str) {
      return undefined;
    }

    // Formato brasileiro: ponto para milhar, vírgula para decimal
    // Exemplo: "1.797.148,78" ou "-3.197.869,88"
    let cleaned = str.replace(/\./g, ''); // Remove pontos (separadores de milhar)
    cleaned = cleaned.replace(',', '.'); // Substitui vírgula por ponto (separador decimal)
    cleaned = cleaned.replace(/[^\d.-]/g, ''); // Remove outros caracteres não numéricos

    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Converte valor para decimal (formato brasileiro: 1.234,56)
   */
  private parseDecimal(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    const str = String(value).trim();
    if (!str) {
      return 0;
    }

    // Formato brasileiro: ponto para milhar, vírgula para decimal
    // Exemplo: "1.797.148,78" ou "-3.197.869,88"
    let cleaned = str.replace(/\./g, ''); // Remove pontos (separadores de milhar)
    cleaned = cleaned.replace(',', '.'); // Substitui vírgula por ponto (separador decimal)
    cleaned = cleaned.replace(/[^\d.-]/g, ''); // Remove outros caracteres não numéricos

    const num = parseFloat(cleaned);
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
    return (
      str === 'true' ||
      str === '1' ||
      str === 'sim' ||
      str === 's' ||
      str === 'x'
    );
  }

  /**
   * Retorna o nome do mês em português
   */
  private getMesNome(mes: number): string {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return meses[mes - 1] || `Mês ${mes}`;
  }
}
