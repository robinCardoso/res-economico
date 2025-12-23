'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  RefreshCw,
  Download,
  ChevronRight,
  ArrowLeft,
  Zap,
  Shield,
  Activity,
  Info,
} from 'lucide-react';
import numeral from 'numeral';
import { useClienteAnalyticsVisaoGeral, useClienteAnalyticsRelatorios } from '@/hooks/use-cliente-analytics';

// Mapeamento de segmentos com cores e descrições
const SEGMENTO_CONFIG = {
  campeoes: {
    label: 'Campeões',
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-900',
    icon: '👑',
    descricao: 'Clientes VIP - Alta recência, frequência e valor',
    tooltipDetalhado: {
      titulo: 'O que são Campeões?',
      descricaoPrincipal: 'Clientes VIP que possuem ALTO valor monetário, compram FREQUENTEMENTE e tiveram COMPRAS RECENTES. São seus melhores clientes!',
      caracteristicas: [
        { label: 'Valor Monetário (M)', descricao: '✅ ALTO - Gastam muito dinheiro' },
        { label: 'Recência (R)', descricao: '✅ ALTA - Compras recentes (últimas semanas)' },
        { label: 'Frequência (F)', descricao: '✅ ALTA - Compram frequentemente' }
      ],
      exemplo: 'Cliente que gasta R$ 10.000/mês e faz compras semanalmente.',
      risco: '✅ SEM RISCO: São seus clientes mais valiosos. Foco em retenção.',
      acoesPrioritarias: [
        'Programa VIP exclusivo com benefícios especiais',
        'Atendimento dedicado e personalizado',
        'Acesso antecipado a novos produtos',
        'Ofertas customizadas por preferência',
        'Eventos e experiências premium'
      ]
    },
    acoes: [
      'Manter satisfeito com programa VIP',
      'Oferecer benefícios exclusivos',
      'Pedir feedback regularmente',
      'Cross-sell de produtos premium'
    ]
  },
  fieis: {
    label: 'Fiéis',
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-900',
    icon: '💚',
    descricao: 'Clientes frequentes - Alta frequência de compra',
    tooltipDetalhado: {
      titulo: 'O que são Clientes Fiéis?',
      descricaoPrincipal: 'Clientes que compram FREQUENTEMENTE mas com RECÊNCIA baixa/média. Estão engajados mas podem estar desacelerando.',
      caracteristicas: [
        { label: 'Valor Monetário (M)', descricao: '⚠️ MÉDIO - Gastam quantia moderada' },
        { label: 'Recência (R)', descricao: '⚠️ MÉDIA - Últimas compras há 1-3 meses' },
        { label: 'Frequência (F)', descricao: '✅ ALTA - Compram regularmente' }
      ],
      exemplo: 'Cliente que faz compras a cada mês, gastando R$ 2.000 por compra.',
      risco: '⚠️ ATENÇÃO: Podem estar perdendo momentum. Precisam de estímulo.',
      acoesPrioritarias: [
        'Programas de pontos e recompensa',
        'Comunicação regular com dicas/novidades',
        'Descontos exclusivos para membros leais',
        'Referral program com incentivos',
        'Análise de mudanças no padrão de compra'
      ]
    },
    acoes: [
      'Recompensar frequência com pontos',
      'Oferecer previews de novos produtos',
      'Programas de fidelização',
      'Upselling de produtos complementares'
    ]
  },
  grandes_gastadores: {
    label: 'Grandes Gastadores',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-900',
    icon: '💰',
    descricao: 'Alto valor monetário - Gastam muito mas podem ser inativos',
    tooltipDetalhado: {
      titulo: 'O que são Grandes Gastadores?',
      descricaoPrincipal: 'Clientes que possuem ALTO valor monetário total (gastaram muito dinheiro), mas podem estar INATIVOS há bastante tempo.',
      caracteristicas: [
        { label: 'Valor Monetário (M)', descricao: '✅ ALTO - Gastaram muito no total' },
        { label: 'Recência (R)', descricao: '❌ BAIXA - Faz muito tempo desde a última compra (6+ meses)' },
        { label: 'Frequência (F)', descricao: '❌ BAIXA - Poucas compras por ano (2-3 compras)' }
      ],
      exemplo: 'Cliente que gastou R$ 50.000 no passado, mas não faz compras há 6 meses.',
      risco: '⚠️ RISCO: Podem estar em processo de CHURN (saída). Precisam de reativação URGENTE!',
      acoesPrioritarias: [
        'Contato proativo para entender o motivo da inatividade',
        'Oferta exclusiva VIP com desconto atrativo',
        'Demonstração de novos produtos/melhorias',
        'Atendimento personalizado e dedicado',
        'Análise do histórico para identificar problemas'
      ]
    },
    acoes: [
      'Reativar com ofertas personalizadas',
      'Premium customer service',
      'Produtos de maior valor agregado',
      'Atendimento dedicado'
    ]
  },
  promissores: {
    label: 'Promissores',
    color: 'bg-purple-50 border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-900',
    icon: '⭐',
    descricao: 'Novos clientes com potencial - Recentes, baixa frequência',
    tooltipDetalhado: {
      titulo: 'O que são Clientes Promissores?',
      descricaoPrincipal: 'Novos clientes com COMPRAS RECENTES mas BAIXA FREQUÊNCIA. Alto potencial se convertidos em clientes frequentes.',
      caracteristicas: [
        { label: 'Valor Monetário (M)', descricao: '⚠️ BAIXO - Ainda gastaram pouco (clientes novos)' },
        { label: 'Recência (R)', descricao: '✅ ALTA - Compraram recentemente' },
        { label: 'Frequência (F)', descricao: '❌ BAIXA - Pouquíssimas compras (1-2 compras)' }
      ],
      exemplo: 'Cliente novo que fez compra há 2 semanas, gastando R$ 500.',
      risco: '⚠️ RISCO: Podem não retornar. Janela crítica de conversão!',
      acoesPrioritarias: [
        'Programa de boas-vindas agressivo',
        'Email marketing educativo sobre produtos',
        'Desconto especial para segunda compra',
        'Feedback survey para entender expectativas',
        'Onboarding personalizado'
      ]
    },
    acoes: [
      'Incentivos para segunda compra',
      'Educação sobre produtos',
      'Programas de onboarding',
      'Oferta de welcome discount'
    ]
  },
  necessitam_atencao: {
    label: 'Necessitam Atenção',
    color: 'bg-orange-50 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-900',
    icon: '👀',
    descricao: 'Recência em queda - Precisam de atenção antes de desaparecerem',
    tooltipDetalhado: {
      titulo: 'O que são Clientes em Atenção?',
      descricaoPrincipal: 'Clientes com RECÊNCIA DECLINANTE - compravam antes mas estão ficando inativos. Precisam de estímulo IMEDIATO.',
      caracteristicas: [
        { label: 'Valor Monetário (M)', descricao: '⚠️ MÉDIO - Tinham bom valor' },
        { label: 'Recência (R)', descricao: '⚠️ MÉDIA-BAIXA - Últimas compras há 3-6 meses' },
        { label: 'Frequência (F)', descricao: '⚠️ MÉDIA - Compravam com regularidade antes' }
      ],
      exemplo: 'Cliente que costumava comprar mensalmente, mas não compra há 4 meses.',
      risco: '🔴 RISCO MODERADO: Estão em transição para Churn. Ação urgente!',
      acoesPrioritarias: [
        'Campanha de re-engajamento imediata',
        'Pesquisa de satisfação para entender o problema',
        'Promoção especial ou desconto atrativo',
        'Contato direto (email + telefonema)',
        'Análise de mudanças no mercado/competição'
      ]
    },
    acoes: [
      'Campanhas de re-engajamento',
      'Descontos ou promoções',
      'Pesquisa de satisfação',
      'Contato direto (telefonema/email)'
    ]
  },
  em_risco: {
    label: 'Em Risco',
    color: 'bg-red-50 border-red-200',
    badgeColor: 'bg-red-100 text-red-900',
    icon: '⚠️',
    descricao: 'Risco de perda - Compravam muito, mas não compram recentemente',
    tooltipDetalhado: {
      titulo: 'O que são Clientes em Risco?',
      descricaoPrincipal: 'Clientes que JÁ COMPRARAM MUITO mas agora estão COMPLETAMENTE INATIVOS. Alto risco de churn permanente.',
      caracteristicas: [
        { label: 'Valor Monetário (M)', descricao: '✅ ALTO - Foram clientes de alto valor' },
        { label: 'Recência (R)', descricao: '❌ MUITO BAIXA - Última compra há 6-12 meses' },
        { label: 'Frequência (F)', descricao: '❌ BAIXA - Compravam antes mas pararam' }
      ],
      exemplo: 'Cliente que gastou R$ 100.000 no ano passado, mas não compra há 8 meses.',
      risco: '🔴🔴 RISCO CRÍTICO: Estão saindo. Ação win-back agressiva necessária!',
      acoesPrioritarias: [
        'Campanha win-back com oferta irresistível',
        'Contato personalizado de gerente de vendas',
        'Pesquisa direta sobre motivo da inatividade',
        'Oferta de produto exclusivo/novo',
        'Programa de reativação com prazo limite'
      ]
    },
    acoes: [
      'Win-back campaigns com ofertas agressivas',
      'Contato personalizado de vendedor',
      'Produto especial ou exclusivo',
      'Programa de reativação urgente'
    ]
  },
  perdidos: {
    label: 'Perdidos',
    color: 'bg-slate-50 border-slate-200',
    badgeColor: 'bg-slate-100 text-slate-900',
    icon: '😢',
    descricao: 'Inativos há muito tempo - Última compra há muito tempo',
    tooltipDetalhado: {
      titulo: 'O que são Clientes Perdidos?',
      descricaoPrincipal: 'Clientes COMPLETAMENTE INATIVOS há muito tempo. Muito baixa probabilidade de retorno, mas ainda vale tentar reativação.',
      caracteristicas: [
        { label: 'Valor Monetário (M)', descricao: '⚠️ BAIXO - Não é prioridade por valor' },
        { label: 'Recência (R)', descricao: '❌ EXTREMAMENTE BAIXA - Últimas compras há 12+ meses' },
        { label: 'Frequência (F)', descricao: '❌ MUITO BAIXA - Poucas ou nenhuma compra recente' }
      ],
      exemplo: 'Cliente que comprou há 2+ anos e não retornou.',
      risco: '🔴🔴🔴 RISCO MÁXIMO: Praticamente perdidos, mas ainda valem testes.',
      acoesPrioritarias: [
        'Campanha de reativação final com oferta agressiva',
        'Telemarketing direto (baixo custo)',
        'Pesquisa de por que saíram',
        'Oferta especial "Bem-vindo de volta"',
        'Considerar remover lista se não retornarem'
      ]
    },
    acoes: [
      'Campanhas agressivas de reativação',
      'Oferta especial de desconto alto',
      'Telemarketing direto',
      'Pesquisar razão de abandono'
    ]
  },
  hibernando: {
    label: 'Hibernando',
    color: 'bg-cyan-50 border-cyan-200',
    badgeColor: 'bg-cyan-100 text-cyan-900',
    icon: '😴',
    descricao: 'Baixa frequência e recência - Clientes dorminhocos',
    tooltipDetalhado: {
      titulo: 'O que são Clientes Hibernando?',
      descricaoPrincipal: 'Clientes com BAIXA FREQUÊNCIA e BAIXA RECÊNCIA. Estão dormindo mas não perdidos - podem ser despertados.',
      caracteristicas: [
        { label: 'Valor Monetário (M)', descricao: '⚠️ BAIXO - Gastam pouco' },
        { label: 'Recência (R)', descricao: '❌ BAIXA - Última compra há 6+ meses' },
        { label: 'Frequência (F)', descricao: '❌ BAIXA - Poucas compras mesmo no passado' }
      ],
      exemplo: 'Cliente que compra esporadicamente, 2-3 vezes por ano.',
      risco: '⚠️ RISCO BAIXO: Não são prioritários, mas manutenção é barata.',
      acoesPrioritarias: [
        'Email marketing informacional (baixo custo)',
        'Campanhas sazonais alinhadas com comportamento',
        'Ofertas contextualizadas ao histórico',
        'Pesquisa leve sobre interesse',
        'Aguardar sazonalidade natural'
      ]
    },
    acoes: [
      'Campanhas informacionais',
      'Produtos alinhados com histórico',
      'Ofertas sazonais',
      'Pesquisa de razão de baixa atividade'
    ]
  }
};

export default function SegmentacaoPage() {
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [expandedSegments, setExpandedSegments] = useState<string[]>([]);
  const [showCustomerList, setShowCustomerList] = useState<string | null>(null);

  // Buscar dados
  const { data: visaoGeral, isLoading: loadingVisao, refetch: refetchVisao } = useClienteAnalyticsVisaoGeral(
    selectedYears.length > 0 ? { ano: selectedYears } : undefined
  );

  const { data: relatorios, isLoading: loadingRelatorios } = useClienteAnalyticsRelatorios(
    selectedYears.length > 0 ? { ano: selectedYears } : undefined
  );

  const isLoading = loadingVisao || loadingRelatorios;

  const handleYearToggle = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year].sort((a, b) => b - a)
    );
  };

  const toggleSegmentExpand = (segmento: string) => {
    setExpandedSegments(prev =>
      prev.includes(segmento)
        ? prev.filter(s => s !== segmento)
        : [...prev, segmento]
    );
  };

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Calcular estatísticas por segmento
  const segmentStats = useMemo(() => {
    if (!visaoGeral?.distribuicaoSegmentos) return {};

    return visaoGeral.distribuicaoSegmentos.reduce((acc, seg) => {
      acc[seg.segmento] = {
        quantidade: seg.quantidade,
        percentual: seg.percentual,
        receitaTotal: seg.receitaTotal,
        receitaMedia: seg.quantidade > 0 ? seg.receitaTotal / seg.quantidade : 0
      };
      return acc;
    }, {} as Record<string, any>);
  }, [visaoGeral?.distribuicaoSegmentos]);

  // Clientes por segmento
  const clientesPorSegmento = useMemo(() => {
    if (!relatorios) return {};

    return relatorios.reduce((acc, cliente) => {
      const segmento = cliente.segmentacao.segmento;
      if (!acc[segmento]) {
        acc[segmento] = [];
      }
      acc[segmento].push(cliente);
      return acc;
    }, {} as Record<string, typeof relatorios>);
  }, [relatorios]);

  // Ordenar segmentos por importância
  const segmentosOrdenados = [
    'campeoes',
    'fieis',
    'grandes_gastadores',
    'promissores',
    'necessitam_atencao',
    'em_risco',
    'perdidos',
    'hibernando'
  ];

  const handleRefresh = () => {
    refetchVisao();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Carregando dados de segmentação...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/clientes/perfil">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Segmentação RFM</h1>
          </div>
          <p className="text-muted-foreground">
            Análise de distribuição de clientes por segmento RFM (Recência, Frequência, Monetário)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtro de Anos */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filtrar por ano:</label>
            <div className="flex gap-2 flex-wrap">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => handleYearToggle(year)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedYears.includes(year)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numeral(visaoGeral?.totalClientes || 0).format('0,0')}</div>
            <p className="text-xs text-muted-foreground">
              {numeral(visaoGeral?.clientesAtivos || 0).format('0,0')} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numeral(visaoGeral?.receitaTotal || 0).format('$0,0.00')}
            </div>
            <p className="text-xs text-muted-foreground">
              {numeral(visaoGeral?.receitaMediaPorCliente || 0).format('$0,0.00')}/cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmento Dominante</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visaoGeral?.distribuicaoSegmentos && visaoGeral.distribuicaoSegmentos.length > 0
                ? SEGMENTO_CONFIG[visaoGeral.distribuicaoSegmentos[0].segmento as keyof typeof SEGMENTO_CONFIG]?.label || 'N/A'
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {visaoGeral?.distribuicaoSegmentos && visaoGeral.distribuicaoSegmentos.length > 0
                ? `${numeral(visaoGeral.distribuicaoSegmentos[0].percentual || 0).format('0.0')}% dos clientes`
                : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidade</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numeral(visaoGeral?.receitaPotencial || 0).format('$0,0.00')}
            </div>
            <p className="text-xs text-muted-foreground">
              {numeral(visaoGeral?.clientesComOportunidade || 0).format('0,0')} clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matriz" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matriz">Matriz de Segmentos</TabsTrigger>
          <TabsTrigger value="cards">Detalhes por Segmento</TabsTrigger>
        </TabsList>

        {/* Tab 1: Matriz */}
        <TabsContent value="matriz" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Clientes por Segmento</CardTitle>
              <CardDescription>
                Visualização da distribuição de receita e quantidade de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segmentosOrdenados.map(segmento => {
                  const stats = segmentStats[segmento];
                  if (!stats) return null;

                  const config = SEGMENTO_CONFIG[segmento as keyof typeof SEGMENTO_CONFIG];

                  const tooltipContent = (config as any).tooltipDetalhado ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 mb-1">
                          {(config as any).tooltipDetalhado.titulo}
                        </h4>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed">
                          {(config as any).tooltipDetalhado.descricaoPrincipal}
                        </p>
                      </div>

                      <div>
                        <h5 className="text-xs font-semibold text-gray-800 mb-1">RFM:</h5>
                        <div className="space-y-1">
                          {(config as any).tooltipDetalhado.caracteristicas?.map((char: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <p className="font-medium text-gray-800">{char.label}</p>
                              <p className="text-gray-600 text-xs">{char.descricao}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-2">
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Ex:</span> {(config as any).tooltipDetalhado.exemplo}
                        </p>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-xs font-medium text-red-900">
                          {(config as any).tooltipDetalhado.risco}
                        </p>
                      </div>

                      <div>
                        <h5 className="text-xs font-semibold text-gray-800 mb-1">Ações:</h5>
                        <ul className="space-y-0.5">
                          {(config as any).tooltipDetalhado.acoesPrioritarias?.slice(0, 3).map((acao: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                              <span className="text-green-600 font-bold flex-shrink-0">→</span>
                              <span>{acao}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null;

                  return (
                    <div key={segmento} className="space-y-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                          <div className={`p-4 rounded-lg border ${config.color} cursor-help transition-shadow hover:shadow-md`}>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{config.icon}</span>
                                  <h3 className="font-semibold">{config.label}</h3>
                                  <Badge className={config.badgeColor}>
                                    {numeral(stats.quantidade).format('0,0')} clientes
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{config.descricao}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSegmentExpand(segmento)}
                              >
                                <ChevronRight
                                  className={`h-4 w-4 transition-transform ${
                                    expandedSegments.includes(segmento) ? 'rotate-90' : ''
                                  }`}
                                />
                              </Button>
                            </div>

                            {/* Estatísticas em barras */}
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Percentual</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${stats.percentual}%` }}
                                  />
                                </div>
                                <p className="text-sm font-semibold mt-1">
                                  {numeral(stats.percentual).format('0.0')}%
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">Receita Total</p>
                                <div className="text-sm font-semibold mt-2">
                                  {numeral(stats.receitaTotal).format('$0,0.00')}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {numeral(
                                    (stats.receitaTotal / (visaoGeral?.receitaTotal || 1)) * 100
                                  ).format('0.0')}% do total
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">Receita Média</p>
                                <div className="text-sm font-semibold mt-2">
                                  {numeral(stats.receitaMedia).format('$0,0.00')}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">por cliente</p>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>

                        {tooltipContent && (
                          <TooltipContent side="right" className="w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                            {tooltipContent}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                    {/* Expandível: Ações e clientes */}
                    {expandedSegments.includes(segmento) && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Ações Recomendadas:</h4>
                            <ul className="text-xs space-y-1">
                              {config.acoes.map((acao, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-600 mt-0.5">✓</span>
                                  <span>{acao}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Clientes deste segmento */}
                          {clientesPorSegmento[segmento] && clientesPorSegmento[segmento].length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold">
                                  Top Clientes ({clientesPorSegmento[segmento].length})
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setShowCustomerList(
                                      showCustomerList === segmento ? null : segmento
                                    )
                                  }
                                >
                                  {showCustomerList === segmento ? 'Ocultar' : 'Ver'}
                                </Button>
                              </div>

                              {showCustomerList === segmento && (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {clientesPorSegmento[segmento].slice(0, 10).map((cliente) => (
                                    <div key={cliente.nomeFantasia} className="flex items-center justify-between text-xs p-2 bg-white/50 rounded">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{cliente.nomeFantasia}</p>
                                        <p className="text-muted-foreground">
                                          Receita: {numeral(cliente.metricas.receitaTotal).format('$0,0.00')}
                                        </p>
                                      </div>
                                      <Link href={`/admin/clientes/${encodeURIComponent(cliente.nomeFantasia)}`}>
                                        <Button variant="ghost" size="sm">
                                          <ChevronRight className="h-3 w-3" />
                                        </Button>
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Cards Detalhados */}
        <TabsContent value="cards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {segmentosOrdenados.map(segmento => {
              const stats = segmentStats[segmento];
              if (!stats) return null;

              const config = SEGMENTO_CONFIG[segmento as keyof typeof SEGMENTO_CONFIG];

              return (
                <Card key={segmento} className={`overflow-hidden ${config.color}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{config.icon}</span>
                          <CardTitle className="text-lg">{config.label}</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                          {config.descricao}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {numeral(stats.percentual).format('0.0')}%
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Métricas principais */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantidade:</span>
                        <span className="font-semibold">
                          {numeral(stats.quantidade).format('0,0')} clientes
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Receita Total:</span>
                        <span className="font-semibold">
                          {numeral(stats.receitaTotal).format('$0,0.00')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Receita Média:</span>
                        <span className="font-semibold">
                          {numeral(stats.receitaMedia).format('$0,0.00')}
                        </span>
                      </div>
                    </div>

                    {/* Progresso de receita */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">% da Receita Total</span>
                        <span className="font-semibold">
                          {numeral(
                            (stats.receitaTotal / (visaoGeral?.receitaTotal || 1)) * 100
                          ).format('0.0')}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (stats.receitaTotal / (visaoGeral?.receitaTotal || 1)) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Ações recomendadas */}
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Ações Recomendadas:
                      </p>
                      <ul className="text-xs space-y-1">
                        {config.acoes.slice(0, 3).map((acao, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            <span>{acao}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botão de ver clientes */}
                    {clientesPorSegmento[segmento]?.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() =>
                          setShowCustomerList(showCustomerList === segmento ? null : segmento)
                        }
                      >
                        Ver {clientesPorSegmento[segmento].length} clientes
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </CardContent>

                  {/* Dropdown de clientes */}
                  {showCustomerList === segmento && clientesPorSegmento[segmento] && (
                    <div className="px-6 pb-4 border-t">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {clientesPorSegmento[segmento].slice(0, 5).map((cliente, idx) => (
                          <Link
                            key={idx}
                            href={`/admin/clientes/${encodeURIComponent(cliente.nomeFantasia)}`}
                            className="block p-2 bg-white/50 hover:bg-white/80 rounded text-xs transition-colors"
                          >
                            <p className="font-medium truncate">{cliente.nomeFantasia}</p>
                            <p className="text-muted-foreground">
                              {numeral(cliente.metricas.receitaTotal).format('$0,0.00')} • {cliente.segmentacao.frequencia} compras
                            </p>
                          </Link>
                        ))}
                        {clientesPorSegmento[segmento].length > 5 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            +{clientesPorSegmento[segmento].length - 5} clientes
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
