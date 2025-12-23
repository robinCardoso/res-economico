import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  FiltrosPerfilClienteDto,
  AlertaCliente,
  TipoAlerta,
  RecomendacaoAcao,
  TipoRecomendacao,
  SegmentacaoCliente,
  MetricasFinanceirasCliente,
  ComportamentoCompraCliente,
} from './dto/cliente-perfil-analytics.dto';

/**
 * Service para gerar alertas e recomendações acionáveis
 * Inclui alertas de inatividade, risco de churn e oportunidades de vendas
 */
@Injectable()
export class ClienteAlertasRecomendacoesService {
  private readonly logger = new Logger(
    ClienteAlertasRecomendacoesService.name,
  );

  constructor(private prisma: PrismaService) {}

  /**
   * Gera alertas para clientes
   */
  async gerarAlertas(
    filtros: FiltrosPerfilClienteDto = {},
  ): Promise<AlertaCliente[]> {
    this.logger.log('Gerando alertas de clientes...');

    const vendas = await this.buscarVendasClientes();
    const hoje = new Date();
    const alertas: AlertaCliente[] = [];

    // Agrupar por cliente e encontrar última compra
    const clientesMap = new Map<string, any>();

    for (const venda of vendas) {
      const chave = this.gerarChaveCliente(
        venda.nomeFantasia,
        venda.empresaId ?? undefined,
      );

      if (!clientesMap.has(chave)) {
        // Buscar data EXATA da primeira venda deste cliente
        const primeiraVendaReal = await this.prisma.venda.findFirst({
          where: {
            nomeFantasia: venda.nomeFantasia,
            ...(venda.empresaId ? { empresaId: venda.empresaId } : {}),
          },
          select: { dataVenda: true },
          orderBy: { dataVenda: 'desc' }, // Mais recente primeiro para última compra
        });
        
        clientesMap.set(chave, {
          nomeFantasia: venda.nomeFantasia,
          empresaId: venda.empresaId,
          ultimaCompra: primeiraVendaReal ? new Date(primeiraVendaReal.dataVenda) : new Date(venda.ano, venda.mes, 0),
          valorTotal: 0,
          quantidadeCompras: 0,
        });
      }

      const dados = clientesMap.get(chave);

      dados.valorTotal += Number(venda.totalValor || 0);
      dados.quantidadeCompras++;
    }

    // Gerar alertas de inatividade
    for (const [, dados] of clientesMap) {
      const diasSemCompra = Math.floor(
        (hoje.getTime() - dados.ultimaCompra.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Alerta: Cliente inativo há mais de 30 dias
      if (diasSemCompra >= 30 && diasSemCompra < 60) {
        const receitaPotencialPerdida =
          dados.quantidadeCompras > 0
            ? dados.valorTotal / dados.quantidadeCompras
            : 0;

        alertas.push({
          nomeFantasia: dados.nomeFantasia,
          empresaId: dados.empresaId,
          tipo: 'inativo_30_dias',
          prioridade: 'media',
          mensagem: `Cliente não compra há ${diasSemCompra} dias`,
          diasSemCompra,
          ultimaCompra: dados.ultimaCompra,
          receitaPotencialPerdida,
          acaoRecomendada:
            'Enviar comunicação personalizada com ofertas especiais',
        });
      }

      // Alerta: Cliente inativo há mais de 60 dias
      else if (diasSemCompra >= 60 && diasSemCompra < 90) {
        const receitaPotencialPerdida =
          dados.quantidadeCompras > 0
            ? (dados.valorTotal / dados.quantidadeCompras) * 1.5
            : 0;

        alertas.push({
          nomeFantasia: dados.nomeFantasia,
          empresaId: dados.empresaId,
          tipo: 'inativo_60_dias',
          prioridade: 'alta',
          mensagem: `ATENÇÃO: Cliente não compra há ${diasSemCompra} dias`,
          diasSemCompra,
          ultimaCompra: dados.ultimaCompra,
          receitaPotencialPerdida,
          acaoRecomendada:
            'Contato direto da equipe comercial + desconto especial de reativação',
        });
      }

      // Alerta: Cliente inativo há mais de 90 dias (CRÍTICO)
      else if (diasSemCompra >= 90) {
        const receitaPotencialPerdida =
          dados.quantidadeCompras > 0
            ? (dados.valorTotal / dados.quantidadeCompras) * 2
            : 0;

        alertas.push({
          nomeFantasia: dados.nomeFantasia,
          empresaId: dados.empresaId,
          tipo: 'inativo_90_dias',
          prioridade: 'alta',
          mensagem: `CRÍTICO: Cliente não compra há ${diasSemCompra} dias - Alto risco de perda`,
          diasSemCompra,
          ultimaCompra: dados.ultimaCompra,
          receitaPotencialPerdida,
          acaoRecomendada:
            'Visita presencial da gerência + proposta personalizada com condições especiais',
        });
      }
    }

    // Ordenar por prioridade e dias sem compra
    alertas.sort((a, b) => {
      if (a.prioridade !== b.prioridade) {
        return a.prioridade === 'alta' ? -1 : 1;
      }
      return (b.diasSemCompra || 0) - (a.diasSemCompra || 0);
    });

    this.logger.log(`${alertas.length} alertas gerados`);

    return alertas;
  }

  /**
   * Gera recomendações de ações comerciais
   */
  async gerarRecomendacoes(
    segmentacao: SegmentacaoCliente,
    metricas: MetricasFinanceirasCliente,
    comportamento: ComportamentoCompraCliente,
  ): Promise<RecomendacaoAcao[]> {
    const recomendacoes: RecomendacaoAcao[] = [];

    // Recomendação: Upselling
    if (
      segmentacao.segmento === 'fieis' ||
      segmentacao.segmento === 'campeoes'
    ) {
      const impacto = metricas.ticketMedio * 0.3; // Aumentar ticket em 30%

      recomendacoes.push({
        nomeFantasia: segmentacao.nomeFantasia,
        tipo: 'upselling',
        prioridade: 'alta',
        titulo: 'Oportunidade de Upselling',
        descricao: `Cliente fiel com alto potencial. Ticket médio atual: R$ ${metricas.ticketMedio.toFixed(2)}`,
        impactoEstimado: impacto,
        probabilidadeSucesso: 70,
        acoes: [
          'Oferecer produtos premium das marcas favoritas',
          'Sugerir combos com desconto progressivo',
          'Apresentar lançamentos e novidades',
          `Focar em: ${comportamento.marcasFavoritas.join(', ')}`,
        ],
      });
    }

    // Recomendação: Cross-selling
    if (comportamento.diversidadeMarcas < 5) {
      const impacto = metricas.receitaMediaMensal * 0.4;

      recomendacoes.push({
        nomeFantasia: segmentacao.nomeFantasia,
        tipo: 'cross_selling',
        prioridade: 'media',
        titulo: 'Expandir Portfólio do Cliente',
        descricao: `Cliente compra apenas ${comportamento.diversidadeMarcas} marcas. Oportunidade de diversificação.`,
        impactoEstimado: impacto,
        probabilidadeSucesso: 60,
        acoes: [
          'Apresentar marcas complementares',
          'Demonstração de produtos de outras categorias',
          'Oferecer kits de degustação/teste',
          'Destacar produtos populares que o cliente ainda não compra',
        ],
      });
    }

    // Recomendação: Reativação
    if (
      segmentacao.segmento === 'em_risco' ||
      segmentacao.segmento === 'perdidos'
    ) {
      const impacto = metricas.lifetimeValue * 0.5; // Recuperar 50% do LTV

      recomendacoes.push({
        nomeFantasia: segmentacao.nomeFantasia,
        tipo: 'reativacao',
        prioridade: 'alta',
        titulo: 'Reativar Cliente Valioso',
        descricao: `Cliente com LTV de R$ ${metricas.lifetimeValue.toFixed(2)} está ${segmentacao.recencia} dias sem comprar`,
        impactoEstimado: impacto,
        probabilidadeSucesso: segmentacao.segmento === 'em_risco' ? 50 : 30,
        acoes: [
          'Contato direto via telefone/WhatsApp',
          'Oferta exclusiva de reativação com desconto',
          'Visita comercial para entender motivo da ausência',
          'Proposta personalizada baseada em histórico',
          `Focar em marcas favoritas: ${comportamento.marcasFavoritas.slice(0, 2).join(', ')}`,
        ],
      });
    }

    // Recomendação: Retenção
    if (segmentacao.riscoChurn === 'alto') {
      const impacto = metricas.lifetimeValueProjetado;

      recomendacoes.push({
        nomeFantasia: segmentacao.nomeFantasia,
        tipo: 'retencao',
        prioridade: 'alta',
        titulo: 'Prevenir Perda de Cliente',
        descricao: `Alto risco de churn (${segmentacao.probabilidadeChurn}%). Ação imediata necessária.`,
        impactoEstimado: impacto,
        probabilidadeSucesso: 65,
        acoes: [
          'Reunião urgente com cliente',
          'Investigar satisfação e possíveis problemas',
          'Proposta de parceria de longo prazo',
          'Condições comerciais diferenciadas',
          'Programa de fidelidade exclusivo',
        ],
      });
    }

    // Recomendação: Fidelização
    if (
      segmentacao.segmento === 'promissores' ||
      segmentacao.potencialCrescimento === 'alto'
    ) {
      const impacto = segmentacao.valorPotencial;

      recomendacoes.push({
        nomeFantasia: segmentacao.nomeFantasia,
        tipo: 'fidelizacao',
        prioridade: 'media',
        titulo: 'Aumentar Frequência de Compra',
        descricao: `Cliente com alto potencial. Frequência atual: ${segmentacao.frequencia} compras`,
        impactoEstimado: impacto,
        probabilidadeSucesso: 75,
        acoes: [
          'Programa de pontos/cashback',
          'Desconto progressivo por volume',
          'Contato regular pró-ativo',
          'Newsletter com ofertas personalizadas',
          `Sugerir compra mensal das marcas: ${comportamento.marcasFavoritas.join(', ')}`,
        ],
      });
    }

    // Recomendação: Expansão
    if (comportamento.diversidadeGrupos < 3) {
      const impacto = metricas.receitaMediaMensal * 0.5;

      recomendacoes.push({
        nomeFantasia: segmentacao.nomeFantasia,
        tipo: 'expansao',
        prioridade: 'baixa',
        titulo: 'Expandir para Novas Categorias',
        descricao: `Cliente compra apenas ${comportamento.diversidadeGrupos} categorias de produtos`,
        impactoEstimado: impacto,
        probabilidadeSucesso: 40,
        acoes: [
          'Apresentar catálogo completo',
          'Demonstração de outras linhas de produtos',
          'Casos de sucesso de produtos complementares',
          'Promoção de lançamento para novas categorias',
        ],
      });
    }

    // Ordenar por prioridade e impacto estimado
    recomendacoes.sort((a, b) => {
      const prioridadeMap = { alta: 3, media: 2, baixa: 1 };
      if (a.prioridade !== b.prioridade) {
        return prioridadeMap[b.prioridade] - prioridadeMap[a.prioridade];
      }
      return b.impactoEstimado - a.impactoEstimado;
    });

    return recomendacoes;
  }

  /**
   * Gera alertas de queda de receita
   */
  async gerarAlertasQuedaReceita(
    metricas: MetricasFinanceirasCliente,
  ): Promise<AlertaCliente | null> {
    if (
      metricas.tendenciaReceita === 'decrescente' &&
      metricas.crescimentoPercentual < -20
    ) {
      return {
        nomeFantasia: metricas.nomeFantasia,
        empresaId: metricas.empresaId,
        tipo: 'queda_receita',
        prioridade: 'alta',
        mensagem: `Queda de ${Math.abs(metricas.crescimentoPercentual).toFixed(1)}% na receita`,
        receitaPotencialPerdida: Math.abs(
          metricas.receitaMediaMensal * (metricas.crescimentoPercentual / 100),
        ),
        acaoRecomendada:
          'Investigar causa da queda e propor ação corretiva imediata',
      };
    }

    return null;
  }

  /**
   * Gera alertas de oportunidade de upselling
   */
  async gerarAlertasOportunidadeUpselling(
    comportamento: ComportamentoCompraCliente,
    metricas: MetricasFinanceirasCliente,
  ): Promise<AlertaCliente | null> {
    // Se o cliente tem alta concentração em poucas marcas e compra regularmente
    if (comportamento.concentracaoCompra > 70) {
      return {
        nomeFantasia: comportamento.nomeFantasia,
        empresaId: comportamento.empresaId,
        tipo: 'oportunidade_upselling',
        prioridade: 'media',
        mensagem: `Cliente concentra ${comportamento.concentracaoCompra.toFixed(0)}% das compras em poucas marcas`,
        receitaPotencialPerdida: metricas.ticketMedio * 0.3,
        acaoRecomendada:
          'Oferecer produtos premium ou versões superiores das marcas favoritas',
      };
    }

    return null;
  }

  /**
   * Busca vendas dos clientes
   */
  private async buscarVendasClientes() {
    const anoAtual = new Date().getFullYear();
    return this.prisma.vendaAnalytics.findMany({
      where: {
        ano: anoAtual, // Padrão: apenas o ano atual
      },
      select: {
        nomeFantasia: true,
        empresaId: true,
        ano: true,
        mes: true,
        totalValor: true,
      },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    });
  }

  /**
   * Gera chave única para identificar cliente
   */
  private gerarChaveCliente(nomeFantasia: string, empresaId?: string): string {
    return `${nomeFantasia}|${empresaId || ''}`;
  }
}
