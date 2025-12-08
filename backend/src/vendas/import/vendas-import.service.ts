import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ImportVendasDto } from '../dto/import-vendas.dto';
import { ColumnMapperService } from './column-mapper.service';
import { VendasValidatorService } from './vendas-validator.service';
import { VendasAnalyticsService } from '../analytics/vendas-analytics.service';
import * as XLSX from 'xlsx';
import { Decimal } from '@prisma/client/runtime/library';

const BATCH_SIZE = 400;

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
    this.logger.log(`Iniciando importação de vendas do arquivo: ${file.originalname}`);

    const startTime = Date.now();
    let totalLinhas = 0;
    let sucessoCount = 0;
    let erroCount = 0;
    let produtosNaoEncontrados = 0;
    let duplicatasCount = 0;
    let novosCount = 0;

    try {
      // 1. Ler arquivo Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
      }) as any[][];

      this.logger.log(`Arquivo lido: ${rawData.length} linhas encontradas`);

      // 2. Detectar cabeçalho
      const headerRowIndex = this.columnMapper.detectHeaderRow(rawData);
      const headers = rawData[headerRowIndex] || [];

      // 3. Mapear colunas
      const columnMapping = this.columnMapper.mapColumns(headers);
      this.logger.log(`Mapeamento de colunas: ${JSON.stringify(columnMapping)}`);

      // 4. Validar e transformar dados
      const vendasRaw: any[] = [];
      const dataRows = rawData.slice(headerRowIndex + 1);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) continue;

        try {
          // Converter array para objeto usando headers
          const rowObj: any = {};
          headers.forEach((header, index) => {
            if (header) {
              rowObj[header] = row[index];
            }
          });

          const vendaRaw = this.validator.validateAndTransform(
            rowObj,
            columnMapping,
            headerRowIndex + 2 + i,
          );
          vendasRaw.push(vendaRaw);
        } catch (error) {
          erroCount++;
          this.logger.warn(`Erro na linha ${headerRowIndex + 2 + i}: ${error.message}`);
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

      // 7. Verificar duplicatas pré-importação
      const { duplicatas, novos } = await this.verificarDuplicatas(
        vendasComDadosProduto,
      );
      duplicatasCount = duplicatas;
      novosCount = novos;

      // 8. Processar em lotes e fazer UPSERT
      const vendasProcessadas = vendasComDadosProduto.map((v) =>
        this.prepararVendaParaUpsert(v, importDto.empresaId),
      );

      for (let i = 0; i < vendasProcessadas.length; i += BATCH_SIZE) {
        const chunk = vendasProcessadas.slice(i, i + BATCH_SIZE);
        const { sucesso, erros } = await this.processarLote(chunk);
        sucessoCount += sucesso;
        erroCount += erros;
      }

      // 9. Atualizar analytics em tempo real
      const vendasParaAnalytics = vendasProcessadas.map((v) => ({
        dataVenda: v.dataVenda,
        nomeFantasia: v.nomeFantasia,
        marca: v.marca || 'DESCONHECIDA',
        grupo: v.grupo || 'DESCONHECIDO',
        subgrupo: v.subgrupo || 'DESCONHECIDO',
        ufDestino: v.ufDestino,
        valorTotal: v.valorTotal,
        quantidade: v.quantidade,
      }));
      await this.analyticsService.atualizarAnalytics(vendasParaAnalytics);

      // 10. Salvar log de importação
      const log = await this.prisma.vendaImportacaoLog.create({
        data: {
          nomeArquivo: file.originalname,
          mappingName: importDto.mappingName,
          totalLinhas,
          sucessoCount,
          erroCount,
          produtosNaoEncontrados,
          usuarioEmail: userEmail,
          usuarioId: userId,
        },
      });

      const tempoTotal = ((Date.now() - startTime) / 1000).toFixed(2);

      this.logger.log(
        `Importação concluída: ${sucessoCount} sucessos, ${erroCount} erros em ${tempoTotal}s`,
      );

      return {
        success: true,
        message: 'Importação concluída com sucesso',
        logId: log.id,
        estatisticas: {
          totalLinhas,
          sucessoCount,
          erroCount,
          produtosNaoEncontrados,
          duplicatas: duplicatasCount,
          novos: novosCount,
          tempoTotal: `${tempoTotal}s`,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao importar vendas: ${error.message}`,
        error.stack,
      );

      // Salvar log de erro
      await this.prisma.vendaImportacaoLog.create({
        data: {
          nomeArquivo: file.originalname,
          mappingName: importDto.mappingName,
          totalLinhas,
          sucessoCount,
          erroCount: erroCount + 1,
          produtosNaoEncontrados,
          usuarioEmail: userEmail,
          usuarioId: userId,
        },
      });

      throw new BadRequestException(`Erro ao importar vendas: ${error.message}`);
    }
  }

  /**
   * Denormaliza marca, grupo e subgrupo de produtos
   */
  private async denormalizarDadosProduto(vendas: any[]): Promise<{
    vendasComDadosProduto: VendaProcessada[];
    produtosNaoEncontradosCount: number;
  }> {
    const referencias = vendas
      .map((v) => v.referencia)
      .filter((r) => r && r !== '');
    const idProds = vendas
      .map((v) => v.idProd)
      .filter((id) => id && id !== '');

    // Buscar produtos
    const produtos = await this.prisma.produto.findMany({
      where: {
        OR: [
          { referencia: { in: referencias } },
          { id_prod: { in: idProds } },
        ],
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

    // Criar mapas
    const marcaMap = new Map<string, string>();
    const grupoMap = new Map<string, string>();
    const subgrupoMap = new Map<string, string>();
    const produtoIdMap = new Map<string, string>(); // Para relacionamento

    produtos.forEach((p) => {
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
   */
  private async verificarDuplicatas(
    vendas: VendaProcessada[],
  ): Promise<{ duplicatas: number; novos: number }> {
    const chaves = vendas.map((v) => ({
      nfe: v.nfe,
      idDoc: v.idDoc || '',
      referencia: v.referencia || '',
    }));

    // Buscar registros existentes
    const existentes = await this.prisma.venda.findMany({
      where: {
        OR: chaves.map((chave) => ({
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
    });

    const chavesExistentes = new Set(
      existentes.map(
        (e) => `${e.nfe}|${e.idDoc || ''}|${e.referencia || ''}`,
      ),
    );

    let duplicatas = 0;
    let novos = 0;

    chaves.forEach((chave) => {
      const key = `${chave.nfe}|${chave.idDoc}|${chave.referencia}`;
      if (chavesExistentes.has(key)) {
        duplicatas++;
      } else {
        novos++;
      }
    });

    this.logger.log(
      `Verificação de duplicatas: ${novos} novos, ${duplicatas} duplicatas (serão atualizados)`,
    );

    return { duplicatas, novos };
  }

  /**
   * Prepara venda para UPSERT
   */
  private prepararVendaParaUpsert(
    venda: VendaProcessada,
    empresaId?: string,
  ): any {
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
      empresaId: empresaId || venda.empresaId,
      produtoId: venda.produtoId,
      metadata: venda.metadata,
    };
  }

  /**
   * Processa um lote de vendas com UPSERT
   * Usa abordagem de findFirst + update/create porque Prisma não suporta upsert direto com chave única composta
   */
  private async processarLote(
    vendas: any[],
  ): Promise<{ sucesso: number; erros: number }> {
    let sucesso = 0;
    let erros = 0;

    for (const venda of vendas) {
      try {
        // Buscar registro existente usando a chave única composta
        const existente = await this.prisma.venda.findFirst({
          where: {
            nfe: venda.nfe,
            idDoc: venda.idDoc || '',
            referencia: venda.referencia || '',
          },
        });

        if (existente) {
          // Atualizar registro existente
          await this.prisma.venda.update({
            where: { id: existente.id },
            data: {
              dataVenda: venda.dataVenda,
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
              quantidade: venda.quantidade,
              valorUnitario: venda.valorUnitario,
              valorTotal: venda.valorTotal,
              empresaId: venda.empresaId,
              produtoId: venda.produtoId,
              metadata: venda.metadata,
            },
          });
        } else {
          // Criar novo registro
          await this.prisma.venda.create({
            data: venda,
          });
        }
        sucesso++;
      } catch (error) {
        erros++;
        this.logger.error(
          `Erro ao processar venda ${venda.nfe}: ${error.message}`,
        );
      }
    }

    return { sucesso, erros };
  }
}
