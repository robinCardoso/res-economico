import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ImportPedidosDto } from '../dto/import-pedidos.dto';
import { ColumnMapperService } from './column-mapper.service';
import {
  PedidosValidatorService,
  PedidoRawData,
} from './pedidos-validator.service';
import { PedidosAnalyticsService } from '../analytics/pedidos-analytics.service';
import * as XLSX from 'xlsx';
import { Decimal } from '@prisma/client/runtime/library';

const BATCH_SIZE = 300; // Reduzido para melhor performance e evitar travamentos

interface PedidoProcessada {
  numeroPedido: string;
  idDoc: string; // Normalizado: nunca null
  referencia: string; // Normalizado: nunca null
  dataPedido: Date;
  nomeFantasia: string;
  idProd?: string;
  descricaoProduto?: string;
  marca: string; // Denormalizado
  grupo: string; // Denormalizado
  subgrupo: string; // Denormalizado
  quantidade: Decimal;
  valorUnitario: Decimal;
  valorTotal: Decimal;
  empresaId?: string;
  produtoId?: string;
  metadata?: any;
  _produtoNaoEncontrado?: boolean; // Flag para estatísticas
}

@Injectable()
export class PedidosImportService {
  private readonly logger = new Logger(PedidosImportService.name);

  constructor(
    private prisma: PrismaService,
    private columnMapper: ColumnMapperService,
    private validator: PedidosValidatorService,
    private analyticsService: PedidosAnalyticsService,
  ) {}

  async importFromExcel(
    file: Express.Multer.File,
    importDto: ImportPedidosDto,
    userId: string,
    userEmail: string,
  ) {
    this.logger.log(
      `Iniciando importação de pedidos do arquivo: ${file.originalname}`,
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
        // Manter o nome original do campo (frontend usa 'data', backend usa 'data' no mapping mas 'dataPedido' no banco)
        const internalField = fieldNameMap[frontendField] || frontendField;
        columnMapping[internalField] = fileColumn;
      }

      this.logger.log(
        `Usando mapeamento manual do frontend: ${JSON.stringify(columnMapping)}`,
      );

      // Validar se os campos obrigatórios estão mapeados
      const camposObrigatorios = ['numeroPedido', 'data', 'nomeFantasia'];
      const camposFaltando = camposObrigatorios.filter(
        (campo) => !columnMapping[campo],
      );
      if (camposFaltando.length > 0) {
        throw new BadRequestException(
          `Campos obrigatórios não mapeados: ${camposFaltando.join(', ')}. Por favor, mapeie todos os campos obrigatórios no frontend.`,
        );
      }

      // 4. Validar e transformar dados
      const pedidosRaw: PedidoRawData[] = [];
      // Ignorar a última linha que contém totais
      const allDataRows = rawData.slice(headerRowIndex + 1);
      const dataRows = allDataRows.length > 0 ? allDataRows.slice(0, -1) : [];

      this.logger.log(
        `Processando ${dataRows.length} linhas de dados (última linha de totais ignorada)`,
      );

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

          const pedidoRaw = this.validator.validateAndTransform(
            rowObj,
            columnMapping,
            headerRowIndex + 2 + i,
          );
          pedidosRaw.push(pedidoRaw);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erro desconhecido';
          this.logger.warn(
            `Erro na linha ${headerRowIndex + 2 + i}: ${errorMessage}`,
          );
          // erroCount será atualizado durante o processamento em background
        }
      }

      totalLinhas = pedidosRaw.length;
      this.logger.log(`${totalLinhas} pedidos validados`);

      // 5. Normalizar campos null para chave única
      const pedidosNormalizados = pedidosRaw.map((p) => ({
        ...p,
        idDoc: p.idDoc || '',
        referencia: p.referencia || '',
      }));

      // 6. Denormalizar dados de produtos (marca, grupo, subgrupo)
      const { pedidosComDadosProduto, produtosNaoEncontradosCount } =
        await this.denormalizarDadosProduto(pedidosNormalizados);
      produtosNaoEncontrados = produtosNaoEncontradosCount;

      // 7. Criar log de importação ANTES de processar pedidos
      // NOTA: Verificação de duplicatas será feita durante o processamento em background
      // para não bloquear a resposta HTTP
      // IMPORTANTE: Criar o log primeiro para ter o ID disponível para associar aos pedidos
      // Garantir que as colunas existem antes de criar o log
      try {
        await this.prisma.$executeRaw`
          ALTER TABLE "PedidoImportacaoLog" 
          ADD COLUMN IF NOT EXISTS "duplicatasCount" INTEGER NOT NULL DEFAULT 0;
        `;
        await this.prisma.$executeRaw`
          ALTER TABLE "PedidoImportacaoLog" 
          ADD COLUMN IF NOT EXISTS "novosCount" INTEGER NOT NULL DEFAULT 0;
        `;
      } catch (error) {
        // Ignorar erros se as colunas já existirem
        this.logger.debug('Colunas já existem ou erro ao criar:', error);
      }

      const log = await this.prisma.pedidoImportacaoLog.create({
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

      // IMPORTANTE: Processar pedidos em background para não bloquear a resposta
      // Retornar o logId imediatamente para o frontend poder mostrar progresso
      // A verificação de duplicatas será feita durante o processamento em background
      this.processarPedidosEmBackground(
        pedidosComDadosProduto,
        importDto.empresaId,
        importacaoLogId,
        totalLinhas,
        produtosNaoEncontrados,
      ).catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Erro ao processar pedidos em background: ${errorMessage}`,
          errorStack,
        );
        // Atualizar log com erro
        this.prisma.pedidoImportacaoLog
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
      this.logger.error(`Erro ao importar pedidos: ${errorMessage}`, errorStack);

      // Salvar log de erro
      try {
        await this.prisma.$executeRaw`
          ALTER TABLE "PedidoImportacaoLog" 
          ADD COLUMN IF NOT EXISTS "duplicatasCount" INTEGER NOT NULL DEFAULT 0;
        `;
        await this.prisma.$executeRaw`
          ALTER TABLE "PedidoImportacaoLog" 
          ADD COLUMN IF NOT EXISTS "novosCount" INTEGER NOT NULL DEFAULT 0;
        `;
      } catch (alterError) {
        this.logger.debug('Colunas já existem ou erro ao criar:', alterError);
      }

      await this.prisma.pedidoImportacaoLog.create({
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

      throw new BadRequestException(`Erro ao importar pedidos: ${errorMessage}`);
    }
  }

  /**
   * Processa pedidos em background (assíncrono)
   */
  private async processarPedidosEmBackground(
    pedidosComDadosProduto: PedidoProcessada[],
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
      pedidosComDadosProduto,
      importacaoLogId,
    );
    duplicatasCount = duplicatas;
    novosCount = novos;

    // Atualizar log com contagem de duplicatas
    try {
      await this.prisma.pedidoImportacaoLog.update({
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

    // 10. Processar pedidos em lotes (agora com importacaoLogId)
    // IMPORTANTE: Analytics será atualizado em lotes durante a importação para melhor performance
    const totalLinhasParaProcessar = pedidosComDadosProduto.length;
    let linhasProcessadas = 0;
    const ANALYTICS_BATCH_SIZE = 1000; // Processar analytics a cada 1000 pedidos para evitar sobrecarga

    for (let i = 0; i < pedidosComDadosProduto.length; i += BATCH_SIZE) {
      const chunk = pedidosComDadosProduto.slice(i, i + BATCH_SIZE);
      // Garantir que todos os pedidos tenham empresaId definido
      const chunkComEmpresaId = chunk.map((p) => ({
        ...p,
        empresaId: p.empresaId || empresaId,
      })) as Array<{
        numeroPedido: string;
        idDoc: string;
        referencia: string;
        dataPedido: Date;
        nomeFantasia: string;
        idProd?: string;
        descricaoProduto?: string;
        marca: string;
        grupo: string;
        subgrupo: string;
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
          const pedidosParaAnalytics = chunkComEmpresaId.map((p) => ({
            dataPedido: p.dataPedido,
            nomeFantasia: p.nomeFantasia,
            marca: p.marca || 'DESCONHECIDA',
            grupo: p.grupo || 'DESCONHECIDO',
            subgrupo: p.subgrupo || 'DESCONHECIDO',
            empresaId: p.empresaId,
            valorTotal: p.valorTotal,
            quantidade: p.quantidade,
          }));
          
          // Processar analytics de forma assíncrona para não bloquear a importação
          // Mas aguardar para garantir que não haja perda de dados
          await this.analyticsService.atualizarAnalytics(pedidosParaAnalytics);
          
          this.logger.log(
            `Analytics atualizado para lote de ${pedidosParaAnalytics.length} pedidos (${linhasProcessadas}/${totalLinhasParaProcessar})`,
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
      await this.prisma.pedidoImportacaoLog.update({
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
    await this.prisma.pedidoImportacaoLog.update({
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
  private async denormalizarDadosProduto(pedidos: PedidoRawData[]): Promise<{
    pedidosComDadosProduto: PedidoProcessada[];
    produtosNaoEncontradosCount: number;
  }> {
    const referencias = pedidos
      .map((p) => p.referencia)
      .filter((r): r is string => Boolean(r && r !== ''));
    const idProds = pedidos
      .map((p) => p.idProd)
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
    const idProdMap = new Map<string, string>(); // Para mapear referencia -> id_prod

    produtosFinal.forEach((p) => {
      const keyRef = p.referencia || '';
      const keyId = p.id_prod || '';

      if (keyRef) {
        marcaMap.set(keyRef, p.marca || 'DESCONHECIDA');
        grupoMap.set(keyRef, p.grupo || 'DESCONHECIDO');
        subgrupoMap.set(keyRef, p.subgrupo || 'DESCONHECIDO');
        produtoIdMap.set(keyRef, p.id);
        // Mapear referencia para id_prod
        if (keyId) {
          idProdMap.set(keyRef, keyId);
        }
      }
      if (keyId) {
        marcaMap.set(keyId, p.marca || 'DESCONHECIDA');
        grupoMap.set(keyId, p.grupo || 'DESCONHECIDO');
        subgrupoMap.set(keyId, p.subgrupo || 'DESCONHECIDO');
        produtoIdMap.set(keyId, p.id);
      }
    });

    // Processar pedidos
    let produtosNaoEncontradosCount = 0;

    const pedidosComDadosProduto = pedidos.map((pedido) => {
      const referencia = pedido.referencia || '';
      let idProd = pedido.idProd || '';

      // Se idProd não foi fornecido mas temos referencia, tentar obter do produto encontrado
      if (!idProd && referencia) {
        idProd = idProdMap.get(referencia) || '';
      }

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
        ...pedido,
        idProd: idProd || pedido.idProd, // Usar o idProd encontrado ou manter o original
        dataPedido: new Date(pedido.dataPedido),
        quantidade: new Decimal(pedido.quantidade),
        valorUnitario: new Decimal(pedido.valorUnitario),
        valorTotal: new Decimal(pedido.valorTotal),
        marca,
        grupo,
        subgrupo,
        produtoId,
        _produtoNaoEncontrado: produtoNaoEncontrado,
      } as PedidoProcessada;
    });

    this.logger.log(
      `📊 Estatísticas: ${produtosNaoEncontradosCount} produtos não encontrados (usando valores padrão)`,
    );

    return {
      pedidosComDadosProduto,
      produtosNaoEncontradosCount,
    };
  }

  /**
   * Verifica duplicatas pré-importação
   * Processa em chunks para evitar exceder limite de parâmetros do PostgreSQL (32767)
   * Atualiza o log de importação com progresso durante a verificação
   */
  private async verificarDuplicatas(
    pedidos: PedidoProcessada[],
    importacaoLogId?: string,
  ): Promise<{ duplicatas: number; novos: number }> {
    const totalPedidos = pedidos.length;
    this.logger.log(
      `🔍 Iniciando verificação de duplicatas para ${totalPedidos.toLocaleString('pt-BR')} pedidos...`,
    );

    const chaves = pedidos.map((p) => ({
      numeroPedido: p.numeroPedido,
      idDoc: p.idDoc || '',
      referencia: p.referencia || '',
    }));

    // PostgreSQL tem limite de 32767 parâmetros em prepared statements
    // Dividir em chunks menores (3000) para melhor performance e evitar timeout
    // Cada chave usa 3 parâmetros (numeroPedido, idDoc, referencia), então 3000 chaves = 9000 parâmetros
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
          await this.prisma.pedidoImportacaoLog.update({
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
      const existentes = await this.prisma.pedido.findMany({
        where: {
          OR: chunk.map((chave) => ({
            numeroPedido: chave.numeroPedido,
            idDoc: chave.idDoc,
            referencia: chave.referencia,
          })),
        },
        select: {
          numeroPedido: true,
          idDoc: true,
          referencia: true,
        },
        // Limitar resultados (não deve ser necessário, mas ajuda em caso de muitos matches)
        take: chunk.length * 2, // Máximo teórico: cada chave pode ter 1 match
      });

      // Adicionar chaves existentes ao Set
      existentes.forEach((e) => {
        const key = `${e.numeroPedido}|${e.idDoc || ''}|${e.referencia || ''}`;
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
      const key = `${chave.numeroPedido}|${chave.idDoc}|${chave.referencia}`;
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
   * Prepara pedido para UPSERT
   */
  private prepararPedidoParaUpsert(
    pedido: PedidoProcessada,
    empresaId: string,
    importacaoLogId: string, // NOVO PARÂMETRO
  ): {
    numeroPedido: string;
    idDoc: string;
    referencia: string;
    dataPedido: Date;
    nomeFantasia: string;
    idProd?: string;
    descricaoProduto?: string;
    marca: string;
    grupo: string;
    subgrupo: string;
    quantidade: Decimal;
    valorUnitario: Decimal;
    valorTotal: Decimal;
    empresaId: string;
    produtoId?: string;
    importacaoLogId: string; // NOVO CAMPO
    metadata?: unknown;
  } {
    return {
      numeroPedido: pedido.numeroPedido,
      idDoc: pedido.idDoc || '',
      referencia: pedido.referencia || '',
      dataPedido: new Date(pedido.dataPedido),
      nomeFantasia: pedido.nomeFantasia,
      idProd: pedido.idProd,
      descricaoProduto: pedido.descricaoProduto,
      marca: pedido.marca,
      grupo: pedido.grupo,
      subgrupo: pedido.subgrupo,
      quantidade: new Decimal(pedido.quantidade.toString()),
      valorUnitario: new Decimal(pedido.valorUnitario.toString()),
      valorTotal: new Decimal(pedido.valorTotal.toString()),
      empresaId: empresaId, // Sempre usa o empresaId informado pelo usuário
      produtoId: pedido.produtoId,
      importacaoLogId, // NOVO: associar pedido à importação
      metadata: pedido.metadata,
    };
  }

  /**
   * Processa um lote de pedidos com UPSERT
   * Usa abordagem de findFirst + update/create porque Prisma não suporta upsert direto com chave única composta
   */
  private async processarLote(
    pedidos: Array<{
      numeroPedido: string;
      idDoc: string;
      referencia: string;
      dataPedido: Date;
      nomeFantasia: string;
      idProd?: string;
      descricaoProduto?: string;
      marca: string;
      grupo: string;
      subgrupo: string;
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

    for (const pedido of pedidos) {
      try {
        // Preparar dados do pedido com importacaoLogId
        const pedidoData = this.prepararPedidoParaUpsert(
          pedido as PedidoProcessada,
          empresaId,
          importacaoLogId,
        );

        // Buscar registro existente usando a chave única composta
        const existente = await this.prisma.pedido.findFirst({
          where: {
            numeroPedido: pedidoData.numeroPedido,
            idDoc: pedidoData.idDoc || '',
            referencia: pedidoData.referencia || '',
          },
        });

        if (existente) {
          // Atualizar registro existente (incluindo importacaoLogId)
          await this.prisma.pedido.update({
            where: { id: existente.id },
            data: {
              dataPedido: pedidoData.dataPedido,
              nomeFantasia: pedidoData.nomeFantasia,
              idProd: pedidoData.idProd,
              descricaoProduto: pedidoData.descricaoProduto,
              marca: pedidoData.marca,
              grupo: pedidoData.grupo,
              subgrupo: pedidoData.subgrupo,
              quantidade: pedidoData.quantidade,
              valorUnitario: pedidoData.valorUnitario,
              valorTotal: pedidoData.valorTotal,
              empresaId: pedidoData.empresaId,
              produtoId: pedidoData.produtoId,
              importacaoLogId: pedidoData.importacaoLogId, // NOVO: atualizar importacaoLogId
              metadata: (pedidoData.metadata as Prisma.InputJsonValue) ?? null,
            },
          });
        } else {
          // Criar novo registro (com importacaoLogId)
          await this.prisma.pedido.create({
            data: {
              ...pedidoData,
              metadata: (pedidoData.metadata as Prisma.InputJsonValue) ?? null,
            } as Prisma.PedidoCreateInput,
          });
        }
        sucesso++;
      } catch (error) {
        erros++;
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(
          `Erro ao processar pedido ${pedido.numeroPedido}: ${errorMessage}`,
        );
      }
    }

    return { sucesso, erros };
  }
}

