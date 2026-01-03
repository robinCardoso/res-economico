import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../core/prisma/prisma.service';
import { RelatoriosService } from '../relatorios/relatorios.service';
import { EmpresaContextoService } from './empresa-contexto.service';
import { EmpresaContexto } from './interfaces/empresa-contexto.interface';
import Groq from 'groq-sdk';
import type { AnalisarDadosDto } from './dto/analisar-dados.dto';
import type { AnaliseResponse, Insight } from './dto/insight.dto';
import { TipoAnalise } from './dto/analisar-dados.dto';
import { TipoRelatorio } from '../relatorios/dto/gerar-relatorio.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groq: Groq | null;
  // Modelos disponíveis do Groq (atualizado em nov/2025):
  // - llama-3.1-8b-instant: Rápido e eficiente para análises simples
  // - llama-3.1-70b-versatile: Descontinuado
  // - mixtral-8x7b-32768: Bom para análises complexas
  // - gemma-7b-it: Alternativa leve
  private readonly model = 'llama-3.1-8b-instant'; // Modelo rápido e eficiente (llama-3.1-70b-versatile foi descontinuado)

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly relatoriosService: RelatoriosService,
    private readonly empresaContextoService: EmpresaContextoService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GROQ_API_KEY não configurada. Funcionalidades de AI estarão desabilitadas.',
      );
      this.groq = null;
    } else {
      this.groq = new Groq({ apiKey });
      this.logger.log('Groq AI inicializado com sucesso');
    }
  }

  /**
   * Analisa dados financeiros e gera insights usando Groq AI
   */
  async analisarDados(dto: AnalisarDadosDto): Promise<AnaliseResponse> {
    if (!this.groq) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            'Groq AI não está configurado. Configure GROQ_API_KEY no arquivo .env do backend.',
          error: 'SERVICE_UNAVAILABLE',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    this.logger.log(`Iniciando análise do tipo: ${dto.tipo}`);

    // NOVO: Coletar contexto da empresa se empresaId estiver presente
    let contextoEmpresa: EmpresaContexto | null = null;
    if (dto.empresaId) {
      contextoEmpresa =
        await this.empresaContextoService.coletarContextoEmpresa(dto.empresaId);
      if (contextoEmpresa) {
        this.logger.log(
          `Contexto da empresa coletado: ${contextoEmpresa.razaoSocial}`,
        );
      }
    }

    // Coletar dados baseado no tipo de análise
    const dados = await this.coletarDadosParaAnalise(dto);

    // Adicionar contexto da empresa aos dados
    if (contextoEmpresa) {
      dados.contextoEmpresa = contextoEmpresa;
    }

    // Preparar prompt para o Groq
    const prompt = this.criarPrompt(dto.tipo, dados);

    try {
      // Preparar prompt do sistema com contexto da empresa
      const contextoEmpresaParaPrompt = dados.contextoEmpresa as
        | EmpresaContexto
        | undefined;
      const systemPrompt = this.criarSystemPrompt(contextoEmpresaParaPrompt);

      // Chamar Groq AI
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 4000, // Aumentado para permitir análises mais completas
      });

      const resposta = completion.choices[0]?.message?.content || '';

      // Processar resposta do Groq e estruturar
      const analise = this.processarRespostaGroq(resposta, dto, dados);

      this.logger.log(
        `Análise concluída com ${analise.insights.length} insights`,
      );

      return analise;
    } catch (error) {
      this.logger.error('Erro ao analisar dados com Groq AI:', error);

      // Extrair mensagem de erro do Groq
      let errorMessage = 'Erro desconhecido ao analisar dados';
      let statusCode = HttpStatus.BAD_REQUEST;

      if (error && typeof error === 'object') {
        // Verificar se é erro de limite de tokens (413) ou rate limit (429)
        const errorObj = error as { status?: number; error?: unknown };
        if (
          'status' in errorObj &&
          (errorObj.status === 413 || errorObj.status === 429)
        ) {
          statusCode = HttpStatus.PAYLOAD_TOO_LARGE;

          // Tentar extrair mensagem detalhada do Groq
          let groqMessage = '';
          if (
            'error' in errorObj &&
            errorObj.error &&
            typeof errorObj.error === 'object'
          ) {
            const errorError = errorObj.error as { error?: unknown };
            if (
              'error' in errorError &&
              errorError.error &&
              typeof errorError.error === 'object'
            ) {
              const groqError = errorError.error as {
                message?: string;
                code?: string;
                type?: string;
              };
              if (groqError.message) {
                groqMessage = groqError.message;
                this.logger.warn(
                  'Limite de tokens do Groq excedido:',
                  groqMessage,
                );
              }
            }
          }

          if (
            groqMessage.includes('tokens per minute') ||
            groqMessage.includes('rate_limit_exceeded')
          ) {
            errorMessage =
              'Limite de tokens por minuto do Groq excedido. O sistema já otimizou os dados enviados. Aguarde alguns segundos e tente novamente.';
          } else if (groqMessage.includes('Request too large')) {
            errorMessage =
              'Os dados são muito grandes para análise mesmo após otimização. Tente períodos com menos dados ou aguarde o reset do limite (1 minuto).';
          } else {
            errorMessage =
              'Limite de tokens do Groq excedido. Aguarde alguns segundos e tente novamente.';
          }
        } else if ('error' in error) {
          const groqError = error as {
            error?: { message?: string; code?: string };
          };
          if (groqError.error?.message) {
            errorMessage = groqError.error.message;
            // Verificar se menciona limite de tokens
            if (
              groqError.error.message.includes('too large') ||
              groqError.error.message.includes('tokens') ||
              groqError.error.message.includes('rate_limit')
            ) {
              statusCode = HttpStatus.PAYLOAD_TOO_LARGE;
              errorMessage =
                'Limite de tokens do Groq excedido. Aguarde alguns segundos e tente novamente.';
            }
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        // Verificar se é erro de limite
        if (
          error.message.includes('413') ||
          error.message.includes('429') ||
          error.message.includes('too large') ||
          error.message.includes('rate_limit')
        ) {
          statusCode = HttpStatus.PAYLOAD_TOO_LARGE;
          errorMessage =
            'Limite de tokens do Groq excedido. Aguarde alguns segundos e tente novamente.';
        }
      }

      throw new HttpException(
        {
          statusCode,
          message: errorMessage,
          error:
            statusCode === HttpStatus.PAYLOAD_TOO_LARGE
              ? 'PAYLOAD_TOO_LARGE'
              : 'GROQ_API_ERROR',
        },
        statusCode,
      );
    }
  }

  /**
   * Coleta dados do banco baseado no tipo de análise
   */
  private async coletarDadosParaAnalise(
    dto: AnalisarDadosDto,
  ): Promise<Record<string, unknown>> {
    const dados: Record<string, unknown> = {};

    switch (dto.tipo) {
      case TipoAnalise.UPLOAD:
        if (dto.uploadId) {
          const upload = await this.prisma.upload.findUnique({
            where: { id: dto.uploadId },
            include: {
              empresa: {
                select: {
                  id: true,
                  razaoSocial: true,
                  filial: true,
                  cnpj: true,
                },
              },
              alertas: {
                take: 20,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  tipo: true,
                  severidade: true,
                  mensagem: true,
                  status: true,
                },
              },
            },
          });

          if (upload) {
            // Buscar estatísticas resumidas das linhas DRE (tipo 3-DRE)
            const estatisticasLinhas = await this.prisma.linhaUpload.groupBy({
              by: ['tipoConta'],
              where: {
                uploadId: dto.uploadId,
                tipoConta: '3-DRE', // Filtrar apenas DRE
              },
              _count: { id: true },
              _sum: {
                saldoAtual: true,
                debito: true,
                credito: true,
              },
              _avg: {
                saldoAtual: true,
              },
            });

            // Buscar apenas as top 15 linhas DRE por saldo (mais relevantes)
            const topLinhas = await this.prisma.linhaUpload.findMany({
              where: {
                uploadId: dto.uploadId,
                tipoConta: '3-DRE', // Filtrar apenas DRE
              },
              take: 15,
              orderBy: { saldoAtual: 'desc' },
              select: {
                classificacao: true,
                conta: true,
                nomeConta: true,
                tipoConta: true,
                saldoAtual: true,
                debito: true,
                credito: true,
              },
            });

            // Buscar linhas DRE com valores zerados ou anômalos
            const linhasAnomalas = await this.prisma.linhaUpload.findMany({
              where: {
                uploadId: dto.uploadId,
                tipoConta: '3-DRE', // Filtrar apenas DRE
                OR: [
                  { saldoAtual: 0 },
                  { debito: { gt: 0 }, credito: { gt: 0 } }, // Débito e crédito simultâneos
                ],
              },
              take: 15,
              select: {
                classificacao: true,
                conta: true,
                nomeConta: true,
                tipoConta: true,
                saldoAtual: true,
                debito: true,
                credito: true,
              },
            });

            // Criar objeto resumido
            dados.upload = {
              id: upload.id,
              empresa: upload.empresa,
              mes: upload.mes,
              ano: upload.ano,
              status: upload.status,
              totalLinhas: upload.totalLinhas,
              nomeArquivo: upload.nomeArquivo,
              alertas: upload.alertas,
              estatisticas: {
                porTipoConta: estatisticasLinhas,
                totalLinhas: upload.totalLinhas,
                topLinhas: topLinhas,
                linhasAnomalas: linhasAnomalas,
              },
            };
          }
        }
        break;

      case TipoAnalise.ALERTAS: {
        const alertas = await this.prisma.alerta.findMany({
          where: {
            status: 'ABERTO',
            ...(dto.empresaId && { upload: { empresaId: dto.empresaId } }),
          },
          include: {
            upload: {
              include: { empresa: true },
            },
          },
          take: 100,
          orderBy: { createdAt: 'desc' },
        });
        dados.alertas = alertas;
        break;
      }

      case TipoAnalise.RELATORIO:
        // Buscar dados do relatório DRE (apenas tipo 3-DRE) - versão otimizada
        if (dto.ano) {
          const uploads = await this.prisma.upload.findMany({
            where: {
              ano: dto.ano,
              ...(dto.mes && { mes: dto.mes }),
              ...(dto.empresaId && { empresaId: dto.empresaId }),
              status: {
                in: ['CONCLUIDO', 'COM_ALERTAS'],
              },
            },
            select: {
              id: true,
              mes: true,
              ano: true,
              status: true,
              totalLinhas: true,
              empresa: {
                select: {
                  id: true,
                  razaoSocial: true,
                  filial: true,
                },
              },
            },
            take: 10, // Limitar a 10 uploads
          });

          const uploadIds = uploads.map((u) => u.id);

          if (uploadIds.length > 0) {
            // Estatísticas resumidas por tipo de conta
            const estatisticasPorTipo = await this.prisma.linhaUpload.groupBy({
              by: ['tipoConta'],
              where: {
                uploadId: { in: uploadIds },
                tipoConta: '3-DRE',
                ...(dto.descricao && {
                  nomeConta: { contains: dto.descricao, mode: 'insensitive' },
                }),
              },
              _count: { id: true },
              _sum: {
                saldoAtual: true,
                debito: true,
                credito: true,
              },
              _avg: {
                saldoAtual: true,
              },
            });

            // Top 10 linhas DRE por saldo (mais relevantes) - reduzido para economizar tokens
            const topLinhas = await this.prisma.linhaUpload.findMany({
              where: {
                uploadId: { in: uploadIds },
                tipoConta: '3-DRE',
                ...(dto.descricao && {
                  nomeConta: { contains: dto.descricao, mode: 'insensitive' },
                }),
              },
              take: 10, // Reduzido de 20 para 10
              orderBy: { saldoAtual: 'desc' },
              select: {
                classificacao: true,
                conta: true,
                nomeConta: true,
                saldoAtual: true,
              },
            });

            // Linhas anômalas (valores zerados ou inconsistentes) - reduzido
            const linhasAnomalas = await this.prisma.linhaUpload.findMany({
              where: {
                uploadId: { in: uploadIds },
                tipoConta: '3-DRE',
                OR: [
                  { saldoAtual: 0 },
                  { debito: { gt: 0 }, credito: { gt: 0 } },
                ],
              },
              take: 10, // Reduzido de 15 para 10
              select: {
                classificacao: true,
                conta: true,
                nomeConta: true,
                saldoAtual: true,
              },
            });

            // Contar total de linhas DRE
            const totalLinhasDRE = await this.prisma.linhaUpload.count({
              where: {
                uploadId: { in: uploadIds },
                tipoConta: '3-DRE',
                ...(dto.descricao && {
                  nomeConta: { contains: dto.descricao, mode: 'insensitive' },
                }),
              },
            });

            // Criar objeto resumido e simplificado (minimizar tokens)
            dados.relatorio = {
              periodo: `${dto.mes ? `${dto.mes}/` : ''}${dto.ano}`,
              totalUploads: uploads.length,
              totalLinhasDRE,
              // Estatísticas resumidas (apenas totais, não detalhes)
              estatisticas: {
                totalSaldos: estatisticasPorTipo.reduce(
                  (acc, e) => acc + Number(e._sum.saldoAtual || 0),
                  0,
                ),
                totalDebitos: estatisticasPorTipo.reduce(
                  (acc, e) => acc + Number(e._sum.debito || 0),
                  0,
                ),
                totalCreditos: estatisticasPorTipo.reduce(
                  (acc, e) => acc + Number(e._sum.credito || 0),
                  0,
                ),
                mediaSaldo:
                  estatisticasPorTipo.reduce(
                    (acc, e) => acc + Number(e._avg.saldoAtual || 0),
                    0,
                  ) / estatisticasPorTipo.length || 0,
              },
              // Apenas top 10 linhas (sem débito/crédito para economizar)
              topLinhas: topLinhas.map((l) => ({
                classificacao: l.classificacao,
                conta: l.conta,
                nomeConta: l.nomeConta,
                saldoAtual: Number(l.saldoAtual),
              })),
              // Apenas 10 linhas anômalas
              linhasAnomalas: linhasAnomalas.map((l) => ({
                classificacao: l.classificacao,
                conta: l.conta,
                nomeConta: l.nomeConta,
                saldoAtual: Number(l.saldoAtual),
              })),
            };
          } else {
            dados.relatorio = {
              periodo: `${dto.mes ? `${dto.mes}/` : ''}${dto.ano}`,
              totalUploads: 0,
              totalLinhasDRE: 0,
              estatisticas: {
                totalSaldos: 0,
                totalDebitos: 0,
                totalCreditos: 0,
                mediaSaldo: 0,
              },
              topLinhas: [],
              linhasAnomalas: [],
            };
          }
        }
        break;

      case TipoAnalise.COMPARATIVO:
        // Buscar dados do relatório comparativo - versão otimizada
        if (dto.mes1 && dto.ano1 && dto.mes2 && dto.ano2) {
          const tipoRelatorio: TipoRelatorio = dto.empresaId
            ? TipoRelatorio.FILIAL
            : TipoRelatorio.CONSOLIDADO;
          const tipoValor = dto.tipoValor || 'ACUMULADO';

          try {
            // Determinar tipo de comparação baseado nos períodos
            let tipoComparacao = 'CUSTOMIZADO';
            if (dto.ano1 === dto.ano2 && dto.mes2 === dto.mes1 + 1) {
              tipoComparacao = 'MES_A_MES';
            } else if (dto.ano2 === dto.ano1 + 1 && dto.mes1 === dto.mes2) {
              tipoComparacao = 'ANO_A_ANO';
            }

            const relatorioComparativo =
              await this.relatoriosService.gerarRelatorioComparativo(
                tipoComparacao,
                dto.mes1,
                dto.ano1,
                dto.mes2,
                dto.ano2,
                tipoRelatorio,
                dto.empresaId,
                dto.empresaIds,
                dto.descricao,
                tipoValor,
              );

            // Criar versão resumida para enviar à IA (não enviar todas as contas)
            const todasContas = relatorioComparativo.contas || [];

            // Top 15 contas com maior variação absoluta (positiva ou negativa)
            const topVariacaoAbsoluta = [...todasContas]
              .sort(
                (a, b) =>
                  Math.abs(b.diferenca || 0) - Math.abs(a.diferenca || 0),
              )
              .slice(0, 15)
              .map((c) => ({
                classificacao: c.classificacao,
                conta: c.conta,
                nomeConta: c.nomeConta,
                valorPeriodo1: c.valorPeriodo1,
                valorPeriodo2: c.valorPeriodo2,
                diferenca: c.diferenca,
                percentual: c.percentual,
              }));

            // Top 15 contas com maior variação percentual (positiva ou negativa)
            const topVariacaoPercentual = [...todasContas]
              .filter(
                (c) =>
                  c.percentual !== null &&
                  c.percentual !== undefined &&
                  !isNaN(c.percentual),
              )
              .sort(
                (a, b) =>
                  Math.abs(b.percentual || 0) - Math.abs(a.percentual || 0),
              )
              .slice(0, 15)
              .map((c) => ({
                classificacao: c.classificacao,
                conta: c.conta,
                nomeConta: c.nomeConta,
                valorPeriodo1: c.valorPeriodo1,
                valorPeriodo2: c.valorPeriodo2,
                diferenca: c.diferenca,
                percentual: c.percentual,
              }));

            // Estatísticas resumidas
            const totalContas = todasContas.length;
            const somaPeriodo1 = todasContas.reduce(
              (sum, c) => sum + (c.valorPeriodo1 || 0),
              0,
            );
            const somaPeriodo2 = todasContas.reduce(
              (sum, c) => sum + (c.valorPeriodo2 || 0),
              0,
            );
            const somaDiferenca = todasContas.reduce(
              (sum, c) => sum + (c.diferenca || 0),
              0,
            );
            const mediaPercentual = todasContas
              .filter(
                (c) =>
                  c.percentual !== null &&
                  c.percentual !== undefined &&
                  !isNaN(c.percentual),
              )
              .reduce(
                (sum, c, _, arr) =>
                  sum + Math.abs(c.percentual || 0) / arr.length,
                0,
              );

            // Criar objeto resumido (não enviar todas as contas)
            dados.relatorioComparativo = {
              periodo1: {
                mes: dto.mes1,
                ano: dto.ano1,
                label: `${this.getMesNome(dto.mes1)}/${dto.ano1}`,
              },
              periodo2: {
                mes: dto.mes2,
                ano: dto.ano2,
                label: `${this.getMesNome(dto.mes2)}/${dto.ano2}`,
              },
              tipo: tipoRelatorio,
              empresaId: relatorioComparativo.empresaId,
              empresaNome: relatorioComparativo.empresaNome,
              uf: relatorioComparativo.uf,
              tipoComparacao,
              tipoValor,
              estatisticas: {
                totalContas,
                somaPeriodo1,
                somaPeriodo2,
                somaDiferenca,
                mediaPercentualVariacao: mediaPercentual,
                totais: relatorioComparativo.totais,
              },
              topVariacaoAbsoluta,
              topVariacaoPercentual,
            };
          } catch (error) {
            this.logger.error('Erro ao buscar relatório comparativo:', error);
            dados.erro =
              'Não foi possível buscar os dados do relatório comparativo';
          }
        } else {
          dados.erro =
            'Parâmetros insuficientes para análise comparativa (mes1, ano1, mes2, ano2 são obrigatórios)';
        }
        break;

      case TipoAnalise.GERAL: {
        // Análise geral do sistema
        const totalUploads = await this.prisma.upload.count();
        const totalAlertas = await this.prisma.alerta.count({
          where: { status: 'ABERTO' },
        });
        const empresas = await this.prisma.empresa.findMany({
          include: {
            uploads: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        });
        dados.estatisticas = {
          totalUploads,
          totalAlertas,
          totalEmpresas: empresas.length,
        };
        dados.empresas = empresas;
        break;
      }
    }

    return dados;
  }

  /**
   * Cria prompt do sistema com contexto da empresa
   */
  private criarSystemPrompt(contextoEmpresa?: EmpresaContexto): string {
    const basePrompt = `Você é um analista financeiro especializado em análise de Demonstração de Resultado do Exercício (DRE). 

${contextoEmpresa ? `Você está analisando dados da empresa "${contextoEmpresa.nomeFantasia || contextoEmpresa.razaoSocial}" (${contextoEmpresa.setor || 'setor não informado'}, ${contextoEmpresa.porte || 'porte não informado'}).` : ''}

IMPORTANTE: Sua resposta DEVE seguir este formato estruturado:

## Resumo Executivo
[Forneça um resumo executivo conciso e objetivo (2-3 parágrafos) destacando os principais achados da análise. Cite valores específicos, percentuais e contas relevantes quando disponíveis. Seja direto e acionável.${contextoEmpresa?.setor ? ` Considere o contexto do setor ${contextoEmpresa.setor}.` : ''}]

## Insights Principais
[Liste 3-5 insights mais importantes, cada um com título, descrição e impacto. Use formato: "• Título: Descrição detalhada (Impacto: ALTO/MÉDIO/BAIXO)"]

## Padrões Anômalos Detectados
[Identifique padrões anômalos específicos com valores, contas e classificações quando disponíveis.${contextoEmpresa?.setor ? ` Compare com padrões típicos do setor ${contextoEmpresa.setor}.` : ''} Se não houver anomalias significativas, informe claramente.]

## Recomendações Estratégicas
[Forneça 3-5 recomendações PRÁTICAS e ACIONÁVEIS baseadas nos dados analisados.${contextoEmpresa?.porte ? ` Adapte as recomendações ao porte ${contextoEmpresa.porte} da empresa.` : ''}${
      contextoEmpresa?.modeloNegocio === 'ASSOCIACAO'
        ? ` 

Para associações, foque em recomendações ESPECÍFICAS e QUANTIFICADAS:
- Exemplo: "Aumentar contribuição mensal em 15% para cobrir custos operacionais"
- Exemplo: "Reduzir custos de sistema em 10% através de renegociação de contratos"
- Exemplo: "Aumentar base de associados em 20% através de campanha de adesão"
- Exemplo: "Ajustar mensalidades de R$ X para R$ Y para atingir margem de segurança de 15%"

NÃO use recomendações vagas como "melhorar receitas" ou "reduzir custos". Seja ESPECÍFICO com valores, percentuais e ações concretas.`
        : ''
    } Priorize ações que tenham maior impacto e forneça valores/percentuais específicos quando possível.]

## Avaliação de Saúde Financeira
${
  contextoEmpresa?.modeloNegocio === 'ASSOCIACAO'
    ? `[Para associações, avalie especificamente:
- Cobertura de custos: Mensalidades cobrem custos operacionais? Qual a margem? (Cite valores específicos)
- Proporção de receitas: Mensalidades vs. Bonificações (ideal: mensalidades > 70%) - Cite percentuais reais
- Tendência de mensalidades: Crescendo, estável ou declinando? (Cite variação percentual se disponível)
- Margem de segurança: Diferença entre receita total e custos (ideal: > 15%) - Cite valor e percentual
- Eficiência: Custo por associado vs. receita por associado (se dados disponíveis)
- Pontos críticos: Identifique riscos específicos do modelo associativo
- Sustentabilidade: A taxa de adesão e contribuição mensal são suficientes? Quanto precisa aumentar?]`
    : `[Avalie a saúde financeira geral da empresa considerando receitas, custos, margens e tendências. Cite valores e percentuais específicos.]`
}

Regras:
- Responda SEMPRE em português brasileiro
- Seja ESPECÍFICO: cite números, valores, percentuais, nomes de contas e classificações quando disponíveis
- Evite generalizações vagas como "a empresa está crescendo" - seja preciso: "Receita Operacional Bruta aumentou 15% de R$ X para R$ Y"
- Priorize informações acionáveis e relevantes para tomada de decisão
- Use linguagem profissional mas acessível
${contextoEmpresa?.setor ? `- Considere benchmarks e padrões típicos do setor ${contextoEmpresa.setor}` : ''}
${contextoEmpresa?.porte ? `- Adapte recomendações ao porte ${contextoEmpresa.porte} da empresa` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **NÃO avalie margem de lucro em vendas** (é zero por design do modelo)` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **Foque em mensalidades e bonificações** como indicadores de saúde` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **Identifique pontos críticos**: cobertura de custos, tendência de mensalidades, margem de segurança` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **Alerte sobre riscos**: se mensalidades não cobrem custos, se bonificações são >50% da receita, se custos crescem mais que receita` : ''}
${contextoEmpresa?.tipo === 'MATRIZ' && contextoEmpresa?.custosCentralizados ? `- **Custos altos na matriz são NORMAIS quando centralizados** - não é um problema, é a estrutura organizacional. A matriz PODE ESTAR NEGATIVA e isso é ESPERADO. Foque em avaliar se receitas (mensalidades + bonificações) cobrem esses custos centralizados.` : ''}
${contextoEmpresa?.tipo === 'MATRIZ' && contextoEmpresa?.receitasCentralizadas ? `- **Receitas altas (ex: bonificações) na matriz são NORMAIS quando centralizadas** - não é um problema, é a estrutura organizacional.` : ''}
${contextoEmpresa?.tipo === 'FILIAL' ? `- **Analise a operação individual da filial** - custos/receitas podem estar baixos ou ausentes se centralizados na matriz. A filial pode parecer saudável, mas isso é porque custos operacionais (salários, assessoria, contabilidade, etc.) estão na matriz. NÃO interprete ausência de custos como problema.` : ''}
- **Forneça recomendações PRÁTICAS e QUANTIFICADAS**: ex: "Aumentar contribuição mensal em 15%" ou "Reduzir custos de X em 10%"
- **Foque na SUSTENTABILIDADE REAL**: taxa de adesão e contribuição mensal são o que sustenta a empresa`;

    return basePrompt;
  }

  /**
   * Cria prompt específico baseado no tipo de análise
   */
  private criarPrompt(
    tipo: TipoAnalise,
    dados: Record<string, unknown>,
  ): string {
    const dadosStr = JSON.stringify(dados, null, 2);
    const contextoEmpresa = dados.contextoEmpresa as
      | EmpresaContexto
      | undefined;

    // Seção de contexto da empresa (se disponível)
    let contextoSection = '';
    if (contextoEmpresa) {
      contextoSection = `
## CONTEXTO DA EMPRESA
${contextoEmpresa.nomeFantasia || contextoEmpresa.razaoSocial}
- Setor: ${contextoEmpresa.setor || 'Não informado'}
- Porte: ${contextoEmpresa.porte || 'Não informado'}
- UF: ${contextoEmpresa.uf || 'Não informado'}
- Tipo: ${contextoEmpresa.tipo}
${contextoEmpresa.dataFundacao ? `- Fundada em: ${new Date(contextoEmpresa.dataFundacao).getFullYear()}` : ''}
${contextoEmpresa.descricao ? `- Descrição: ${contextoEmpresa.descricao}` : ''}
- Total de uploads históricos: ${contextoEmpresa.totalUploads}
- Períodos com dados: ${contextoEmpresa.mesesComDados.join(', ')}
${contextoEmpresa.estatisticas?.receitaMediaMensal ? `- Receita média mensal (histórico): R$ ${contextoEmpresa.estatisticas.receitaMediaMensal.toLocaleString('pt-BR')}` : ''}

${
  contextoEmpresa.modeloNegocio
    ? `## MODELO DE NEGÓCIO
- Tipo: ${contextoEmpresa.modeloNegocio}
${
  contextoEmpresa.modeloNegocio === 'ASSOCIACAO'
    ? `
⚠️ MODELO ESPECIAL: ASSOCIAÇÃO PARA RETIFICAS

CARACTERÍSTICAS DO MODELO:
- A empresa NÃO tem margem de lucro nas vendas (compra por X, vende por X)
- Fontes de receita principais:
  ${contextoEmpresa.contasReceita?.mensalidades ? `  • Mensalidades (conta DRE: ${contextoEmpresa.contasReceita.mensalidades})` : '  • Mensalidades'}
  ${contextoEmpresa.contasReceita?.bonificacoes ? `  • Bonificações de fornecedores (conta DRE: ${contextoEmpresa.contasReceita.bonificacoes})` : '  • Bonificações de fornecedores'}
- Estrutura organizacional:
  ${contextoEmpresa.custosCentralizados ? '  • Custos operacionais CENTRALIZADOS na matriz' : '  • Custos operacionais distribuídos'}
  ${contextoEmpresa.receitasCentralizadas ? '  • Receitas (ex: bonificações) CENTRALIZADAS na matriz' : '  • Receitas distribuídas'}
  ${contextoEmpresa.contasCustos ? `  • Principais custos: ${Object.keys(contextoEmpresa.contasCustos).join(', ')}` : ''}

⚠️ ENTENDENDO VISÃO INDIVIDUAL vs. CONSOLIDADA:
${
  contextoEmpresa.tipo === 'MATRIZ'
    ? `
- Você está analisando dados da MATRIZ (sede/headquarters)
${
  contextoEmpresa.custosCentralizados
    ? `
🚨 CRÍTICO ENTENDER:
- A matriz PODE ESTAR NEGATIVA e isso é ESPERADO quando custos estão centralizados
- Custos operacionais altos na matriz são NORMAIS e ESPERADOS - isso é a estrutura organizacional, NÃO é um problema
- A matriz concentra custos que servem a TODAS as filiais (salários, assessoria, contabilidade, sistema, etc.)
- O que você DEVE avaliar:
  ✓ Se as receitas (mensalidades + bonificações) cobrem os custos centralizados
  ✓ Se a estrutura está sustentável considerando receitas totais vs. custos centralizados
  ✓ Se há necessidade de ajustar mensalidades ou reduzir custos
- NÃO interprete custos altos como problema - é a estrutura organizacional
- NÃO interprete resultado negativo como problema se receitas cobrem custos centralizados
`
    : ''
}
${
  contextoEmpresa.receitasCentralizadas
    ? `
- Receitas altas (ex: bonificações) na matriz são NORMAIS e ESPERADAS - isso é a estrutura organizacional, não um problema
- A matriz concentra receitas que servem a todas as unidades
`
    : ''
}
- A matriz concentra custos/receitas que servem a todas as unidades
- Foque em avaliar se as receitas (mensalidades + bonificações) cobrem os custos centralizados
- Avalie a SUSTENTABILIDADE considerando a estrutura completa (matriz + filiais)
`
    : `
- Você está analisando dados de uma FILIAL (unidade individual)
${
  contextoEmpresa.custosCentralizados
    ? `
🚨 CRÍTICO ENTENDER:
- A filial PODE PARECER SAUDÁVEL, mas isso é porque custos estão centralizados na matriz
- Custos operacionais podem estar BAIXOS ou AUSENTES porque são centralizados na matriz
- Você NÃO verá lançamentos como:
  • Salários de funcionários administrativos
  • Assessoria/auditoria
  • Contabilidade
  • Sistema/tecnologia
  • Outros custos operacionais centralizados
- Isso NÃO significa que a filial não tem esses custos - eles estão na matriz
- O que você DEVE avaliar:
  ✓ A operação individual da filial (receitas locais vs. custos locais)
  ✓ Se a filial está gerando receita suficiente para sua operação
  ✓ Se há custos locais que precisam ser cobertos
- NÃO interprete ausência de custos como problema - eles estão centralizados
- NÃO avalie a saúde financeira completa sem considerar custos centralizados na matriz
`
    : ''
}
${
  contextoEmpresa.receitasCentralizadas
    ? `
- Receitas podem estar baixas se bonificações estão centralizadas na matriz
- A filial pode não ter receitas de bonificações porque estão na matriz
`
    : ''
}
- Foque em avaliar a operação individual da filial
- Considere que custos/receitas centralizados não aparecem nos dados da filial
- Para avaliar saúde financeira completa, considere também os custos/receitas na matriz
`
}

MÉTRICAS CRÍTICAS PARA AVALIAR SAÚDE FINANCEIRA:
1. Cobertura de custos por mensalidades: Mensalidades devem cobrir custos operacionais
2. Proporção mensalidades vs. bonificações: Bonificações são complementares, não principais
3. Margem de segurança: Diferença entre receita total e custos totais
4. Tendência de mensalidades: Crescimento/declínio no número de associados
5. Eficiência operacional: Custo por associado vs. receita por associado

🎯 SUSTENTABILIDADE REAL DA EMPRESA:
- O que SUSTENTA a empresa é a TAXA DE ADESÃO e a CONTRIBUIÇÃO MENSAL de cada associado
- Mensalidades são a fonte primária de receita e devem ser suficientes para cobrir custos
- Bonificações são complementares e não devem ser a principal fonte de receita
- Para melhorar a saúde financeira, foque em:
  • Aumentar a base de associados (taxa de adesão)
  • Ajustar a contribuição mensal quando necessário
  • Manter custos operacionais controlados

PONTOS CRÍTICOS A MONITORAR:
- Se mensalidades não cobrem custos operacionais → CRÍTICO
- Se bonificações representam >50% da receita → ATENÇÃO (dependência de fornecedores)
- Se custos operacionais crescem mais que receita → CRÍTICO
- Se há queda consistente em mensalidades → CRÍTICO
- Se margem de segurança < 10% → ATENÇÃO

IMPORTANTE: Ao analisar os dados, considere que:
- Variações em "vendas" não geram lucro (é normal ter saldo zero)
- Foque em mensalidades e bonificações como indicadores de saúde
${
  contextoEmpresa.tipo === 'MATRIZ' && contextoEmpresa.custosCentralizados
    ? `
🚨 ATENÇÃO ESPECIAL PARA MATRIZ COM CUSTOS CENTRALIZADOS:
- A matriz PODE ESTAR NEGATIVA e isso é ESPERADO quando custos estão centralizados
- Custos altos na matriz são NORMAIS quando centralizados - não é um problema, é a estrutura organizacional
- A matriz concentra custos que servem todas as filiais (salários, assessoria, contabilidade, sistema, etc.)
- Você DEVE avaliar se receitas (mensalidades + bonificações) cobrem os custos centralizados
- NÃO interprete resultado negativo como problema se receitas cobrem custos centralizados
- NÃO interprete custos altos como problema - é a estrutura organizacional
`
    : ''
}
${contextoEmpresa.tipo === 'MATRIZ' && contextoEmpresa.receitasCentralizadas ? '- Receitas altas (ex: bonificações) na matriz são NORMAIS quando centralizadas - não é um problema, é a estrutura organizacional' : ''}
${
  contextoEmpresa.tipo === 'FILIAL' && contextoEmpresa.custosCentralizados
    ? `
🚨 ATENÇÃO ESPECIAL PARA FILIAL COM CUSTOS CENTRALIZADOS:
- A filial PODE PARECER SAUDÁVEL, mas isso é porque custos estão centralizados na matriz
- Você NÃO verá lançamentos como salários, assessoria, contabilidade, sistema - eles estão na matriz
- Isso NÃO significa que a filial não tem esses custos - eles estão centralizados
- Avalie a operação individual da filial, mas considere que custos operacionais estão na matriz
- NÃO interprete ausência de custos como problema - eles estão centralizados na matriz
`
    : ''
}
- Custos/receitas centralizados na matriz devem ser cobertos pelas receitas totais
- Identifique se há necessidade de ajustar mensalidades ou reduzir custos
- Forneça recomendações PRÁTICAS e ACIONÁVEIS: ex: "Aumentar contribuição mensal em X%" ou "Reduzir custos de X em Y%"
`
    : ''
}
${contextoEmpresa.modeloNegocioDetalhes ? `- Detalhes: ${JSON.stringify(contextoEmpresa.modeloNegocioDetalhes, null, 2)}` : ''}
`
    : ''
}

IMPORTANTE: Use este contexto para:
- Ajustar expectativas e benchmarks conforme o setor, porte e modelo de negócio
- Identificar padrões setoriais vs. anomalias reais
- Fornecer recomendações específicas para o tipo de empresa
- Considerar sazonalidade típica do setor
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **AVALIAR SAÚDE FINANCEIRA baseada em mensalidades e bonificações, não em margem de vendas**` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **IDENTIFICAR PONTOS CRÍTICOS**: cobertura de custos, tendência de mensalidades, margem de segurança` : ''}

`;
    }

    switch (tipo) {
      case TipoAnalise.UPLOAD:
        return `${contextoSection}Analise detalhadamente os dados do upload fornecido. 

Foque em:
1. Identificar contas com valores mais significativos (top linhas) - cite valores específicos
2. Detectar anomalias específicas (valores zerados, débito e crédito simultâneos) - cite contas e classificações
3. Analisar estatísticas por tipo de conta
4. Fornecer insights acionáveis baseados nos dados reais
${contextoEmpresa?.setor ? `5. Considerar padrões típicos do setor ${contextoEmpresa.setor}` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `6. Focar em mensalidades e bonificações como indicadores principais de saúde financeira` : ''}

IMPORTANTE: Cite valores específicos, nomes de contas e classificações quando disponíveis. Evite generalizações vagas.

Dados do upload:
${dadosStr}`;

      case TipoAnalise.ALERTAS:
        return `Analise os alertas abertos do sistema. Identifique:
- Padrões comuns entre os alertas
- Tipos de problemas mais frequentes
- Sugestões de correções baseadas em padrões históricos
- Priorização de alertas por criticidade

Dados dos alertas:
${dadosStr}`;

      case TipoAnalise.RELATORIO:
        return `Analise detalhadamente os dados resumidos do relatório DRE (Demonstração de Resultado do Exercício). 
Os dados foram otimizados e incluem apenas estatísticas e as linhas mais relevantes.

Foque em:
1. Analisar as top linhas por saldo (maior impacto financeiro) - cite valores específicos
2. Identificar padrões anômalos específicos (valores zerados, inconsistências)
3. Comparar estatísticas por tipo de conta
4. Fornecer insights baseados nos dados reais do período analisado
${
  contextoEmpresa?.tipo === 'MATRIZ' && contextoEmpresa?.custosCentralizados
    ? `
5. 🚨 ATENÇÃO ESPECIAL - MATRIZ COM CUSTOS CENTRALIZADOS:
   - Se a matriz estiver NEGATIVA, isso PODE SER ESPERADO quando custos estão centralizados
   - Custos altos na matriz são NORMAIS - a matriz concentra custos de todas as filiais
   - Avalie se receitas (mensalidades + bonificações) cobrem os custos centralizados
   - NÃO interprete custos altos ou resultado negativo como problema - é estrutura organizacional
   - Foque em avaliar se a estrutura está sustentável (receitas totais vs. custos centralizados)
`
    : ''
}
${
  contextoEmpresa?.tipo === 'FILIAL' && contextoEmpresa?.custosCentralizados
    ? `
5. 🚨 ATENÇÃO ESPECIAL - FILIAL COM CUSTOS CENTRALIZADOS:
   - Se a filial parecer SAUDÁVEL mas não tiver custos operacionais (salários, assessoria, contabilidade, sistema), isso é porque estão centralizados na matriz
   - Você NÃO verá lançamentos como salários administrativos, assessoria, contabilidade - eles estão na matriz
   - Isso NÃO significa que a filial não tem esses custos - eles estão centralizados
   - Avalie a operação individual da filial, mas considere que custos operacionais estão na matriz
   - NÃO interprete ausência de custos como problema - eles estão centralizados na matriz
`
    : ''
}

IMPORTANTE: 
- Cite valores específicos, nomes de contas, classificações e o período analisado
- Seja preciso e acionável
- Analise apenas os dados fornecidos - não invente informações
${
  contextoEmpresa?.tipo === 'MATRIZ' && contextoEmpresa?.custosCentralizados
    ? `
- NÃO interprete custos altos ou resultado negativo como problema se custos estão centralizados - é estrutura organizacional
`
    : ''
}
${
  contextoEmpresa?.tipo === 'FILIAL' && contextoEmpresa?.custosCentralizados
    ? `
- NÃO interprete ausência de custos operacionais como problema - eles estão centralizados na matriz
`
    : ''
}

Dados resumidos do relatório:
${dadosStr}`;

      case TipoAnalise.COMPARATIVO:
        return `Analise detalhadamente os dados comparativos entre períodos. Os dados incluem:
- Estatísticas resumidas (totais, médias, somas)
- Top 15 contas com maior variação absoluta
- Top 15 contas com maior variação percentual

Foque em:
1. Analisar as variações mais significativas (cite valores e percentuais específicos)
2. Identificar contas com maior impacto na diferença entre períodos
3. Explicar possíveis causas das variações mais relevantes
4. Fornecer recomendações estratégicas baseadas nas contas com maior impacto

IMPORTANTE: Cite valores específicos de cada período, diferenças absolutas e percentuais, nomes de contas e classificações. Compare períodos de forma clara e acionável.

Dados comparativos resumidos:
${dadosStr}`;

      case TipoAnalise.GERAL:
        return `Analise a situação geral do sistema financeiro. Identifique:
- Saúde geral do sistema
- Áreas que precisam de atenção
- Tendências gerais
- Recomendações estratégicas

Dados gerais:
${dadosStr}`;

      default:
        return `Analise os dados fornecidos e gere insights relevantes:
${dadosStr}`;
    }
  }

  /**
   * Processa a resposta do Groq e estrutura em formato padronizado
   */
  private processarRespostaGroq(
    resposta: string,
    dto: AnalisarDadosDto,
    dados: Record<string, unknown>,
  ): AnaliseResponse {
    // Extrair insights da resposta
    const insights = this.extrairInsights(resposta);

    // Detectar padrões anômalos
    const padroesAnomalos = this.detectarPadroesAnomalos(dados, resposta);

    // Gerar sugestões de correção
    const sugestoesCorrecao = this.gerarSugestoesCorrecao(dados, resposta);

    // Criar resumo - usar a resposta completa do Groq
    const resumo = this.extrairResumo(resposta) || resposta;

    return {
      id: `analise-${Date.now()}`,
      tipo: dto.tipo,
      dataAnalise: new Date(),
      insights,
      padroesAnomalos,
      sugestoesCorrecao,
      resumo,
    };
  }

  /**
   * Extrai insights da resposta do Groq
   */
  private extrairInsights(resposta: string): Insight[] {
    const insights: Insight[] = [];

    // Tentar extrair insights estruturados da resposta
    // Se a resposta não estiver estruturada, criar insights baseados em palavras-chave
    const linhas = resposta.split('\n').filter((l) => l.trim());

    for (const linha of linhas) {
      if (
        linha.includes('⚠️') ||
        linha.includes('ATENÇÃO') ||
        linha.toLowerCase().includes('atenção')
      ) {
        insights.push({
          tipo: 'ATENCAO',
          titulo: 'Atenção Requerida',
          descricao: linha.replace(/⚠️|ATENÇÃO|atenção/g, '').trim(),
          confianca: 70,
          dados: {},
        });
      } else if (
        linha.includes('✅') ||
        linha.includes('POSITIVO') ||
        linha.toLowerCase().includes('positivo')
      ) {
        insights.push({
          tipo: 'POSITIVO',
          titulo: 'Aspecto Positivo',
          descricao: linha.replace(/✅|POSITIVO|positivo/g, '').trim(),
          confianca: 75,
          dados: {},
        });
      } else if (
        linha.includes('🔴') ||
        linha.includes('CRÍTICO') ||
        linha.toLowerCase().includes('crítico')
      ) {
        insights.push({
          tipo: 'CRITICO',
          titulo: 'Situação Crítica',
          descricao: linha.replace(/🔴|CRÍTICO|crítico/g, '').trim(),
          confianca: 80,
          dados: {},
        });
      } else if (linha.length > 50 && linha.match(/[0-9]/)) {
        // Linhas com números podem ser insights
        insights.push({
          tipo: 'INFORMATIVO',
          titulo: 'Informação Relevante',
          descricao: linha.trim(),
          confianca: 60,
          dados: {},
        });
      }
    }

    // Se não encontrou insights estruturados, criar um insight geral
    if (insights.length === 0) {
      insights.push({
        tipo: 'INFORMATIVO',
        titulo: 'Análise Completa',
        descricao: resposta.substring(0, 500),
        confianca: 65,
        dados: {},
      });
    }

    return insights.slice(0, 10); // Limitar a 10 insights
  }

  /**
   * Detecta padrões anômalos nos dados
   */
  private detectarPadroesAnomalos(
    dados: Record<string, unknown>,
    respostaGroq: string,
  ): Array<{
    tipo: string;
    descricao: string;
    severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
    dados: Record<string, unknown>;
  }> {
    const padroes: Array<{
      tipo: string;
      descricao: string;
      severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
      dados: Record<string, unknown>;
    }> = [];

    // Análise básica de padrões anômalos
    if ('upload' in dados && dados.upload) {
      const upload = dados.upload as {
        alertas?: Array<{ tipo: string; severidade: string }>;
      };
      if (upload.alertas && upload.alertas.length > 10) {
        padroes.push({
          tipo: 'MUITOS_ALERTAS',
          descricao: `Upload possui ${upload.alertas.length} alertas, indicando possível problema de qualidade dos dados`,
          severidade: 'ALTA',
          dados: { totalAlertas: upload.alertas.length },
        });
      }
    }

    // Extrair padrões mencionados na resposta do Groq
    if (
      respostaGroq.toLowerCase().includes('anômalo') ||
      respostaGroq.toLowerCase().includes('anomalo')
    ) {
      padroes.push({
        tipo: 'PADRAO_ANOMALO_DETECTADO',
        descricao: 'Padrão anômalo identificado pela análise de AI',
        severidade: 'MEDIA',
        dados: { fonte: 'groq_ai' },
      });
    }

    return padroes;
  }

  /**
   * Gera sugestões de correção baseadas nos dados e resposta do Groq
   */
  private gerarSugestoesCorrecao(
    dados: Record<string, unknown>,
    respostaGroq: string,
  ): Array<{
    alertaId?: string;
    problema: string;
    solucao: string;
    confianca: number;
  }> {
    const sugestoes: Array<{
      alertaId?: string;
      problema: string;
      solucao: string;
      confianca: number;
    }> = [];

    // Extrair sugestões da resposta do Groq
    if (
      respostaGroq.toLowerCase().includes('sugestão') ||
      respostaGroq.toLowerCase().includes('recomendação')
    ) {
      const linhas = respostaGroq.split('\n');
      for (const linha of linhas) {
        if (
          linha.toLowerCase().includes('sugestão') ||
          linha.toLowerCase().includes('recomendação')
        ) {
          sugestoes.push({
            problema: 'Problema identificado pela análise',
            solucao: linha.trim(),
            confianca: 70,
          });
        }
      }
    }

    return sugestoes.slice(0, 5); // Limitar a 5 sugestões
  }

  /**
   * Extrai resumo da resposta do Groq
   * Prioriza a seção "Resumo Executivo", caso contrário tenta outras seções de resumo
   */
  private extrairResumo(resposta: string): string {
    // Tentar encontrar seção "Resumo Executivo" (prioridade)
    const resumoExecutivoMatch = resposta.match(
      /##\s*Resumo\s*Executivo\s*\n([\s\S]+?)(?=\n##|$)/i,
    );
    if (resumoExecutivoMatch && resumoExecutivoMatch[1]) {
      return resumoExecutivoMatch[1].trim();
    }

    // Tentar encontrar outras seções de resumo
    const resumoMatch = resposta.match(
      /(?:##\s*)?(?:resumo|summary|conclusão|análise\s*executiva)[:：]?\s*\n?([\s\S]+?)(?=\n##|\n\n\n|$)/i,
    );
    if (resumoMatch && resumoMatch[1]) {
      return resumoMatch[1].trim();
    }

    // Tentar encontrar primeiro parágrafo significativo (mínimo 100 caracteres)
    const primeiroParagrafo = resposta
      .split('\n\n')
      .find((p) => p.trim().length >= 100);
    if (primeiroParagrafo) {
      return primeiroParagrafo.trim();
    }

    // Se não encontrar seção específica, retornar os primeiros 500 caracteres da resposta
    // para garantir que sempre há um resumo
    return (
      resposta.substring(0, 500).trim() + (resposta.length > 500 ? '...' : '')
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
