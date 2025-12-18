import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ImportVendasDto } from '../dto/import-vendas.dto';
import { ColumnMapperService } from './column-mapper.service';
import {
  VendasValidatorService,
  VendaRawData,
} from './vendas-validator.service';
import { VendasAnalyticsService } from '../analytics/vendas-analytics.service';
import * as XLSX from 'xlsx';
import { Decimal } from '@prisma/client/runtime/library';

const BATCH_SIZE = 300; // Reduzido para melhor performance e evitar travamentos

interface VendaProcessada {
  nfe: string;
  idDoc: string; // Normalizado: nunca null
  referencia: string; // Normalizado: nunca null
  dataVenda: Date;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCliente?: string;
  ufDestino?: string;
  ufOrigem?: string;
  idProd?: string;
  prodCodMestre?: string;
  descricaoProduto?: string;
  marca: string; // Denormalizado
  grupo: string; // Denormalizado
  subgrupo: string; // Denormalizado
  tipoOperacao?: string;
  quantidade: Decimal;
  valorUnitario: Decimal;
  valorTotal: Decimal;
  empresaId?: string;
  produtoId?: string;
  metadata?: any;
  _produtoNaoEncontrado?: boolean; // Flag para estatísticas
}

@Injectable()
export class VendasImportService {
  private readonly logger = new Logger(VendasImportService.name);

  constructor(
    private prisma: PrismaService,
    private columnMapper: ColumnMapperService,
    private validator: VendasValidatorService,
    private analyticsService: VendasAnalyticsService,
  ) {}

  async importFromExcel(
    file: Express.Multer.File,
    importDto: ImportVendasDto,
    userId: string,
    userEmail: string,
  ) {
    this.logger.log(
      `Iniciando importação de vendas do arquivo: ${file.originalname}`,
    );

    let totalLinhas = 0;
    let produtosNaoEncontrados = 0;

    try {
      // 1. Ler arquivo Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
      });

      this.logger.log(`Arquivo lido: ${rawData.length} linhas encontradas`);

      // 2. Detectar cabeçalho
      const headerRowIndex = this.columnMapper.detectHeaderRow(
        rawData as unknown[][],
      );
      const headersRow = rawData[headerRowIndex];
      const headers = (Array.isArray(headersRow) ? headersRow : []).map((h) =>
        typeof h === 'string' ? h : String(h ?? ''),
      );

      this.logger.log(
        `Cabeçalhos encontrados no arquivo: ${JSON.stringify(headers)}`,
      );

      // 3. Mapear colunas - APENAS mapeamento manual do frontend
      if (
        !importDto.columnMapping ||
        Object.keys(importDto.columnMapping).length === 0
      ) {
        throw new BadRequestException(
          'Mapeamento de colunas é obrigatório. Por favor, mapeie as colunas no frontend antes de importar.',
        );
      }

      // Converter nomes dos campos do frontend para os nomes usados internamente
      const fieldNameMap: Record<string, string> = {
        data: 'data',
        qtd: 'qtd',
        valorUnit: 'valorUnit',
        valorTotal: 'valorTotal',
      };

      const columnMapping: Record<string, string | undefined> = {};
      for (const [frontendField, fileColumn] of Object.entries(
        importDto.columnMapping,
      )) {
        // Manter o nome original do campo (frontend usa 'data', backend usa 'data' no mapping mas 'dataVenda' no banco)
        const internalField = fieldNameMap[frontendField] || frontendField;
        columnMapping[internalField] = fileColumn;
      }

      this.logger.log(
        `Usando mapeamento manual do frontend: ${JSON.stringify(columnMapping)}`,
      );

      // Validar se os campos obrigatórios estão mapeados
      const camposObrigatorios = ['nfe', 'data', 'razaoSocial'];
      const camposFaltando = camposObrigatorios.filter(
        (campo) => !columnMapping[campo],
      );
      if (camposFaltando.length > 0) {
        throw new BadRequestException(
          `Campos obrigatórios não mapeados: ${camposFaltando.join(', ')}. Por favor, mapeie todos os campos obrigatórios no frontend.`,
        );
      }

      // 4. Validar e transformar dados
      const vendasRaw: VendaRawData[] = [];
      const dataRows = rawData.slice(headerRowIndex + 1);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as unknown[] | undefined;
        if (!row || row.length === 0) continue;

        try {
          // Converter array para objeto usando headers
          const rowObj: Record<string, unknown> = {};
          for (let idx = 0; idx < headers.length; idx++) {
            const header = headers[idx];
            if (header) {
              let headerStr = '';
              if (typeof header === 'string') {
                headerStr = header;
              } else if (
                typeof header === 'number' ||
                typeof header === 'boolean'
              ) {
                headerStr = String(header);
              }
              if (headerStr && idx < row.length) {
                const rowValue = row[idx] ?? null;
                rowObj[headerStr] = rowValue;
              }
            }
          }

          const vendaRaw = this.validator.validateAndTransform(
            rowObj,
            columnMapping,
            headerRowIndex + 2 + i,
          );
          vendasRaw.push(vendaRaw);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erro desconhecido';
          this.logger.warn(
            `Erro na linha ${headerRowIndex + 2 + i}: ${errorMessage}`,
          );
          // erroCount será atualizado durante o processamento em background
        }
      }

      totalLinhas = vendasRaw.length;
      this.logger.log(`${totalLinhas} vendas validadas`);

      // 5. Normalizar campos null para chave única
      const vendasNormalizadas = vendasRaw.map((v) => ({
        ...v,
        idDoc: v.idDoc || '',
        referencia: v.referencia || '',
      }));

      // 6. Denormalizar dados de produtos (marca, grupo, subgrupo)
      const { vendasComDadosProduto, produtosNaoEncontradosCount } =
        await this.denormalizarDadosProduto(vendasNormalizadas);
      produtosNaoEncontrados = produtosNaoEncontradosCount;

      // 7. Criar log de importação ANTES de processar vendas
      // NOTA: Verificação de duplicatas será feita durante o processamento em background
      // para não bloquear a resposta HTTP
      // IMPORTANTE: Criar o log primeiro para ter o ID disponível para associar às vendas
      // Garantir que as colunas existem antes de criar o log
      try {
        await this.prisma.$executeRaw`
          ALTER TABLE "VendaImportacaoLog" 
          ADD COLUMN IF NOT EXISTS "duplicatasCount" INTEGER NOT NULL DEFAULT 0;
        `;
        await this.prisma.$executeRaw`
          ALTER TABLE "VendaImportacaoLog" 
          ADD COLUMN IF NOT EXISTS "novosCount" INTEGER NOT NULL DEFAULT 0;
        `;
      } catch (error) {
        // Ignorar erros se as colunas já existirem
        this.logger.debug('Colunas já existem ou erro ao criar:', error);
      }

      const log = await this.prisma.vendaImportacaoLog.create({
        data: {
          nomeArquivo: file.originalname,
          mappingName: importDto.mappingName,
          totalLinhas,
          sucessoCount: 0, // Será atualizado depois
          erroCount: 0,
          produtosNaoEncontrados: 0,
          duplicatasCount: 0,
          novosCount: 0,
          progresso: 0, // Iniciar progresso em 0%
          linhasProcessadas: 0, // Iniciar linhas processadas em 0
          usuarioEmail: userEmail,
          usuarioId: userId,
        },
      });

      const importacaoLogId = log.id;
      this.logger.log(`Log de importação criado: ${importacaoLogId}`);

      // IMPORTANTE: Processar vendas em background para não bloquear a resposta
      // Retornar o logId imediatamente para o frontend poder mostrar progresso
      // A verificação de duplicatas será feita durante o processamento em background
      this.processarVendasEmBackground(
        vendasComDadosProduto,
        importDto.empresaId,
        importacaoLogId,
        totalLinhas,
        produtosNaoEncontrados,
      ).catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Erro ao processar vendas em background: ${errorMessage}`,
          errorStack,
        );
        // Atualizar log com erro
        this.prisma.vendaImportacaoLog
          .update({
            where: { id: importacaoLogId },
            data: {
              erroCount: totalLinhas,
              progresso: 100,
            },
          })
          .catch((updateError: unknown) => {
            const updateErrorMessage =
              updateError instanceof Error
                ? updateError.message
                : 'Erro desconhecido';
            this.logger.error(
              `Erro ao atualizar log após falha: ${updateErrorMessage}`,
            );
          });
      });

      // Retornar imediatamente com o logId
      return {
        success: true,
        message: 'Importação iniciada. Processando em background...',
        logId: importacaoLogId,
        estatisticas: {
          totalLinhas,
          sucessoCount: 0, // Será atualizado durante o processamento
          erroCount: 0,
          produtosNaoEncontrados,
          duplicatas: 0, // Será calculado durante o processamento
          novos: 0, // Será calculado durante o processamento
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Erro ao importar vendas: ${errorMessage}`, errorStack);

      // Salvar log de erro
      try {
        await this.prisma.$executeRaw`
          ALTER TABLE "VendaImportacaoLog" 
          ADD COLUMN IF NOT EXISTS "duplicatasCount" INTEGER NOT NULL DEFAULT 0;
        `;
        await this.prisma.$executeRaw`
          ALTER TABLE "VendaImportacaoLog" 
          ADD COLUMN IF NOT EXISTS "novosCount" INTEGER NOT NULL DEFAULT 0;
        `;
      } catch (alterError) {
        this.logger.debug('Colunas já existem ou erro ao criar:', alterError);
      }

      await this.prisma.vendaImportacaoLog.create({
        data: {
          nomeArquivo: file.originalname,
          mappingName: importDto.mappingName,
          totalLinhas,
          sucessoCount: 0,
          erroCount: totalLinhas,
          produtosNaoEncontrados: 0,
          duplicatasCount: 0,
          novosCount: 0,
          progresso: 100,
          linhasProcessadas: totalLinhas,
          usuarioEmail: userEmail,
          usuarioId: userId,
        },
      });

      throw new BadRequestException(`Erro ao importar vendas: ${errorMessage}`);
    }
  }

  /**
   * Processa vendas em background (assíncrono)
   */
  private async processarVendasEmBackground(
    vendasComDadosProduto: VendaProcessada[],
    empresaId: string,
    importacaoLogId: string,
    totalLinhas: number,
    produtosNaoEncontrados: number,
  ): Promise<void> {
    const startTime = Date.now();
    let sucessoCount = 0;
    let erroCount = 0;
    let duplicatasCount = 0;
    let novosCount = 0;

    // Verificar duplicatas em chunks durante o processamento (não bloqueia resposta HTTP)
    // Passar importacaoLogId para atualizar progresso durante a verificação
    const { duplicatas, novos } = await this.verificarDuplicatas(
      vendasComDadosProduto,
      importacaoLogId,
    );
    duplicatasCount = duplicatas;
    novosCount = novos;

    // Atualizar log com contagem de duplicatas
    try {
      await this.prisma.vendaImportacaoLog.update({
        where: { id: importacaoLogId },
        data: {
          duplicatasCount,
          novosCount,
          progresso: 5, // 5% após verificação de duplicatas
        },
      });
    } catch (error) {
      this.logger.warn(
        `Erro ao atualizar log após verificação de duplicatas: ${error}`,
      );
    }

    // 10. Processar vendas em lotes (agora com importacaoLogId)
    // IMPORTANTE: Analytics será atualizado em lotes durante a importação para melhor performance
    const totalLinhasParaProcessar = vendasComDadosProduto.length;
    let linhasProcessadas = 0;
    const ANALYTICS_BATCH_SIZE = 1000; // Processar analytics a cada 1000 vendas para evitar sobrecarga

    for (let i = 0; i < vendasComDadosProduto.length; i += BATCH_SIZE) {
      const chunk = vendasComDadosProduto.slice(i, i + BATCH_SIZE);
      // Garantir que todas as vendas tenham empresaId definido
      const chunkComEmpresaId = chunk.map((v) => ({
        ...v,
        empresaId: v.empresaId || empresaId,
      })) as Array<{
        nfe: string;
        idDoc: string;
        referencia: string;
        dataVenda: Date;
        razaoSocial: string;
        nomeFantasia?: string;
        cnpjCliente?: string;
        ufDestino?: string;
        ufOrigem?: string;
        idProd?: string;
        prodCodMestre?: string;
        descricaoProduto?: string;
        marca: string;
        grupo: string;
        subgrupo: string;
        tipoOperacao?: string;
        quantidade: Decimal;
        valorUnitario: Decimal;
        valorTotal: Decimal;
        empresaId: string;
        produtoId?: string;
        metadata?: unknown;
      }>;
      const { sucesso, erros } = await this.processarLote(
        chunkComEmpresaId,
        empresaId,
        importacaoLogId, // NOVO: passar importacaoLogId
      );
      sucessoCount += sucesso;
      erroCount += erros;
      linhasProcessadas += chunk.length;

      // Atualizar analytics em lotes durante a importação (não apenas no final)
      // Isso evita problemas de memória e timeout com grandes volumes de dados
      if (linhasProcessadas % ANALYTICS_BATCH_SIZE === 0 || linhasProcessadas === totalLinhasParaProcessar) {
        try {
          const vendasParaAnalytics = chunkComEmpresaId.map((v) => ({
            dataVenda: v.dataVenda,
            nomeFantasia: v.nomeFantasia,
            marca: v.marca || 'DESCONHECIDA',
            grupo: v.grupo || 'DESCONHECIDO',
            subgrupo: v.subgrupo || 'DESCONHECIDO',
            tipoOperacao: v.tipoOperacao,
            ufDestino: v.ufDestino,
            empresaId: v.empresaId,
            valorTotal: v.valorTotal,
            quantidade: v.quantidade,
          }));
          
          // Processar analytics de forma assíncrona para não bloquear a importação
          // Mas aguardar para garantir que não haja perda de dados
          await this.analyticsService.atualizarAnalytics(vendasParaAnalytics);
          
          this.logger.log(
            `Analytics atualizado para lote de ${vendasParaAnalytics.length} vendas (${linhasProcessadas}/${totalLinhasParaProcessar})`,
          );
        } catch (error) {
          // Logar erro mas não interromper a importação
          // O analytics pode ser recalculado depois se necessário
          this.logger.error(
            `Erro ao atualizar analytics para lote (não crítico): ${error}`,
          );
        }
      }

      // Atualizar progresso em tempo real
      const progresso = Math.round(
        (linhasProcessadas / totalLinhasParaProcessar) * 100,
      );
      await this.prisma.vendaImportacaoLog.update({
        where: { id: importacaoLogId },
        data: {
          progresso,
          linhasProcessadas,
          sucessoCount,
          erroCount,
        },
      });

      this.logger.log(
        `Progresso: ${progresso}% (${linhasProcessadas}/${totalLinhasParaProcessar} linhas processadas)`,
      );
    }

    // 12. Atualizar log com estatísticas finais (100% concluído)
    await this.prisma.vendaImportacaoLog.update({
      where: { id: importacaoLogId },
      data: {
        sucessoCount,
        erroCount,
        produtosNaoEncontrados,
        duplicatasCount: duplicatasCount,
        novosCount: novosCount,
        progresso: 100, // 100% concluído
        linhasProcessadas: totalLinhasParaProcessar,
      },
    });

    const tempoTotal = ((Date.now() - startTime) / 1000).toFixed(2);

    this.logger.log(
      `Importação concluída: ${sucessoCount} sucessos, ${erroCount} erros em ${tempoTotal}s`,
    );
  }

  /**
   * Denormaliza marca, grupo e subgrupo de produtos
   */
  private async denormalizarDadosProduto(vendas: VendaRawData[]): Promise<{
    vendasComDadosProduto: VendaProcessada[];
    produtosNaoEncontradosCount: number;
  }> {
    const referencias = vendas
      .map((v) => v.referencia)
      .filter((r): r is string => Boolean(r && r !== ''));
    const idProds = vendas
      .map((v) => v.idProd)
      .filter((id): id is string => Boolean(id && id !== ''));

    // PostgreSQL tem limite de 32767 parâmetros em prepared statements
    // Dividir em chunks de 10000 para garantir margem de segurança
    const CHUNK_SIZE = 10000;
    const produtos: Array<{
      id: string;
      referencia: string | null;
      id_prod: string | null;
      marca: string | null;
      grupo: string | null;
      subgrupo: string | null;
    }> = [];

    this.logger.log(
      `🔍 Buscando produtos: ${referencias.length} referências, ${idProds.length} IDs`,
    );

    // Buscar produtos por referências em chunks
    const totalChunksRefs = Math.ceil(referencias.length / CHUNK_SIZE);
    for (let i = 0; i < referencias.length; i += CHUNK_SIZE) {
      const chunkRefs = referencias.slice(i, i + CHUNK_SIZE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
      this.logger.log(
        `📦 Buscando produtos por referência: chunk ${chunkNumber}/${totalChunksRefs} (${chunkRefs.length} referências)`,
      );

      const produtosChunk = await this.prisma.produto.findMany({
        where: {
          referencia: { in: chunkRefs },
        },
        select: {
          id: true,
          referencia: true,
          id_prod: true,
          marca: true,
          grupo: true,
          subgrupo: true,
        },
      });
      produtos.push(...produtosChunk);
    }

    // Buscar produtos por id_prod em chunks
    const totalChunksIds = Math.ceil(idProds.length / CHUNK_SIZE);
    for (let i = 0; i < idProds.length; i += CHUNK_SIZE) {
      const chunkIds = idProds.slice(i, i + CHUNK_SIZE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
      this.logger.log(
        `📦 Buscando produtos por ID: chunk ${chunkNumber}/${totalChunksIds} (${chunkIds.length} IDs)`,
      );

      const produtosChunk = await this.prisma.produto.findMany({
        where: {
          id_prod: { in: chunkIds },
        },
        select: {
          id: true,
          referencia: true,
          id_prod: true,
          marca: true,
          grupo: true,
          subgrupo: true,
        },
      });
      produtos.push(...produtosChunk);
    }

    // Remover duplicatas (mesmo produto pode aparecer em ambos os chunks)
    const produtosUnicos = new Map<string, (typeof produtos)[0]>();
    produtos.forEach((p) => {
      if (!produtosUnicos.has(p.id)) {
        produtosUnicos.set(p.id, p);
      }
    });
    const produtosFinal = Array.from(produtosUnicos.values());

    // Criar mapas
    const marcaMap = new Map<string, string>();
    const grupoMap = new Map<string, string>();
    const subgrupoMap = new Map<string, string>();
    const produtoIdMap = new Map<string, string>(); // Para relacionamento

    produtosFinal.forEach((p) => {
      const keyRef = p.referencia || '';
      const keyId = p.id_prod || '';

      if (keyRef) {
        marcaMap.set(keyRef, p.marca || 'DESCONHECIDA');
        grupoMap.set(keyRef, p.grupo || 'DESCONHECIDO');
        subgrupoMap.set(keyRef, p.subgrupo || 'DESCONHECIDO');
        produtoIdMap.set(keyRef, p.id);
      }
      if (keyId) {
        marcaMap.set(keyId, p.marca || 'DESCONHECIDA');
        grupoMap.set(keyId, p.grupo || 'DESCONHECIDO');
        subgrupoMap.set(keyId, p.subgrupo || 'DESCONHECIDO');
        produtoIdMap.set(keyId, p.id);
      }
    });

    // Processar vendas
    let produtosNaoEncontradosCount = 0;

    const vendasComDadosProduto = vendas.map((venda) => {
      const referencia = venda.referencia || '';
      const idProd = venda.idProd || '';

      // Tentar obter dados
      const marca =
        marcaMap.get(referencia) || marcaMap.get(idProd) || 'DESCONHECIDA';
      const grupo =
        grupoMap.get(referencia) || grupoMap.get(idProd) || 'DESCONHECIDO';
      const subgrupo =
        subgrupoMap.get(referencia) ||
        subgrupoMap.get(idProd) ||
        'DESCONHECIDO';
      const produtoId =
        produtoIdMap.get(referencia) || produtoIdMap.get(idProd);

      // Detectar se produto não foi encontrado
      const produtoNaoEncontrado =
        !marcaMap.has(referencia) &&
        !marcaMap.has(idProd) &&
        (referencia || idProd);

      if (produtoNaoEncontrado) {
        produtosNaoEncontradosCount++;
        this.logger.warn(
          `⚠️ Produto não encontrado: referencia="${referencia}", idProd="${idProd}" - usando valores padrão`,
        );
      }

      return {
        ...venda,
        dataVenda: new Date(venda.dataVenda),
        quantidade: new Decimal(venda.quantidade),
        valorUnitario: new Decimal(venda.valorUnitario),
        valorTotal: new Decimal(venda.valorTotal),
        marca,
        grupo,
        subgrupo,
        produtoId,
        _produtoNaoEncontrado: produtoNaoEncontrado,
      } as VendaProcessada;
    });

    this.logger.log(
      `📊 Estatísticas: ${produtosNaoEncontradosCount} produtos não encontrados (usando valores padrão)`,
    );

    return {
      vendasComDadosProduto,
      produtosNaoEncontradosCount,
    };
  }

  /**
   * Verifica duplicatas pré-importação
   * Processa em chunks para evitar exceder limite de parâmetros do PostgreSQL (32767)
   * Atualiza o log de importação com progresso durante a verificação
   */
  private async verificarDuplicatas(
    vendas: VendaProcessada[],
    importacaoLogId?: string,
  ): Promise<{ duplicatas: number; novos: number }> {
    const totalVendas = vendas.length;
    this.logger.log(
      `🔍 Iniciando verificação de duplicatas para ${totalVendas.toLocaleString('pt-BR')} vendas...`,
    );

    const chaves = vendas.map((v) => ({
      nfe: v.nfe,
      idDoc: v.idDoc || '',
      referencia: v.referencia || '',
    }));

    // PostgreSQL tem limite de 32767 parâmetros em prepared statements
    // Dividir em chunks menores (3000) para melhor performance e evitar timeout
    // Cada chave usa 3 parâmetros (nfe, idDoc, referencia), então 3000 chaves = 9000 parâmetros
    const CHUNK_SIZE = 3000;
    const chavesExistentes = new Set<string>();
    const totalChunks = Math.ceil(chaves.length / CHUNK_SIZE);
    const startTime = Date.now();

    this.logger.log(
      `🔍 Processando ${totalChunks} chunks de até ${CHUNK_SIZE} chaves cada...`,
    );

    // Buscar registros existentes em chunks
    for (let i = 0; i < chaves.length; i += CHUNK_SIZE) {
      const chunk = chaves.slice(i, i + CHUNK_SIZE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
      const chunkStartTime = Date.now();

      this.logger.log(
        `🔍 Verificando duplicatas: chunk ${chunkNumber}/${totalChunks} (${chunk.length.toLocaleString('pt-BR')} chaves)`,
      );

      // Atualizar progresso no log se tiver importacaoLogId
      if (importacaoLogId) {
        const progressoVerificacao = Math.floor(
          (chunkNumber / totalChunks) * 5,
        ); // 0-5% do progresso total
        try {
          await this.prisma.vendaImportacaoLog.update({
            where: { id: importacaoLogId },
            data: {
              progresso: progressoVerificacao,
            },
          });
        } catch (error) {
          // Ignorar erros de atualização de progresso (não crítico)
          this.logger.debug(`Erro ao atualizar progresso: ${error}`);
        }
      }

      // Usar query otimizada: buscar apenas os campos necessários
      const existentes = await this.prisma.venda.findMany({
        where: {
          OR: chunk.map((chave) => ({
            nfe: chave.nfe,
            idDoc: chave.idDoc,
            referencia: chave.referencia,
          })),
        },
        select: {
          nfe: true,
          idDoc: true,
          referencia: true,
        },
        // Limitar resultados (não deve ser necessário, mas ajuda em caso de muitos matches)
        take: chunk.length * 2, // Máximo teórico: cada chave pode ter 1 match
      });

      // Adicionar chaves existentes ao Set
      existentes.forEach((e) => {
        const key = `${e.nfe}|${e.idDoc || ''}|${e.referencia || ''}`;
        chavesExistentes.add(key);
      });

      const chunkTime = ((Date.now() - chunkStartTime) / 1000).toFixed(2);
      const tempoTotal = ((Date.now() - startTime) / 1000).toFixed(2);
      const tempoEstimado =
        totalChunks > chunkNumber
          ? (
              (((Date.now() - startTime) / chunkNumber) *
                (totalChunks - chunkNumber)) /
              1000
            ).toFixed(0)
          : '0';

      this.logger.log(
        `✅ Chunk ${chunkNumber}/${totalChunks} processado em ${chunkTime}s: ${existentes.length} duplicatas encontradas. Tempo total: ${tempoTotal}s. Tempo estimado restante: ~${tempoEstimado}s`,
      );
    }

    let duplicatas = 0;
    let novos = 0;

    // Contar duplicatas e novos
    chaves.forEach((chave) => {
      const key = `${chave.nfe}|${chave.idDoc}|${chave.referencia}`;
      if (chavesExistentes.has(key)) {
        duplicatas++;
      } else {
        novos++;
      }
    });

    this.logger.log(
      `✅ Verificação de duplicatas concluída: ${novos.toLocaleString('pt-BR')} novos, ${duplicatas.toLocaleString('pt-BR')} duplicatas (serão atualizados)`,
    );

    return { duplicatas, novos };
  }

  /**
   * Prepara venda para UPSERT
   */
  private prepararVendaParaUpsert(
    venda: VendaProcessada,
    empresaId: string,
    importacaoLogId: string, // NOVO PARÂMETRO
  ): {
    nfe: string;
    idDoc: string;
    referencia: string;
    dataVenda: Date;
    razaoSocial: string;
    nomeFantasia?: string;
    cnpjCliente?: string;
    ufDestino?: string;
    ufOrigem?: string;
    idProd?: string;
    prodCodMestre?: string;
    descricaoProduto?: string;
    marca: string;
    grupo: string;
    subgrupo: string;
    tipoOperacao?: string;
    quantidade: Decimal;
    valorUnitario: Decimal;
    valorTotal: Decimal;
    empresaId: string;
    produtoId?: string;
    importacaoLogId: string; // NOVO CAMPO
    metadata?: unknown;
  } {
    return {
      nfe: venda.nfe,
      idDoc: venda.idDoc || '',
      referencia: venda.referencia || '',
      dataVenda: new Date(venda.dataVenda),
      razaoSocial: venda.razaoSocial,
      nomeFantasia: venda.nomeFantasia,
      cnpjCliente: venda.cnpjCliente,
      ufDestino: venda.ufDestino,
      ufOrigem: venda.ufOrigem,
      idProd: venda.idProd,
      prodCodMestre: venda.prodCodMestre,
      descricaoProduto: venda.descricaoProduto,
      marca: venda.marca,
      grupo: venda.grupo,
      subgrupo: venda.subgrupo,
      tipoOperacao: venda.tipoOperacao,
      quantidade: new Decimal(venda.quantidade.toString()),
      valorUnitario: new Decimal(venda.valorUnitario.toString()),
      valorTotal: new Decimal(venda.valorTotal.toString()),
      empresaId: empresaId, // Sempre usa o empresaId informado pelo usuário
      produtoId: venda.produtoId,
      importacaoLogId, // NOVO: associar venda à importação
      metadata: venda.metadata,
    };
  }

  /**
   * Processa um lote de vendas com UPSERT
   * Usa abordagem de findFirst + update/create porque Prisma não suporta upsert direto com chave única composta
   */
  private async processarLote(
    vendas: Array<{
      nfe: string;
      idDoc: string;
      referencia: string;
      dataVenda: Date;
      razaoSocial: string;
      nomeFantasia?: string;
      cnpjCliente?: string;
      ufDestino?: string;
      ufOrigem?: string;
      idProd?: string;
      prodCodMestre?: string;
      descricaoProduto?: string;
      marca: string;
      grupo: string;
      subgrupo: string;
      tipoOperacao?: string;
      quantidade: Decimal;
      valorUnitario: Decimal;
      valorTotal: Decimal;
      empresaId: string;
      produtoId?: string;
      metadata?: unknown;
    }>,
    empresaId: string,
    importacaoLogId: string, // NOVO PARÂMETRO
  ): Promise<{ sucesso: number; erros: number }> {
    let sucesso = 0;
    let erros = 0;

    for (const venda of vendas) {
      try {
        // Preparar dados da venda com importacaoLogId
        const vendaData = this.prepararVendaParaUpsert(
          venda as VendaProcessada,
          empresaId,
          importacaoLogId,
        );

        // Buscar registro existente usando a chave única composta
        const existente = await this.prisma.venda.findFirst({
          where: {
            nfe: vendaData.nfe,
            idDoc: vendaData.idDoc || '',
            referencia: vendaData.referencia || '',
          },
        });

        if (existente) {
          // Atualizar registro existente (incluindo importacaoLogId)
          await this.prisma.venda.update({
            where: { id: existente.id },
            data: {
              dataVenda: vendaData.dataVenda,
              razaoSocial: vendaData.razaoSocial,
              nomeFantasia: vendaData.nomeFantasia,
              cnpjCliente: vendaData.cnpjCliente,
              ufDestino: vendaData.ufDestino,
              ufOrigem: vendaData.ufOrigem,
              idProd: vendaData.idProd,
              prodCodMestre: vendaData.prodCodMestre,
              descricaoProduto: vendaData.descricaoProduto,
              marca: vendaData.marca,
              grupo: vendaData.grupo,
              subgrupo: vendaData.subgrupo,
              tipoOperacao: vendaData.tipoOperacao,
              quantidade: vendaData.quantidade,
              valorUnitario: vendaData.valorUnitario,
              valorTotal: vendaData.valorTotal,
              empresaId: vendaData.empresaId,
              produtoId: vendaData.produtoId,
              importacaoLogId: vendaData.importacaoLogId, // NOVO: atualizar importacaoLogId
              metadata: (vendaData.metadata as Prisma.InputJsonValue) ?? null,
            },
          });
        } else {
          // Criar novo registro (com importacaoLogId)
          await this.prisma.venda.create({
            data: {
              ...vendaData,
              metadata: (vendaData.metadata as Prisma.InputJsonValue) ?? null,
            } as Prisma.VendaCreateInput,
          });
        }
        sucesso++;
      } catch (error) {
        erros++;
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(
          `Erro ao processar venda ${venda.nfe}: ${errorMessage}`,
        );
      }
    }

    return { sucesso, erros };
  }
}
