import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateResumoDto } from './dto/create-resumo.dto';
import { UpdateResumoDto } from './dto/update-resumo.dto';
import { FilterResumoDto } from './dto/filter-resumo.dto';
import { AiService } from '../ai/ai.service';
import { AnaliseResponse } from '../ai/dto/insight.dto';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

@Injectable()
export class ResumosService {
  private readonly logger = new Logger(ResumosService.name);
  private readonly MODELO_IA = 'Groq LLaMA 3.1 8B Instant'; // Nome para exibição

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Cria um novo resumo econômico
   * Pode criar a partir de uma análise existente ou executar nova análise
   */
  async create(
    dto: CreateResumoDto,
    userId: string,
    resultadoAnalise?: AnaliseResponse,
  ) {
    this.logger.log(`Criando resumo: ${dto.titulo}`);

    // Se não foi fornecido resultado, executar análise
    let resultado: AnaliseResponse;
    if (resultadoAnalise) {
      resultado = resultadoAnalise;
    } else {
      // Executar análise automaticamente
      resultado = await this.aiService.analisarDados(dto.parametros);
    }

    // Gerar período formatado
    const periodo = this.formatarPeriodo(dto.mes, dto.ano);

    // Criar resumo no banco
    const resumo = await this.prisma.resumoEconomico.create({
      data: {
        titulo: dto.titulo,
        periodo,
        mes: dto.mes,
        ano: dto.ano,
        empresaId: dto.empresaId,
        uploadId: dto.uploadId,
        tipoAnalise: dto.tipoAnalise,
        parametros: dto.parametros as unknown as Prisma.InputJsonValue,
        resultado: resultado as unknown as Prisma.InputJsonValue,
        modeloIA: this.MODELO_IA,
        status: 'CONCLUIDO',
        criadoPor: userId,
      },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
        upload: {
          select: {
            id: true,
            nomeArquivo: true,
            mes: true,
            ano: true,
          },
        },
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Resumo criado com sucesso: ${resumo.id}`);
    return resumo;
  }

  /**
   * Lista resumos com filtros e paginação
   */
  async findAll(filters: FilterResumoDto, userId?: string) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.empresaId) {
      where.empresaId = filters.empresaId;
    }

    if (filters.ano) {
      where.ano = filters.ano;
    }

    if (filters.mes) {
      where.mes = filters.mes;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.tipoAnalise) {
      where.tipoAnalise = filters.tipoAnalise;
    }

    // Se userId fornecido, filtrar apenas resumos do usuário
    if (userId) {
      where.criadoPor = userId;
    }

    const [resumos, total] = await Promise.all([
      this.prisma.resumoEconomico.findMany({
        where,
        include: {
          empresa: {
            select: {
              id: true,
              razaoSocial: true,
              nomeFantasia: true,
            },
          },
          criador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.resumoEconomico.count({ where }),
    ]);

    return {
      data: resumos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca um resumo por ID
   */
  async findOne(id: string) {
    const resumo = await this.prisma.resumoEconomico.findUnique({
      where: { id },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
            cnpj: true,
          },
        },
        upload: {
          select: {
            id: true,
            nomeArquivo: true,
            mes: true,
            ano: true,
            status: true,
          },
        },
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!resumo) {
      throw new NotFoundException(`Resumo com ID ${id} não encontrado`);
    }

    return resumo;
  }

  /**
   * Atualiza um resumo
   */
  async update(id: string, dto: UpdateResumoDto, userId: string) {
    // Verificar se resumo existe
    const resumo = await this.findOne(id);

    // Verificar se usuário é o criador (ou admin)
    if (resumo.criadoPor !== userId) {
      throw new BadRequestException(
        'Você não tem permissão para atualizar este resumo',
      );
    }

    const updated = await this.prisma.resumoEconomico.update({
      where: { id },
      data: dto,
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Resumo atualizado: ${id}`);
    return updated;
  }

  /**
   * Deleta um resumo
   */
  async delete(id: string, userId: string) {
    // Verificar se resumo existe
    const resumo = await this.findOne(id);

    // Verificar se usuário é o criador (ou admin)
    if (resumo.criadoPor !== userId) {
      throw new BadRequestException(
        'Você não tem permissão para deletar este resumo',
      );
    }

    await this.prisma.resumoEconomico.delete({
      where: { id },
    });

    this.logger.log(`Resumo deletado: ${id}`);
    return { message: 'Resumo deletado com sucesso' };
  }

  /**
   * Exporta resumo para PDF
   */
  async exportarPDF(id: string): Promise<Buffer> {
    const resumo = await this.findOne(id);
    const resultado = resumo.resultado as unknown as {
      resumo?: string;
      insights?: Array<{ tipo: string; titulo: string; descricao: string }>;
      padroesAnomalos?: Array<{
        tipo: string;
        descricao: string;
        severidade: string;
      }>;
    };

    const doc = new jsPDF();
    let yPos = 20;
    let currentPage = 1;

    // Cabeçalho
    doc.setFontSize(18);
    doc.text(resumo.titulo, 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Período: ${resumo.periodo}`, 20, yPos);
    yPos += 7;

    if (resumo.empresa) {
      doc.text(`Empresa: ${resumo.empresa.razaoSocial}`, 20, yPos);
      yPos += 7;
    }

    // Metadados
    doc.setFontSize(10);
    doc.text(
      `Data: ${new Date(resumo.createdAt).toLocaleDateString('pt-BR')}`,
      20,
      yPos,
    );
    yPos += 5;
    doc.text(`Modelo IA: ${resumo.modeloIA}`, 20, yPos);
    yPos += 5;
    doc.text(`Status: ${resumo.status}`, 20, yPos);
    yPos += 10;

    // Resumo da análise
    doc.setFontSize(14);
    doc.text('Resumo da Análise', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    const resumoLines: string[] = doc.splitTextToSize(
      resultado.resumo || 'Nenhum resumo disponível',
      170,
    ) as string[];
    doc.text(resumoLines, 20, yPos);
    yPos += resumoLines.length * 5 + 10;

    // Insights
    if (resultado.insights && resultado.insights.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        currentPage++;
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Insights', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      for (const insight of resultado.insights.slice(0, 10)) {
        // Limitar a 10 insights para não exceder o tamanho da página
        if (yPos > 250) {
          doc.addPage();
          currentPage++;
          yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${insight.tipo}: ${insight.titulo}`, 20, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(
          insight.descricao,
          170,
        ) as string[];
        doc.text(descLines, 25, yPos);
        yPos += descLines.length * 5 + 5;
      }
    }

    // Padrões Anômalos
    if (resultado.padroesAnomalos && resultado.padroesAnomalos.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        currentPage++;
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Padrões Anômalos', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      for (const padrao of resultado.padroesAnomalos.slice(0, 5)) {
        if (yPos > 250) {
          doc.addPage();
          currentPage++;
          yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`[${padrao.severidade}] ${padrao.tipo}`, 20, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(
          padrao.descricao,
          170,
        ) as string[];
        doc.text(descLines, 25, yPos);
        yPos += descLines.length * 5 + 5;
      }
    }

    // Rodapé - adicionar em todas as páginas
    // Usamos a contagem de páginas que fizemos manualmente
    const totalPages = currentPage;

    // Adicionar rodapé em cada página
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${totalPages} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
        20,
        285,
      );
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Exporta resumo para Excel
   */
  async exportarExcel(id: string): Promise<Buffer> {
    const resumo = await this.findOne(id);
    const resultado = resumo.resultado as unknown as {
      resumo?: string;
      insights?: Array<{
        tipo: string;
        titulo: string;
        descricao: string;
        recomendacao?: string;
        confianca: number;
      }>;
      padroesAnomalos?: Array<{
        tipo: string;
        descricao: string;
        severidade: string;
      }>;
    };

    const workbook = XLSX.utils.book_new();

    // Aba 1: Resumo
    const resumoData = [
      ['Título', resumo.titulo],
      ['Período', resumo.periodo],
      ['Empresa', resumo.empresa?.razaoSocial || 'N/A'],
      ['Data de Criação', new Date(resumo.createdAt).toLocaleString('pt-BR')],
      ['Modelo IA', resumo.modeloIA],
      ['Status', resumo.status],
      ['Tipo de Análise', resumo.tipoAnalise],
      [''],
      ['Resumo da Análise'],
      [resultado.resumo || 'Nenhum resumo disponível'],
    ];

    const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');

    // Aba 2: Insights
    if (resultado.insights && resultado.insights.length > 0) {
      const insightsData = [
        ['Tipo', 'Título', 'Descrição', 'Recomendação', 'Confiança (%)'],
        ...resultado.insights.map((insight) => [
          insight.tipo,
          insight.titulo,
          insight.descricao,
          insight.recomendacao || 'N/A',
          insight.confianca,
        ]),
      ];

      const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
      XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights');
    }

    // Aba 3: Padrões Anômalos
    if (resultado.padroesAnomalos && resultado.padroesAnomalos.length > 0) {
      const padroesData: (string | number)[][] = [
        ['Tipo', 'Descrição', 'Severidade'],
        ...resultado.padroesAnomalos.map((padrao) => [
          padrao.tipo,
          padrao.descricao,
          padrao.severidade,
        ]),
      ];

      const padroesSheet = XLSX.utils.aoa_to_sheet(padroesData);
      XLSX.utils.book_append_sheet(workbook, padroesSheet, 'Padrões Anômalos');
    }

    // Aba 4: Sugestões
    const resultadoComSugestoes = resultado as {
      resumo?: string;
      insights?: Array<{
        tipo: string;
        titulo: string;
        descricao: string;
        recomendacao?: string;
        confianca: number;
      }>;
      padroesAnomalos?: Array<{
        tipo: string;
        descricao: string;
        severidade: string;
      }>;
      sugestoesCorrecao?: Array<{
        problema: string;
        solucao: string;
        confianca: number;
      }>;
    };
    if (
      resultadoComSugestoes.sugestoesCorrecao &&
      resultadoComSugestoes.sugestoesCorrecao.length > 0
    ) {
      const sugestoesData: (string | number)[][] = [
        ['Problema', 'Solução', 'Confiança (%)'],
        ...resultadoComSugestoes.sugestoesCorrecao.map((sugestao) => [
          sugestao.problema,
          sugestao.solucao,
          sugestao.confianca,
        ]),
      ];

      const sugestoesSheet = XLSX.utils.aoa_to_sheet(sugestoesData);
      XLSX.utils.book_append_sheet(workbook, sugestoesSheet, 'Sugestões');
    }

    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );
  }

  /**
   * Exporta resumo para JSON
   */
  async exportarJSON(id: string): Promise<Record<string, unknown>> {
    const resumo = await this.findOne(id);

    return {
      id: resumo.id,
      titulo: resumo.titulo,
      periodo: resumo.periodo,
      mes: resumo.mes,
      ano: resumo.ano,
      empresa: resumo.empresa
        ? {
            id: resumo.empresa.id,
            razaoSocial: resumo.empresa.razaoSocial,
            nomeFantasia: resumo.empresa.nomeFantasia,
          }
        : null,
      upload: resumo.upload
        ? {
            id: resumo.upload.id,
            nomeArquivo: resumo.upload.nomeArquivo,
            mes: resumo.upload.mes,
            ano: resumo.upload.ano,
          }
        : null,
      tipoAnalise: resumo.tipoAnalise,
      parametros: resumo.parametros,
      resultado: resumo.resultado,
      modeloIA: resumo.modeloIA,
      status: resumo.status,
      criadoPor: {
        id: resumo.criador.id,
        nome: resumo.criador.nome,
        email: resumo.criador.email,
      },
      createdAt: resumo.createdAt,
      updatedAt: resumo.updatedAt,
    };
  }

  /**
   * Formata período para exibição
   */
  private formatarPeriodo(mes?: number, ano?: number): string {
    if (!ano) {
      return 'Período não especificado';
    }

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

    if (mes && mes >= 1 && mes <= 12) {
      return `${meses[mes - 1]}/${ano}`;
    }

    return `${ano}`;
  }
}
