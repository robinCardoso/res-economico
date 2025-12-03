import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateAtaDto } from './dto/create-ata.dto';
import { UpdateAtaDto } from './dto/update-ata.dto';
import { FilterAtaDto } from './dto/filter-ata.dto';
import { AnalisarAtaDto } from './dto/analisar-ata.dto';
import { ImportarAtaDto } from './dto/importar-ata.dto';
import { ImportarRascunhoDto } from './dto/importar-rascunho.dto';
import { ImportarEmProcessoDto } from './dto/importar-em-processo.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { Prisma, TipoArquivoAta, TipoReuniao, StatusAta } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { ModeloAtaService } from './modelo-ata.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class AtasService {
  private readonly logger = new Logger(AtasService.name);
  private readonly gemini: GoogleGenerativeAI | null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private modeloAtaService: ModeloAtaService,
  ) {
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiApiKey) {
      this.gemini = new GoogleGenerativeAI(geminiApiKey);
      this.logger.log(
        'Google Gemini inicializado para processamento de PDFs escaneados',
      );
    } else {
      this.gemini = null;
      this.logger.warn(
        'GEMINI_API_KEY não configurada. Processamento de PDFs escaneados desabilitado.',
      );
    }
  }

  /**
   * Gera número único para a ata no formato ATA-YYYYMM-NNNN
   */
  private async generateNumeroAta(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const currentPattern = `ATA-${currentYear}${currentMonth}`;

    // Buscar o maior número do mês atual
    const lastAta = await this.prisma.ataReuniao.findFirst({
      where: {
        numero: {
          startsWith: currentPattern,
        },
      },
      orderBy: {
        numero: 'desc',
      },
      select: {
        numero: true,
      },
    });

    let nextSequence = 1;
    if (lastAta?.numero) {
      const sequenceStr = lastAta.numero.split('-').pop();
      const sequence = parseInt(sequenceStr || '0', 10);
      if (!isNaN(sequence)) {
        nextSequence = sequence + 1;
      }
    }

    return `${currentPattern}-${nextSequence.toString().padStart(4, '0')}`;
  }

  /**
   * Cria uma nova ata de reunião
   */
  async create(dto: CreateAtaDto, userId: string) {
    this.logger.log(`Criando nova ata: ${dto.titulo}`);

    const numero = await this.generateNumeroAta();

    // Criar a ata
    const ata = await this.prisma.ataReuniao.create({
      data: {
        numero,
        titulo: dto.titulo,
        tipo: dto.tipo,
        dataReuniao: new Date(dto.dataReuniao),
        local: dto.local || undefined,
        pauta: dto.pauta || undefined,
        conteudo: dto.conteudo || undefined,
        decisoes: dto.decisoes || undefined,
        observacoes: dto.observacoes || undefined,
        empresaId: dto.empresaId || undefined,
        criadoPor: userId,
        status: 'RASCUNHO',
      },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
      },
    });

    // Adicionar participantes se fornecidos
    if (dto.participantes && dto.participantes.length > 0) {
      await this.prisma.ataParticipante.createMany({
        data: dto.participantes.map((p) => ({
          ataId: ata.id,
          usuarioId: p.usuarioId || undefined,
          nomeExterno: p.nomeExterno || undefined,
          email: p.email || undefined,
          cargo: p.cargo || undefined,
          presente: p.presente ?? true,
          observacoes: p.observacoes || undefined,
        })),
      });
    }

    // Buscar a ata completa com participantes
    return this.findOne(ata.id);
  }

  /**
   * Lista atas com filtros e paginação
   */
  async findAll(filters: FilterAtaDto) {
    const filterDto: FilterAtaDto = filters;
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AtaReuniaoWhereInput = {};

    const empresaId = filterDto.empresaId;
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const tipo = filterDto.tipo;
    if (tipo) {
      where.tipo = tipo;
    }

    const status = filterDto.status;
    if (status) {
      where.status = status;
    }

    const dataInicio = filterDto.dataInicio;
    const dataFim = filterDto.dataFim;
    if (dataInicio || dataFim) {
      where.dataReuniao = {};
      if (dataInicio) {
        where.dataReuniao.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataReuniao.lte = new Date(dataFim);
      }
    }

    const busca = filterDto.busca;
    if (busca) {
      where.OR = [
        { titulo: { contains: busca, mode: 'insensitive' } },
        { numero: { contains: busca, mode: 'insensitive' } },
        { conteudo: { contains: busca, mode: 'insensitive' } },
        { pauta: { contains: busca, mode: 'insensitive' } },
      ];
    }

    // Se userId fornecido, filtrar apenas atas do usuário (opcional - pode remover se quiser ver todas)
    // if (userId) {
    //   where.criadoPor = userId;
    // }

    const [atas, total] = await Promise.all([
      this.prisma.ataReuniao.findMany({
        where: where,
        include: {
          criador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          empresa: {
            select: {
              id: true,
              razaoSocial: true,
              nomeFantasia: true,
            },
          },
          participantes: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              anexos: true,
            },
          },
        },
        orderBy: { dataReuniao: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ataReuniao.count({
        where: where,
      }),
    ]);

    return {
      data: atas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca uma ata por ID
   */
  async findOne(id: string) {
    const ata = await this.prisma.ataReuniao.findUnique({
      where: { id },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
        participantes: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
        anexos: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!ata) {
      throw new NotFoundException(`Ata com ID ${id} não encontrada`);
    }

    // Retornar com todos os campos, incluindo os novos campos JSON
    return {
      ...ata,
      // Garantir que os campos JSON sejam retornados corretamente
      pautas: ata.pautas || null,
      decisoes: ata.decisoes || null,
      acoes: ata.acoes || null,
      descricao: ata.descricao || null,
      resumo: ata.resumo || null,
      geradoPorIa: ata.geradoPorIa || null,
      iaUsada: ata.iaUsada || null,
      modeloIa: ata.modeloIa || null,
      custoIa: ata.custoIa || null,
      tempoProcessamentoIa: ata.tempoProcessamentoIa || null,
      arquivoOriginalUrl: ata.arquivoOriginalUrl || null,
      arquivoOriginalNome: ata.arquivoOriginalNome || null,
      arquivoOriginalTipo: ata.arquivoOriginalTipo || null,
    };
  }

  /**
   * Atualiza uma ata
   */
  async update(id: string, dto: UpdateAtaDto) {
    await this.findOne(id);

    const updateDto: UpdateAtaDto = dto;
    const updateData: Prisma.AtaReuniaoUpdateInput = {};

    const titulo = updateDto.titulo;
    if (titulo !== undefined) updateData.titulo = titulo;
    const tipo = updateDto.tipo;
    if (tipo !== undefined) updateData.tipo = tipo;
    const dataReuniao = updateDto.dataReuniao;
    if (dataReuniao !== undefined)
      updateData.dataReuniao = new Date(dataReuniao);
    const local = updateDto.local;
    if (local !== undefined) updateData.local = local;
    const status = updateDto.status;
    if (status !== undefined) updateData.status = status;
    const pauta = updateDto.pauta;
    if (pauta !== undefined) updateData.pauta = pauta;
    const conteudo = updateDto.conteudo;
    if (conteudo !== undefined) updateData.conteudo = conteudo;
    // Campos JSON - aceitar diretamente como objeto/array
    const decisoes = updateDto.decisoes;
    if (decisoes !== undefined) {
      // Se for string, tentar fazer parse; caso contrário, usar diretamente
      updateData.decisoes =
        typeof decisoes === 'string'
          ? (JSON.parse(decisoes) as Prisma.InputJsonValue)
          : (decisoes as Prisma.InputJsonValue);
    }
    const acoes = updateDto.acoes;
    if (acoes !== undefined) {
      // Se for string, tentar fazer parse; caso contrário, usar diretamente
      updateData.acoes =
        typeof acoes === 'string'
          ? (JSON.parse(acoes) as Prisma.InputJsonValue)
          : (acoes as Prisma.InputJsonValue);
    }
    const observacoes = updateDto.observacoes;
    if (observacoes !== undefined) updateData.observacoes = observacoes;
    const empresaId = updateDto.empresaId;
    if (empresaId !== undefined) {
      if (empresaId) {
        updateData.empresa = {
          connect: { id: empresaId },
        };
      } else {
        updateData.empresa = {
          disconnect: true,
        };
      }
    }

    // Atualizar participantes se fornecidos
    if (updateDto.participantes) {
      // Remover participantes existentes
      await this.prisma.ataParticipante.deleteMany({
        where: { ataId: id },
      });

      // Adicionar novos participantes
      if (updateDto.participantes.length > 0) {
        await this.prisma.ataParticipante.createMany({
          data: updateDto.participantes.map((p) => ({
            ataId: id,
            usuarioId: p.usuarioId || undefined,
            nomeExterno: p.nomeExterno || undefined,
            email: p.email || undefined,
            cargo: p.cargo || undefined,
            presente: p.presente ?? true,
            observacoes: p.observacoes || undefined,
          })),
        });
      }
    }

    const ataAtualizada = await this.prisma.ataReuniao.update({
      where: { id },
      data: updateData,
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
        participantes: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        anexos: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    this.logger.log(`Ata ${id} atualizada com sucesso`);
    return ataAtualizada;
  }

  /**
   * Remove uma ata
   */
  async remove(id: string) {
    const ata = await this.findOne(id);

    // Deletar arquivo físico se existir
    if (ata.arquivoOriginalUrl) {
      try {
        // Extrair o nome do arquivo da URL (ex: /uploads/atas/abc123.pdf)
        const fileName = ata.arquivoOriginalUrl.split('/').pop();
        if (fileName) {
          const filePath = path.join(
            process.cwd(),
            'uploads',
            'atas',
            fileName,
          );

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            this.logger.log(`Arquivo físico deletado: ${filePath}`);
          } else {
            this.logger.warn(`Arquivo físico não encontrado: ${filePath}`);
          }
        }
      } catch (error) {
        // Log do erro mas não falha a exclusão da ATA
        this.logger.error(
          `Erro ao deletar arquivo físico da ata ${id}:`,
          error,
        );
      }
    }

    await this.prisma.ataReuniao.delete({
      where: { id },
    });

    this.logger.log(`Ata ${id} removida com sucesso`);
    return { message: 'Ata removida com sucesso' };
  }

  /**
   * Analisa uma ata usando IA
   */
  async analisarAta(id: string, dto: AnalisarAtaDto = {}) {
    const ata = await this.findOne(id);

    if (!this.gemini) {
      throw new BadRequestException(
        'Gemini AI não está configurado. Configure GEMINI_API_KEY no arquivo .env do backend.',
      );
    }

    this.logger.log(`Iniciando análise de IA para ata ${id}`);

    const tipoAnalise = dto.tipoAnalise || 'completo';
    const startTime = Date.now();

    // Preparar conteúdo da ata para análise
    const conteudoAta = {
      titulo: ata.titulo,
      tipo: ata.tipo,
      dataReuniao: ata.dataReuniao.toISOString(),
      local: ata.local,
      pauta: ata.pauta,
      conteudo: ata.conteudo,
      decisoes: ata.decisoes,
      observacoes: ata.observacoes,
      participantes: ata.participantes.map((p) => ({
        nome: p.nomeExterno || p.usuario?.nome || 'Participante',
        cargo: p.cargo || p.usuario?.email || '',
        presente: p.presente,
      })),
      empresa: ata.empresa
        ? {
            razaoSocial: ata.empresa.razaoSocial,
            nomeFantasia: ata.empresa.nomeFantasia,
          }
        : null,
    };

    // Criar prompt baseado no tipo de análise
    const systemPrompt = `Você é um assistente especializado em análise de atas de reuniões. 
Analise o conteúdo fornecido e forneça insights, resumos e recomendações de forma clara e estruturada.
Sempre responda em português brasileiro.`;

    let userPrompt = '';

    switch (tipoAnalise) {
      case 'resumo':
        userPrompt = `Analise a seguinte ata de reunião e forneça um resumo executivo conciso:

${JSON.stringify(conteudoAta, null, 2)}

Forneça:
1. Resumo executivo (2-3 parágrafos)
2. Principais pontos discutidos
3. Conclusões principais`;
        break;

      case 'decisoes':
        userPrompt = `Analise as decisões tomadas na seguinte ata de reunião:

${JSON.stringify(conteudoAta, null, 2)}

Forneça:
1. Lista de todas as decisões identificadas
2. Impacto de cada decisão
3. Recomendações para acompanhamento`;
        break;

      case 'acoes':
        userPrompt = `Analise a ata de reunião e identifique ações pendentes ou necessárias:

${JSON.stringify(conteudoAta, null, 2)}

Forneça:
1. Ações identificadas
2. Responsáveis sugeridos (se mencionados)
3. Prioridades sugeridas`;
        break;

      case 'completo':
      default:
        userPrompt = `Analise completamente a seguinte ata de reunião:

${JSON.stringify(conteudoAta, null, 2)}

Forneça uma análise completa incluindo:
1. Resumo Executivo
2. Principais Tópicos Discutidos
3. Decisões Tomadas (com impacto)
4. Ações Identificadas (com responsáveis e prazos sugeridos)
5. Pontos de Atenção
6. Recomendações Estratégicas`;
        break;
    }

    try {
      const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY não configurada');
      }

      const API_MODEL = 'gemini-2.0-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${geminiApiKey}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro HTTP: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      interface GeminiResponse {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
        usageMetadata?: {
          totalTokenCount?: number;
        };
      }
      const result = (await response.json()) as GeminiResponse;
      const tempoProcessamento = Date.now() - startTime;
      const resposta = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      this.logger.log(
        `Análise de IA concluída para ata ${id} em ${tempoProcessamento}ms`,
      );

      return {
        analise: resposta,
        tipoAnalise,
        tempoProcessamento,
        modelo: API_MODEL,
        tokensUsados: result.usageMetadata?.totalTokenCount || 0,
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar ata ${id}:`, error);
      throw new BadRequestException(
        `Erro ao analisar ata: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Importa uma ata a partir de um arquivo (PDF, TXT)
   */
  async importarAta(dto: ImportarAtaDto, userId: string) {
    this.logger.log(`Importando ata do arquivo: ${dto.nomeArquivo}`);

    // Verificar se já existe uma ATA com o mesmo nome de arquivo
    const ataExistente = await this.prisma.ataReuniao.findFirst({
      where: {
        arquivoOriginalNome: dto.nomeArquivo,
      },
      select: {
        id: true,
        titulo: true,
        numero: true,
      },
    });

    if (ataExistente) {
      throw new BadRequestException(
        `Já existe uma ATA com o arquivo "${dto.nomeArquivo}". ` +
          `ATA existente: ${ataExistente.numero} - ${ataExistente.titulo}. ` +
          `Por favor, renomeie o arquivo ou exclua a ATA existente antes de importar novamente.`,
      );
    }

    // Verificar se Gemini está configurado (obrigatório agora)
    if (!this.gemini) {
      throw new BadRequestException(
        'Gemini AI não está configurado. Configure GEMINI_API_KEY no arquivo .env do backend.',
      );
    }

    const extensao = dto.nomeArquivo.split('.').pop()?.toLowerCase();
    let usarGeminiDiretamente = false;

    // Processar arquivo com Gemini (única IA usada agora)
    if (extensao === 'txt') {
      // TXT - Decodificar base64 e enviar texto no prompt do Gemini
      this.logger.log(
        'Arquivo TXT detectado. Usando Gemini para processar o texto.',
      );
      usarGeminiDiretamente = false; // Texto será enviado no prompt
    } else if (extensao === 'pdf') {
      // PDF - Usar Gemini diretamente (processa PDFs escaneados automaticamente)
      this.logger.log(
        'PDF detectado. Usando Gemini para processar diretamente (inclui OCR automático).',
      );
      usarGeminiDiretamente = true; // PDF será enviado como anexo
    } else {
      throw new BadRequestException(
        `Tipo de arquivo não suportado: ${extensao}. Formatos suportados: TXT, PDF`,
      );
    }

    // Preparar prompt para processar o documento com IA
    // Para TXT, extrair texto e incluir no prompt
    // Para PDF, Gemini processa diretamente (não precisa do texto)
    let textoCompleto = '';
    if (!usarGeminiDiretamente && extensao === 'txt') {
      textoCompleto = Buffer.from(dto.conteudoBase64, 'base64').toString(
        'utf-8',
      );
      textoCompleto = textoCompleto.substring(0, 30000); // Limitar tamanho
    }

    const prompt = `Você é um assistente especializado em processar documentos de reuniões, atas, estatutos e documentos corporativos.

IMPORTANTE: Você DEVE retornar APENAS um JSON válido, sem nenhum texto adicional antes ou depois.

Data do Documento: ${dto.dataReuniao}
Tipo sugerido pelo usuário (apenas contexto, analise o documento para determinar o tipo real): ${dto.tipoReuniao || 'não especificado'}

${textoCompleto ? `Conteúdo do documento extraído:\n${textoCompleto}\n\n` : ''}Analise o documento${textoCompleto ? ' acima' : ' anexado'} e extraia TODAS as informações estruturadas. O documento pode ser:
- Uma ata de reunião
- Um estatuto ou documento regulamentar
- Outro tipo de documento corporativo

IMPORTANTE SOBRE O TIPO:
- Analise o CONTEÚDO do documento para determinar o tipo real
- Se o documento for um ESTATUTO, use "OUTRO" no campo "tipo" (não use o tipo sugerido)
- Se o documento for uma ATA DE REUNIÃO, determine o tipo baseado no conteúdo (Assembleia Geral, Conselho Diretor, etc.)
- Se o documento não for uma reunião, SEMPRE use "OUTRO" no campo "tipo"
- NÃO use o tipo sugerido pelo usuário se ele não corresponder ao conteúdo real do documento

EXTRAÇÃO DE INFORMAÇÕES - SEM RESTRIÇÕES:
Você DEVE SEMPRE tentar extrair participantes, pautas, decisões e ações, INDEPENDENTEMENTE do tipo de documento. Adapte o significado conforme o contexto:

- PARTICIPANTES: 
  * Para atas de reunião: pessoas presentes, membros da reunião
  * Para estatutos: membros da diretoria, conselheiros, sócios fundadores, pessoas mencionadas com cargos
  * Para outros documentos: pessoas mencionadas, responsáveis, envolvidos

- PAUTAS:
  * Para atas de reunião: assuntos discutidos na reunião
  * Para estatutos: capítulos, seções principais, tópicos regulamentares
  * Para outros documentos: temas principais, assuntos abordados

- DECISÕES:
  * Para atas de reunião: decisões tomadas durante a reunião
  * Para estatutos: normas estabelecidas, regras definidas, decisões regulamentares
  * Para outros documentos: decisões mencionadas, determinações, resoluções

- AÇÕES:
  * Para atas de reunião: ações a serem realizadas, tarefas definidas
  * Para estatutos: obrigações, responsabilidades, ações previstas no documento
  * Para outros documentos: ações mencionadas, tarefas, obrigações

IMPORTANTE: O campo "conteudo" é OBRIGATÓRIO e deve conter TODO o texto do documento de forma legível e completa, mesmo que você também retorne informações estruturadas em outros campos.

Retorne EXATAMENTE este JSON (sem texto adicional):

\`\`\`json
{
  "titulo": "Título do Documento",
  "tipo": "TIPO_DA_REUNIAO_OU_OUTRO", // Ex: ASSEMBLEIA_GERAL, CONSELHO_DIRETOR, REUNIAO_ORDINARIA, REUNIAO_EXTRAORDINARIA, COMISSAO, OUTRO
  "conteudo": "CONTEÚDO COMPLETO DO DOCUMENTO EM TEXTO. Este campo é OBRIGATÓRIO e deve conter todo o texto do documento de forma legível, mantendo parágrafos e estrutura. Para estatutos, inclua todos os artigos e seções. Para atas, inclua todo o conteúdo da reunião.",
  "descricao": "Uma breve descrição ou ementa do documento.",
  "resumo": "Um resumo conciso dos pontos principais do documento.",
  "participantes": [
    {
      "nome": "Nome do Participante/Membro/Pessoa",
      "cargo": "Cargo/Função (se disponível)",
      "email": "Email (se disponível)"
    }
  ],
  "pautas": [
    {
      "titulo": "Título da Pauta/Seção/Tópico",
      "descricao": "Descrição detalhada"
    }
  ],
  "decisoes": [
    {
      "descricao": "Descrição da decisão/norma/regra",
      "responsavel": "Nome do responsável (se houver)",
      "prazo": "Prazo para execução (se houver, formato YYYY-MM-DD)"
    }
  ],
  "acoes": [
    {
      "descricao": "Descrição da ação/obrigação/tarefa",
      "responsavel": "Nome do responsável",
      "prazo": "Prazo para execução (formato YYYY-MM-DD, se disponível)",
      "status": "Status da ação (Ex: PENDENTE, CONCLUIDA, ou deixe vazio se não aplicável)"
    }
  ],
  "observacoes": "Quaisquer outras observações relevantes do documento."
}
\`\`\`
`;

    try {
      const startTime = Date.now();
      let resposta = '';
      let tempoProcessamento = 0;
      let custoFormatado: string | undefined;
      let modeloUsado = '';

      // Usar Gemini para processar (PDF ou TXT)
      if (this.gemini) {
        this.logger.log('Processando documento com Google Gemini...');

        try {
          const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
          if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY não configurada');
          }

          // Usar API REST do Gemini (mais eficiente, como no exemplo)
          // Modelos disponíveis: gemini-1.5-flash, gemini-2.0-flash, gemini-2.5-flash
          const API_MODEL = 'gemini-2.0-flash'; // Modelo mais recente com melhor suporte a documentos e OCR
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${geminiApiKey}`;

          // Preparar conteúdo baseado no tipo de arquivo
          let payload: {
            contents: Array<{
              role: string;
              parts: Array<{
                text?: string;
                inlineData?: { mimeType: string; data: string };
              }>;
            }>;
          };

          if (usarGeminiDiretamente && extensao === 'pdf') {
            // PDF - enviar como anexo
            const pdfBase64 = dto.conteudoBase64;
            const mimeType = 'application/pdf';

            const geminiPrompt = `${prompt}

IMPORTANTE: Analise o PDF anexado e extraia TODAS as informações estruturadas.`;

            payload = {
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: geminiPrompt },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: pdfBase64,
                      },
                    },
                  ],
                },
              ],
            };
          } else {
            // TXT - enviar texto no prompt
            payload = {
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
            };
          }

          // Tentar com retry (como no exemplo)
          const MAX_RETRIES = 5;
          let delay = 2000; // Delay inicial maior para evitar 429

          for (let i = 0; i < MAX_RETRIES; i++) {
            try {
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                interface GeminiResponse {
                  candidates?: Array<{
                    content?: {
                      parts?: Array<{ text?: string }>;
                    };
                  }>;
                }
                const result = (await response.json()) as GeminiResponse;
                resposta =
                  result.candidates?.[0]?.content?.parts?.[0]?.text || '';

                if (resposta) {
                  tempoProcessamento = Date.now() - startTime;
                  modeloUsado = API_MODEL;
                  this.logger.log(
                    `Gemini processou documento em ${tempoProcessamento}ms`,
                  );
                  break; // Sucesso
                } else {
                  throw new Error('Resposta da API Gemini estava vazia');
                }
              } else if (response.status === 429) {
                // Erro de rate limit (429) - aumentar delay significativamente
                const retryAfter = response.headers.get('Retry-After');
                const retryAfterSeconds = retryAfter
                  ? parseInt(retryAfter, 10) * 1000
                  : delay;
                const actualDelay = Math.max(delay, retryAfterSeconds);

                this.logger.warn(
                  `Rate limit (429) na tentativa ${i + 1}/${MAX_RETRIES}. Aguardando ${actualDelay}ms antes de tentar novamente...`,
                );

                if (i === MAX_RETRIES - 1) {
                  // Última tentativa falhou
                  const errorText = await response.text();
                  throw new Error(
                    `Rate limit excedido na API Gemini após ${MAX_RETRIES} tentativas. ` +
                      `Aguarde alguns minutos e tente novamente. ` +
                      `Detalhes: ${errorText}`,
                  );
                }

                await new Promise((resolve) =>
                  setTimeout(resolve, actualDelay),
                );
                delay = Math.min(delay * 2, 60000); // Max 60 segundos
              } else if (response.status >= 500) {
                // Erro de servidor (>= 500), tentar novamente
                this.logger.warn(
                  `Erro ${response.status} na tentativa ${i + 1}, tentando novamente em ${delay}ms...`,
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2; // Backoff exponencial
              } else {
                const errorText = await response.text();
                throw new Error(
                  `Erro HTTP: ${response.status} ${response.statusText} - ${errorText}`,
                );
              }
            } catch (e) {
              const error = e instanceof Error ? e : new Error(String(e));
              if (i === MAX_RETRIES - 1) {
                throw error; // Lançar o erro na última tentativa
              }
              this.logger.warn(
                `Erro na tentativa ${i + 1}: ${error.message}, tentando novamente em ${delay}ms...`,
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              delay *= 2;
            }
          }
        } catch (geminiError) {
          const errorMessage =
            geminiError instanceof Error
              ? geminiError.message
              : String(geminiError);
          this.logger.error('Erro ao processar com Gemini:', geminiError);
          throw new Error(
            `Falha ao processar documento com Gemini: ${errorMessage}`,
          );
        }
      } else {
        throw new BadRequestException(
          'Gemini não está configurado. Configure GEMINI_API_KEY no arquivo .env do backend.',
        );
      }

      // Log da resposta bruta para debug
      this.logger.log(
        `Resposta bruta da IA (primeiros 1000 chars): ${resposta.substring(0, 1000)}`,
      );

      // Parsear resposta JSON
      let jsonLimpo = resposta.trim();

      // Remover delimitadores markdown se existirem
      if (jsonLimpo.startsWith('```')) {
        jsonLimpo = jsonLimpo.replace(/^```(?:json)?\s*/, '');
        jsonLimpo = jsonLimpo.replace(/\s*```$/, '');
      }

      // Extrair JSON se houver texto antes ou depois
      const jsonMatch = jsonLimpo.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonLimpo = jsonMatch[0];
        this.logger.log(
          `JSON extraído (primeiros 500 chars): ${jsonLimpo.substring(0, 500)}`,
        );
      } else {
        this.logger.error(
          'Resposta da IA não contém JSON válido. Resposta completa:',
          resposta,
        );
        throw new Error(
          'Resposta da IA não contém JSON válido. A IA pode não ter processado o documento corretamente.',
        );
      }

      interface DadosProcessados {
        titulo?: string;
        conteudo?: string;
        participantes?: Array<{
          nome?: string;
          email?: string;
          cargo?: string;
        }>;
        pautas?: Array<{ titulo?: string; descricao?: string }>;
        decisoes?: Array<{
          descricao?: string;
          responsavel?: string;
          prazo?: string;
        }>;
        acoes?: Array<{
          descricao?: string;
          responsavel?: string;
          status?: string;
        }>;
        secoes?: Array<{
          titulo?: string;
          artigos?: Array<{
            numero?: string;
            texto?: string;
            itens?: string[];
          }>;
        }>;
        descricao?: string;
        resumo?: string;
        tipo?: string;
        [key: string]: unknown;
      }
      let dadosProcessados: DadosProcessados;
      try {
        dadosProcessados = JSON.parse(jsonLimpo) as DadosProcessados;
      } catch (parseError: unknown) {
        this.logger.error(
          'Erro ao fazer parse do JSON da IA:',
          parseError instanceof Error ? parseError.message : String(parseError),
        );
        this.logger.error('JSON que falhou:', jsonLimpo.substring(0, 500));
        throw new Error(
          'Erro ao processar resposta da IA. O formato JSON está inválido.',
        );
      }

      // Log dos dados processados para debug
      this.logger.log('Dados processados pela IA:', {
        titulo: dadosProcessados.titulo,
        temParticipantes:
          Array.isArray(dadosProcessados.participantes) &&
          dadosProcessados.participantes.length > 0,
        temPautas:
          Array.isArray(dadosProcessados.pautas) &&
          dadosProcessados.pautas.length > 0,
        temDecisoes:
          Array.isArray(dadosProcessados.decisoes) &&
          dadosProcessados.decisoes.length > 0,
        temAcoes:
          Array.isArray(dadosProcessados.acoes) &&
          dadosProcessados.acoes.length > 0,
        tamanhoConteudo:
          typeof dadosProcessados.conteudo === 'string'
            ? dadosProcessados.conteudo.length
            : 0,
      });

      // Gerar número da ata
      const numero = await this.generateNumeroAta();

      // Validar e mapear tipo de reunião
      const tiposValidos = [
        'ASSEMBLEIA_GERAL',
        'CONSELHO_DIRETOR',
        'REUNIAO_ORDINARIA',
        'REUNIAO_EXTRAORDINARIA',
        'COMISSAO',
        'OUTRO',
      ];

      let tipoFinal = 'OUTRO';

      if (dadosProcessados.tipo) {
        const tipoProcessado = String(dadosProcessados.tipo).toUpperCase();
        if (tiposValidos.includes(tipoProcessado)) {
          tipoFinal = tipoProcessado as TipoReuniao;
          this.logger.log(`Tipo determinado pela IA: ${tipoFinal}`);
        } else {
          this.logger.warn(
            `Tipo retornado pela IA inválido: ${tipoProcessado}, usando OUTRO`,
          );
        }
      } else if (dto.tipoReuniao) {
        const tipoUsuario = String(dto.tipoReuniao).toUpperCase();
        if (tiposValidos.includes(tipoUsuario)) {
          tipoFinal = tipoUsuario as TipoReuniao;
          this.logger.log(
            `Tipo do usuário usado (IA não retornou): ${tipoFinal}`,
          );
        }
      }

      // Salvar arquivo original na pasta uploads
      const uploadsDir = path.join(process.cwd(), 'uploads', 'atas');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const randomName = crypto.randomBytes(16).toString('hex');
      const fileName = `${randomName}.${extensao}`;
      const filePath = path.join(uploadsDir, fileName);

      const fileBuffer = Buffer.from(dto.conteudoBase64, 'base64');
      fs.writeFileSync(filePath, fileBuffer);

      const arquivoUrl = `/uploads/atas/${fileName}`;

      interface ParticipanteProcessado {
        nome?: string;
        email?: string;
        cargo?: string;
      }
      interface PautaProcessada {
        titulo?: string;
        descricao?: string;
      }
      interface DecisaoProcessada {
        descricao?: string;
        responsavel?: string;
        prazo?: string;
      }
      interface AcaoProcessada {
        descricao?: string;
        responsavel?: string;
        status?: string;
        prazo?: string;
      }

      const participantes: ParticipanteProcessado[] = Array.isArray(
        dadosProcessados.participantes,
      )
        ? (dadosProcessados.participantes as ParticipanteProcessado[])
        : [];
      const pautas: PautaProcessada[] = Array.isArray(dadosProcessados.pautas)
        ? (dadosProcessados.pautas as PautaProcessada[])
        : [];
      const decisoes: DecisaoProcessada[] = Array.isArray(
        dadosProcessados.decisoes,
      )
        ? (dadosProcessados.decisoes as DecisaoProcessada[])
        : [];
      const acoes: AcaoProcessada[] = Array.isArray(dadosProcessados.acoes)
        ? (dadosProcessados.acoes as AcaoProcessada[])
        : [];

      const tituloFinal = dadosProcessados.titulo?.trim()
        ? dadosProcessados.titulo.trim()
        : dto.nomeArquivo.replace(/\.[^/.]+$/, '');

      // Construir conteúdo se não foi retornado diretamente
      let conteudoFinal = dadosProcessados.conteudo?.trim() || '';

      // Se não há conteúdo direto, tentar construir a partir de seções/artigos (para estatutos)
      if (
        !conteudoFinal &&
        dadosProcessados.secoes &&
        Array.isArray(dadosProcessados.secoes)
      ) {
        this.logger.log(
          'Construindo conteúdo a partir de seções/artigos retornados pela IA...',
        );
        const conteudoPartes: string[] = [];

        dadosProcessados.secoes.forEach((secao) => {
          if (secao.titulo) {
            conteudoPartes.push(`\n${secao.titulo}\n`);
          }

          if (secao.artigos && Array.isArray(secao.artigos)) {
            secao.artigos.forEach((artigo) => {
              if (artigo.numero) {
                conteudoPartes.push(`${artigo.numero}`);
              }
              if (artigo.texto) {
                conteudoPartes.push(`${artigo.texto}\n`);
              }
              if (artigo.itens && Array.isArray(artigo.itens)) {
                artigo.itens.forEach((item: string) => {
                  conteudoPartes.push(`- ${item}\n`);
                });
              }
            });
          }
        });

        conteudoFinal = conteudoPartes.join('\n').trim();
        this.logger.log(
          `Conteúdo construído: ${conteudoFinal.length} caracteres`,
        );
      }

      // Se ainda não há conteúdo, tentar usar o texto completo da resposta JSON
      if (!conteudoFinal) {
        // Tentar extrair todo o texto do JSON como fallback
        const jsonString = JSON.stringify(dadosProcessados, null, 2);
        this.logger.warn(
          'Nenhum conteúdo extraído. Tentando usar estrutura completa do JSON como conteúdo.',
        );
        conteudoFinal = jsonString;
      }

      // Validar conteúdo final
      if (!conteudoFinal || conteudoFinal.length === 0) {
        throw new Error(
          'Não foi possível extrair conteúdo do documento. Verifique se o arquivo contém texto válido.',
        );
      }

      const ata = await this.prisma.ataReuniao.create({
        data: {
          numero,
          titulo: tituloFinal,
          dataReuniao: new Date(dto.dataReuniao),
          tipo: tipoFinal as TipoReuniao,
          conteudo: conteudoFinal,
          descricao: dadosProcessados.descricao || undefined,
          resumo: dadosProcessados.resumo || undefined,
          // Participantes serão criados separadamente (é uma relação)
          pautas:
            pautas.length > 0
              ? (pautas as unknown as Prisma.InputJsonValue)
              : undefined,
          decisoes:
            decisoes.length > 0
              ? (decisoes as unknown as Prisma.InputJsonValue)
              : undefined,
          acoes:
            acoes.length > 0
              ? (acoes as unknown as Prisma.InputJsonValue)
              : undefined,
          observacoes:
            typeof dadosProcessados.observacoes === 'string'
              ? dadosProcessados.observacoes
              : undefined,
          criadoPor: userId,
          status: 'RASCUNHO',
          // Metadados de IA
          geradoPorIa: true,
          iaUsada: 'Google Gemini',
          modeloIa: modeloUsado || 'gemini-2.0-flash',
          custoIa: custoFormatado,
          tempoProcessamentoIa: tempoProcessamento,
          // Informações do arquivo original
          arquivoOriginalUrl: arquivoUrl,
          arquivoOriginalNome: dto.nomeArquivo,
          arquivoOriginalTipo:
            dto.tipoArquivo ||
            (extensao === 'pdf' ? 'application/pdf' : 'text/plain'),
        },
        include: {
          criador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      // Criar participantes separadamente (é uma relação, não um campo JSON)
      if (participantes.length > 0) {
        await this.prisma.ataParticipante.createMany({
          data: participantes.map((p) => ({
            ataId: ata.id,
            nomeExterno: p.nome || undefined,
            email: p.email || undefined,
            cargo: p.cargo || undefined,
            presente: true, // Default para participantes extraídos pela IA
            observacoes: undefined,
          })),
        });
        this.logger.log(
          `Criados ${participantes.length} participantes para a ata ${ata.id}`,
        );
      }

      // Mapear tipo de arquivo para o enum
      let tipoArquivoEnum: TipoArquivoAta;
      if (extensao === 'pdf') {
        tipoArquivoEnum = TipoArquivoAta.PDF;
      } else if (['doc', 'docx', 'txt'].includes(extensao || '')) {
        tipoArquivoEnum = TipoArquivoAta.DOCUMENTO;
      } else if (['xls', 'xlsx', 'csv'].includes(extensao || '')) {
        tipoArquivoEnum = TipoArquivoAta.PLANILHA;
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extensao || '')) {
        tipoArquivoEnum = TipoArquivoAta.IMAGEM;
      } else {
        tipoArquivoEnum = TipoArquivoAta.OUTRO;
      }

      // Criar registro de anexo para o arquivo original
      await this.prisma.ataAnexo.create({
        data: {
          ataId: ata.id,
          nomeArquivo: dto.nomeArquivo,
          urlArquivo: arquivoUrl,
          tipoArquivo: tipoArquivoEnum,
          tamanhoArquivo: fileBuffer.length,
          mimeType:
            dto.tipoArquivo ||
            (extensao === 'pdf' ? 'application/pdf' : 'text/plain'),
          uploadedAt: new Date(),
        },
      });

      this.logger.log(
        `Ata importada com sucesso: ${ata.id} (processado em ${tempoProcessamento}ms). Arquivo salvo em: ${arquivoUrl}`,
      );

      return {
        ...ata,
        tempoProcessamento,
        modelo: modeloUsado || 'gemini-2.0-flash',
      };
    } catch (error) {
      this.logger.error(`Erro ao importar ata:`, error);
      throw new BadRequestException(
        `Erro ao importar ata: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Busca todos os comentários de uma ata
   */
  async findComentarios(ataId: string) {
    // Verificar se a ata existe
    const ata = await this.prisma.ataReuniao.findUnique({
      where: { id: ataId },
      select: { id: true },
    });

    if (!ata) {
      throw new NotFoundException(`Ata com ID ${ataId} não encontrada`);
    }

    // Buscar apenas comentários principais (sem comentarioPaiId) com suas respostas
    const comentarios = await this.prisma.ataComentario.findMany({
      where: {
        ataId,
        comentarioPaiId: null, // Apenas comentários principais
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        respostas: {
          include: {
            autor: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comentarios;
  }

  /**
   * Cria um novo comentário em uma ata
   */
  async createComentario(
    ataId: string,
    dto: CreateComentarioDto,
    userId: string,
  ) {
    // Verificar se a ata existe
    const ata = await this.prisma.ataReuniao.findUnique({
      where: { id: ataId },
      select: { id: true },
    });

    if (!ata) {
      throw new NotFoundException(`Ata com ID ${ataId} não encontrada`);
    }

    // Se for uma resposta, verificar se o comentário pai existe
    if (dto.comentarioPaiId) {
      const comentarioPai = await this.prisma.ataComentario.findUnique({
        where: { id: dto.comentarioPaiId },
        select: { id: true, ataId: true },
      });

      if (!comentarioPai) {
        throw new NotFoundException(
          `Comentário pai com ID ${dto.comentarioPaiId} não encontrado`,
        );
      }

      // Verificar se o comentário pai pertence à mesma ata
      if (comentarioPai.ataId !== ataId) {
        throw new BadRequestException(
          'O comentário pai não pertence a esta ata',
        );
      }
    }

    // Criar o comentário
    const comentario = await this.prisma.ataComentario.create({
      data: {
        ataId,
        comentario: dto.comentario,
        tipo: dto.tipo,
        autorId: userId,
        comentarioPaiId: dto.comentarioPaiId || undefined,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Comentário criado: ${comentario.id} na ata ${ataId}`);
    return comentario;
  }

  /**
   * Atualiza um comentário existente
   */
  async updateComentario(id: string, dto: UpdateComentarioDto, userId: string) {
    // Buscar o comentário
    const comentario = await this.prisma.ataComentario.findUnique({
      where: { id },
      select: { id: true, autorId: true },
    });

    if (!comentario) {
      throw new NotFoundException(`Comentário com ID ${id} não encontrado`);
    }

    // Verificar se o usuário é o autor do comentário
    if (comentario.autorId !== userId) {
      throw new BadRequestException(
        'Você não tem permissão para editar este comentário',
      );
    }

    // Atualizar o comentário
    const comentarioAtualizado = await this.prisma.ataComentario.update({
      where: { id },
      data: {
        comentario: dto.comentario,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Comentário atualizado: ${id}`);
    return comentarioAtualizado;
  }

  /**
   * Remove um comentário
   */
  async removeComentario(id: string, userId: string) {
    // Buscar o comentário
    const comentario = await this.prisma.ataComentario.findUnique({
      where: { id },
      select: { id: true, autorId: true, ataId: true },
    });

    if (!comentario) {
      throw new NotFoundException(`Comentário com ID ${id} não encontrado`);
    }

    // Verificar se o usuário é o autor do comentário
    if (comentario.autorId !== userId) {
      throw new BadRequestException(
        'Você não tem permissão para deletar este comentário',
      );
    }

    // Deletar o comentário (respostas serão deletadas em cascade)
    await this.prisma.ataComentario.delete({
      where: { id },
    });

    this.logger.log(`Comentário deletado: ${id}`);
    return { success: true };
  }

  /**
   * Exporta uma ata em formato HTML
   */
  async exportarHTML(id: string): Promise<string> {
    const ata = await this.findOne(id);

    const formatDate = (dateString: string | Date) => {
      if (!dateString) return 'Não informado';
      const date =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return 'Não informado';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    const formatDateTime = (dateString: string | Date) => {
      if (!dateString) return 'Não informado';
      const date =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return 'Não informado';
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getStatusText = (status: string) => {
      switch (status?.toUpperCase()) {
        case 'RASCUNHO':
          return 'Rascunho';
        case 'PUBLICADA':
          return 'Publicada';
        case 'ARQUIVADA':
          return 'Arquivada';
        default:
          return status || 'Não informado';
      }
    };

    const getTipoReuniaoText = (tipo: string) => {
      switch (tipo?.toUpperCase()) {
        case 'ASSEMBLEIA_GERAL':
          return 'Assembleia Geral';
        case 'CONSELHO_DIRETOR':
          return 'Conselho Diretor';
        case 'REUNIAO_ORDINARIA':
          return 'Reunião Ordinária';
        case 'REUNIAO_EXTRAORDINARIA':
          return 'Reunião Extraordinária';
        case 'COMISSAO':
          return 'Comissão';
        case 'OUTRO':
          return 'Outro';
        default:
          return tipo || 'Não informado';
      }
    };

    const getStatusClass = (status?: string) => {
      if (!status) return 'status-default';
      switch (status.toLowerCase()) {
        case 'concluida':
        case 'concluído':
          return 'status-concluida';
        case 'pendente':
          return 'status-pendente';
        case 'em_andamento':
        case 'em andamento':
          return 'status-andamento';
        default:
          return 'status-default';
      }
    };

    const getStatusTextAction = (status?: string) => {
      if (!status) return 'Não informado';
      switch (status.toLowerCase()) {
        case 'concluida':
        case 'concluído':
          return 'Concluída';
        case 'pendente':
          return 'Pendente';
        case 'em_andamento':
        case 'em andamento':
          return 'Em Andamento';
        case 'cancelada':
          return 'Cancelada';
        default:
          return status;
      }
    };

    // Parse campos JSON
    interface Pauta {
      titulo?: string;
      descricao?: string;
    }
    interface Decisao {
      descricao?: string;
      responsavel?: string;
      prazo?: string;
    }
    interface Acao {
      descricao?: string;
      responsavel?: string;
      status?: string;
      prazo?: string;
    }

    const pautas: Pauta[] = Array.isArray(ata.pautas)
      ? (ata.pautas as Pauta[])
      : typeof ata.pautas === 'string'
        ? (JSON.parse(ata.pautas || '[]') as Pauta[])
        : [];

    const decisoes: Decisao[] = Array.isArray(ata.decisoes)
      ? (ata.decisoes as Decisao[])
      : typeof ata.decisoes === 'string'
        ? (JSON.parse(ata.decisoes || '[]') as Decisao[])
        : [];

    const acoes: Acao[] = Array.isArray(ata.acoes)
      ? (ata.acoes as Acao[])
      : typeof ata.acoes === 'string'
        ? (JSON.parse(ata.acoes || '[]') as Acao[])
        : [];

    interface ParticipanteFormatado {
      nome: string;
      cargo: string;
      presente: boolean;
    }
    const participantes = (ata.participantes || []).map(
      (p): ParticipanteFormatado => ({
        nome: p.usuario?.nome || p.nomeExterno || 'Participante',
        cargo: p.cargo || 'Não informado',
        presente: p.presente || false,
      }),
    );

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ata.titulo || 'ATA de Reunião'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 10px;
        }

        .logo {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
            color: #2c3e50;
        }

        .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }

        .meeting-info {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 15px;
            border-left: 3px solid #3498db;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin-bottom: 10px;
        }

        .info-item {
            display: flex;
            align-items: center;
        }

        .info-label {
            font-weight: bold;
            margin-right: 6px;
            min-width: 80px;
            font-size: 11px;
        }

        .info-value {
            color: #555;
            font-size: 11px;
        }

        .section {
            margin-bottom: 15px;
        }

        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            padding-bottom: 3px;
            border-bottom: 1px solid #ecf0f1;
        }

        .participants-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 11px;
        }

        .participants-table th,
        .participants-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
        }

        .participants-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
            font-size: 10px;
        }

        .participants-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .status-present {
            background-color: #d4edda;
            color: #155724;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }

        .status-ausente {
            background-color: #f8d7da;
            color: #721c24;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }

        .agenda-item {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 8px;
        }

        .agenda-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 4px;
            font-size: 11px;
        }

        .agenda-description {
            color: #666;
            font-style: italic;
            font-size: 10px;
        }

        .decisions-list {
            list-style: none;
            padding: 0;
        }

        .decisions-list li {
            background: #e8f5e8;
            border-left: 3px solid #28a745;
            padding: 8px;
            margin-bottom: 6px;
            border-radius: 0 4px 4px 0;
        }

        .decision-prazo {
            font-weight: bold;
            color: #28a745;
            margin-bottom: 3px;
            font-size: 10px;
        }

        .decision-desc {
            margin-bottom: 4px;
            font-size: 10px;
        }

        .decision-responsavel {
            font-size: 9px;
            color: #666;
            font-style: italic;
        }

        .actions-list {
            list-style: none;
            padding: 0;
        }

        .actions-list li {
            background: #fff3cd;
            border-left: 3px solid #ffc107;
            padding: 8px;
            margin-bottom: 6px;
            border-radius: 0 4px 4px 0;
        }

        .action-status {
            display: inline-block;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .status-concluida {
            background-color: #d4edda;
            color: #155724;
        }

        .status-pendente {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-andamento {
            background-color: #d1ecf1;
            color: #0c5460;
        }

        .status-default {
            background-color: #e2e3e5;
            color: #383d41;
        }

        .content-text {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            border-left: 3px solid #6c757d;
            font-size: 10px;
            line-height: 1.5;
            text-align: justify;
            white-space: pre-wrap;
        }

        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ecf0f1;
            text-align: center;
            color: #666;
            font-size: 9px;
        }

        .ai-info {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 10px;
        }

        .ai-label {
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 3px;
            font-size: 10px;
        }

        .ai-details {
            color: #666;
            font-size: 9px;
        }

        .no-data {
            color: #666;
            font-style: italic;
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
        }

        @media print {
            body {
                padding: 20px;
            }
            
            .header {
                page-break-after: avoid;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">REDE UNIÃO NACIONAL DE PEÇAS</div>
        <div class="title">ATA DE REUNIÃO</div>
        <div class="subtitle">${ata.titulo || 'ATA de Reunião'}</div>
    </div>

    <div class="meeting-info">
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">📅 Data:</span>
                <span class="info-value">${formatDate(ata.dataReuniao)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">📄 Tipo:</span>
                <span class="info-value">${getTipoReuniaoText(ata.tipo)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">👥 Participantes:</span>
                <span class="info-value">${participantes.length} pessoas</span>
            </div>
            <div class="info-item">
                <span class="info-label">📊 Status:</span>
                <span class="info-value">${getStatusText(ata.status)}</span>
            </div>
        </div>
        ${
          ata.descricao
            ? `
        <div class="info-item">
            <span class="info-label">📝 Descrição:</span>
            <span class="info-value">${ata.descricao}</span>
        </div>
        `
            : ''
        }
    </div>

    ${
      ata.geradoPorIa
        ? `
    <div class="ai-info">
        <div class="ai-label">⚡ Processamento por IA</div>
        <div class="ai-details">
            <strong>IA Utilizada:</strong> ${ata.iaUsada || 'Não informado'}<br>
            <strong>Modelo:</strong> ${ata.modeloIa || 'Não informado'}<br>
            ${ata.arquivoOriginalNome ? `<strong>Arquivo Original:</strong> ${ata.arquivoOriginalNome}<br>` : ''}
            <strong>Processado em:</strong> ${formatDateTime(ata.createdAt)}
        </div>
    </div>
    `
        : ''
    }

    ${
      participantes.length > 0
        ? `
    <div class="section">
        <div class="section-title">👥 PARTICIPANTES</div>
        <table class="participants-table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Cargo</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${participantes
                  .map(
                    (p) => `
                <tr>
                    <td><strong>${p.nome || 'Não informado'}</strong></td>
                    <td>${p.cargo || 'Não informado'}</td>
                    <td>
                        <span class="${p.presente ? 'status-present' : 'status-ausente'}">
                            ${p.presente ? 'Presente' : 'Ausente'}
                        </span>
                    </td>
                </tr>
                `,
                  )
                  .join('')}
            </tbody>
        </table>
    </div>
    `
        : ''
    }

    ${
      pautas.length > 0
        ? `
    <div class="section">
        <div class="section-title">📋 PAUTAS DA REUNIÃO</div>
        ${pautas
          .map(
            (pauta) => `
        <div class="agenda-item">
            <div class="agenda-title">${pauta.titulo || 'Pauta sem título'}</div>
            ${pauta.descricao ? `<div class="agenda-description">${pauta.descricao}</div>` : ''}
        </div>
        `,
          )
          .join('')}
    </div>
    `
        : ''
    }

    ${
      decisoes.length > 0
        ? `
    <div class="section">
        <div class="section-title">✅ DECISÕES TOMADAS</div>
        <ul class="decisions-list">
            ${decisoes
              .map(
                (decisao) => `
            <li>
                ${decisao.prazo ? `<div class="decision-prazo">Prazo: ${decisao.prazo}</div>` : ''}
                <div class="decision-desc">${decisao.descricao || 'Sem descrição'}</div>
                ${decisao.responsavel ? `<div class="decision-responsavel">Responsável: ${decisao.responsavel}</div>` : ''}
            </li>
            `,
              )
              .join('')}
        </ul>
    </div>
    `
        : ''
    }

    ${
      acoes.length > 0
        ? `
    <div class="section">
        <div class="section-title">🎯 AÇÕES DEFINIDAS</div>
        <ul class="actions-list">
            ${acoes
              .map(
                (acao) => `
            <li>
                <div class="action-status ${getStatusClass(acao.status || undefined)}">${getStatusTextAction(acao.status || undefined)}</div>
                <div class="decision-desc">${acao.descricao || 'Sem descrição'}</div>
                ${acao.responsavel ? `<div class="decision-responsavel">Responsável: ${acao.responsavel}</div>` : ''}
                ${acao.prazo ? `<div class="decision-responsavel">Prazo: ${acao.prazo}</div>` : ''}
            </li>
            `,
              )
              .join('')}
        </ul>
    </div>
    `
        : ''
    }

    ${
      ata.resumo
        ? `
    <div class="section">
        <div class="section-title">📄 RESUMO EXECUTIVO</div>
        <div class="content-text">
            ${ata.resumo}
        </div>
    </div>
    `
        : ''
    }

    ${
      ata.conteudo
        ? `
    <div class="section">
        <div class="section-title">📄 CONTEÚDO COMPLETO DA ATA</div>
        <div class="content-text">
            ${ata.conteudo}
        </div>
    </div>
    `
        : ''
    }

    <div class="footer">
        <p><strong>Rede União Nacional de Peças</strong></p>
        <p>CNPJ: 11.139.968/0001-10</p>
        <p>Av. Leopoldo Sander, 880-E - Eldorado - Chapecó/SC</p>
        <p>Documento gerado automaticamente em ${formatDateTime(ata.createdAt)}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Extrai texto de um PDF usando Gemini
   */
  async extrairTextoPDF(
    arquivo: Express.Multer.File,
  ): Promise<{ texto: string; tempoProcessamento: number }> {
    if (!this.gemini) {
      throw new BadRequestException(
        'Gemini AI não está configurado. Configure GEMINI_API_KEY no arquivo .env do backend.',
      );
    }

    const startTime = Date.now();
    this.logger.log('Extraindo texto do PDF com Gemini...');

    try {
      const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY não configurada');
      }

      const API_MODEL = 'gemini-2.0-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${geminiApiKey}`;

      // Ler arquivo e converter para base64
      const fileBuffer = fs.readFileSync(arquivo.path);
      const pdfBase64 = fileBuffer.toString('base64');

      const prompt = `Extraia TODO o texto deste PDF de forma estruturada e completa.
Mantenha a formatação original quando possível, incluindo quebras de linha e parágrafos.
Retorne APENAS o texto extraído, sem comentários ou explicações adicionais.`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Baixa temperatura para extração precisa
          maxOutputTokens: 8000,
        },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro HTTP: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      interface GeminiResponse {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      }

      const result = (await response.json()) as GeminiResponse;
      const texto = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tempoProcessamento = Date.now() - startTime;

      if (!texto) {
        throw new Error('Nenhum texto foi extraído do PDF');
      }

      this.logger.log(
        `Texto extraído do PDF em ${tempoProcessamento}ms (${texto.length} caracteres)`,
      );

      return { texto, tempoProcessamento };
    } catch (error) {
      this.logger.error('Erro ao extrair texto do PDF:', error);
      throw new BadRequestException(
        `Erro ao extrair texto do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Transcreve texto em uma ata profissional usando modelo
   */
  async transcreverComModelo(
    texto: string,
    tipoReuniao: TipoReuniao,
    modeloAtaId?: string,
  ): Promise<{
    transcricao: string;
    tempoProcessamento: number;
    modeloUsado: string;
  }> {
    if (!this.gemini) {
      throw new BadRequestException(
        'Gemini AI não está configurado. Configure GEMINI_API_KEY no arquivo .env do backend.',
      );
    }

    const startTime = Date.now();
    this.logger.log('Transcrevendo texto com IA usando modelo...');

    try {
      // Buscar modelo de ata
      let modeloAta:
        | Awaited<ReturnType<typeof this.modeloAtaService.findOne>>
        | Awaited<ReturnType<typeof this.modeloAtaService.findByTipoReuniao>>
        | null = null;
      if (modeloAtaId) {
        modeloAta = await this.modeloAtaService.findOne(modeloAtaId);
      } else {
        const modeloEncontrado =
          await this.modeloAtaService.findByTipoReuniao(tipoReuniao);
        if (modeloEncontrado) {
          modeloAta = await this.modeloAtaService.findOne(modeloEncontrado.id);
        }
      }

      const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY não configurada');
      }

      const API_MODEL = 'gemini-2.0-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${geminiApiKey}`;

      // Criar prompt baseado no modelo
      let prompt = `Você é um especialista em transcrever atas de reuniões de forma profissional.

Tipo de Reunião: ${tipoReuniao}

Texto extraído do documento:
${texto}

Transcreva este texto em uma ata profissional, seguindo a estrutura padrão de atas formais e usando linguagem adequada e profissional.`;

      if (modeloAta) {
        prompt = `Você é um especialista em transcrever atas de reuniões de forma profissional.

Tipo de Reunião: ${tipoReuniao}

Estrutura esperada (baseada no modelo "${modeloAta.nome}"):
${JSON.stringify(modeloAta.estrutura, null, 2)}

${modeloAta.instrucoes ? `Instruções do modelo:\n${modeloAta.instrucoes}\n` : ''}

${modeloAta.exemplo ? `Exemplo de formato esperado:\n${JSON.stringify(modeloAta.exemplo, null, 2)}\n` : ''}

Texto extraído do documento:
${texto}

Transcreva este texto em uma ata profissional, seguindo a estrutura do modelo e usando linguagem formal e adequada.`;
      }

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000,
        },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro HTTP: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      interface GeminiResponse {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      }

      const result = (await response.json()) as GeminiResponse;
      const transcricao =
        result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tempoProcessamento = Date.now() - startTime;

      if (!transcricao) {
        throw new Error('Nenhuma transcrição foi gerada');
      }

      this.logger.log(
        `Transcrição gerada em ${tempoProcessamento}ms (${transcricao.length} caracteres)`,
      );

      return {
        transcricao,
        tempoProcessamento,
        modeloUsado: API_MODEL,
      };
    } catch (error) {
      this.logger.error('Erro ao transcrever texto:', error);
      throw new BadRequestException(
        `Erro ao transcrever texto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Extrai tópicos importantes do texto
   */
  async extrairTopicosImportantes(texto: string): Promise<{
    topicos: Array<{ titulo: string; descricao: string; importancia: string }>;
    tempoProcessamento: number;
  }> {
    if (!this.gemini) {
      throw new BadRequestException(
        'Gemini AI não está configurado. Configure GEMINI_API_KEY no arquivo .env do backend.',
      );
    }

    const startTime = Date.now();
    this.logger.log('Extraindo tópicos importantes...');

    try {
      const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY não configurada');
      }

      const API_MODEL = 'gemini-2.0-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${geminiApiKey}`;

      const prompt = `Analise o seguinte texto de uma reunião e identifique os tópicos mais importantes:

${texto}

Retorne uma lista JSON com os tópicos no formato:
[
  {
    "titulo": "Título do tópico",
    "descricao": "Descrição breve do tópico",
    "importancia": "alta|media|baixa"
  }
]

Retorne APENAS o JSON, sem texto adicional ou explicações.`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2000,
        },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro HTTP: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      interface GeminiResponse {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      }

      const result = (await response.json()) as GeminiResponse;
      const resposta = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tempoProcessamento = Date.now() - startTime;

      // Tentar extrair JSON da resposta
      let topicos: Array<{
        titulo: string;
        descricao: string;
        importancia: string;
      }> = [];

      try {
        // Tentar encontrar JSON na resposta (pode estar entre ```json ... ```)
        const jsonMatch = resposta.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          topicos = JSON.parse(jsonMatch[0]) as Array<{
            titulo: string;
            descricao: string;
            importancia: string;
          }>;
        } else {
          topicos = JSON.parse(resposta) as Array<{
            titulo: string;
            descricao: string;
            importancia: string;
          }>;
        }
      } catch (parseError: unknown) {
        this.logger.warn(
          'Erro ao fazer parse dos tópicos, retornando lista vazia',
          parseError instanceof Error ? parseError.message : String(parseError),
        );
        topicos = [];
      }

      this.logger.log(
        `Tópicos extraídos em ${tempoProcessamento}ms (${topicos.length} tópicos)`,
      );

      return { topicos, tempoProcessamento };
    } catch (error) {
      this.logger.error('Erro ao extrair tópicos:', error);
      throw new BadRequestException(
        `Erro ao extrair tópicos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Processa um rascunho: extrai texto, transcreve e extrai tópicos
   */
  async processarRascunhoComIA(
    arquivo: Express.Multer.File,
    dto: ImportarRascunhoDto,
    userId: string,
  ) {
    this.logger.log(
      `Processando rascunho: ${arquivo.originalname} - Tipo: ${dto.tipoReuniao}`,
    );

    // 1. Extrair texto do PDF
    const { texto, tempoProcessamento: tempoExtracao } =
      await this.extrairTextoPDF(arquivo);

    // 2. Transcrever com IA
    const {
      transcricao,
      tempoProcessamento: tempoTranscricao,
      modeloUsado,
    } = await this.transcreverComModelo(
      texto,
      dto.tipoReuniao,
      dto.modeloAtaId,
    );

    // 3. Extrair tópicos importantes
    const { topicos, tempoProcessamento: tempoTopicos } =
      await this.extrairTopicosImportantes(texto);

    // 4. Criar ata como RASCUNHO
    const numero = await this.generateNumeroAta();
    const dataReuniao = new Date(dto.dataReuniao);

    // Salvar arquivo
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'atas');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const hashArquivo = crypto
      .createHash('md5')
      .update(arquivo.buffer)
      .digest('hex');
    const nomeArquivo = `${hashArquivo}-${arquivo.originalname}`;
    const arquivoPath = path.join(uploadsDir, nomeArquivo);
    fs.writeFileSync(arquivoPath, arquivo.buffer);
    const arquivoUrl = `/uploads/atas/${nomeArquivo}`;

    const ata = await this.prisma.ataReuniao.create({
      data: {
        numero,
        titulo: `Ata de ${dto.tipoReuniao} - ${dataReuniao.toLocaleDateString('pt-BR')}`,
        tipo: dto.tipoReuniao,
        dataReuniao,
        status: StatusAta.RASCUNHO,
        conteudo: transcricao,
        descricao: `Rascunho processado automaticamente com IA`,
        geradoPorIa: true,
        iaUsada: 'Google Gemini',
        modeloIa: modeloUsado,
        tempoProcessamentoIa: tempoExtracao + tempoTranscricao + tempoTopicos,
        arquivoOriginalUrl: arquivoUrl,
        arquivoOriginalNome: arquivo.originalname,
        arquivoOriginalTipo: arquivo.mimetype || 'application/pdf',
        modeloAtaId: dto.modeloAtaId,
        criadoPor: userId,
      },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
        modeloAta: {
          include: {
            criador: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `Rascunho criado com sucesso: ${ata.numero} (ID: ${ata.id})`,
    );

    return {
      ata,
      textoExtraido: texto,
      transcricao,
      topicos,
      metadados: {
        tempoExtracao,
        tempoTranscricao,
        tempoTopicos,
        tempoTotal: tempoExtracao + tempoTranscricao + tempoTopicos,
        modeloUsado,
      },
    };
  }

  /**
   * Importa uma ata como "Em Processo"
   */
  async importarEmProcesso(
    arquivo: Express.Multer.File,
    dto: ImportarEmProcessoDto,
    userId: string,
  ) {
    this.logger.log(
      `Importando ata em processo: ${arquivo.originalname} - Tipo: ${dto.tipoReuniao}`,
    );

    // Processar arquivo normalmente (similar ao importarAta)
    const importarDto: ImportarAtaDto = {
      nomeArquivo: arquivo.originalname,
      tipoArquivo: arquivo.mimetype || 'application/pdf',
      conteudoBase64: arquivo.buffer.toString('base64'),
      dataReuniao: dto.dataReuniao,
      tipoReuniao: dto.tipoReuniao,
    };

    // Importar a ata normalmente
    const ata = await this.importarAta(importarDto, userId);

    // Atualizar status para EM_PROCESSO e adicionar dados específicos
    const updateData: Prisma.AtaReuniaoUpdateInput = {
      status: StatusAta.EM_PROCESSO,
    };

    if (dto.dataAssinatura) {
      updateData.dataAssinatura = new Date(dto.dataAssinatura);
      updateData.pendenteAssinatura = false;
    } else {
      updateData.pendenteAssinatura = true;
    }

    if (dto.observacoes) {
      updateData.observacoes = dto.observacoes;
    }

    const ataAtualizada = await this.prisma.ataReuniao.update({
      where: { id: ata.id },
      data: updateData,
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
      },
    });

    this.logger.log(
      `Ata importada como "Em Processo": ${ataAtualizada.numero}`,
    );

    return ataAtualizada;
  }
}
