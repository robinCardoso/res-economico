'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Target,
  Users,
  Calendar,
  Download,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import numeral from 'numeral';
import { useClienteAnalyticsRelatorioCliente } from '@/hooks/use-cliente-analytics';

export default function ClientePerfilPage() {
  const params = useParams();
  const nomeFantasia = decodeURIComponent(params?.nomeFantasia as string);
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

  // Buscar relatório do cliente
  const { data: relatorio, isLoading, refetch } = useClienteAnalyticsRelatorioCliente(
    nomeFantasia,
    selectedYears.length > 0 ? { ano: selectedYears } : undefined
  );

  const handleYearToggle = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year].sort((a, b) => b - a)
    );
  };

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Carregando perfil do cliente...</div>
      </div>
    );
  }

  if (!relatorio) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Cliente não encontrado</p>
          <Link href="/admin/clientes/perfil">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Análise Geral
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { metricas, comportamento, segmentacao, alertas, recomendacoes, periodoAnalise } = relatorio;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com Navegação */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/admin/clientes/perfil">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{relatorio.nomeFantasia}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {relatorio.uf && <Badge variant="outline">{relatorio.uf}</Badge>}
            {relatorio.empresaId && <span>ID: {relatorio.empresaId}</span>}
            <span className="text-xs">
              Atualizado em {new Date(relatorio.dataGeracao).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
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
            <label className="text-sm font-medium">Período:</label>
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

      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numeral(metricas?.receitaTotal || 0).format('$0,0.00')}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: {numeral(metricas?.receitaMedia || 0).format('$0,0.00')}/mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numeral(metricas?.ticketMedio || 0).format('$0,0.00')}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricas?.frequenciaCompra || 0} compras/mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numeral(metricas?.lifetimeValue || 0).format('$0,0.00')}
            </div>
            <p className="text-xs text-muted-foreground">
              Projetado: {numeral(metricas?.lifetimeValueProjetado || 0).format('$0,0.00')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            {metricas?.tendenciaReceita === 'crescente' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : metricas?.tendenciaReceita === 'decrescente' ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-gray-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metricas?.crescimentoPercentual || 0) > 0 ? '+' : ''}
              {numeral(metricas?.crescimentoPercentual || 0).format('0.0')}%
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {metricas?.tendenciaReceita || 'indisponível'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Período de Análise */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Primeira Compra</p>
              <p className="text-lg font-semibold">
                {new Date(periodoAnalise.inicio).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Compra</p>
              <p className="text-lg font-semibold">
                {new Date(periodoAnalise.fim).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Meses Ativo</p>
              <p className="text-lg font-semibold">{metricas?.mesesAtivo || 0} meses</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Compras</p>
              <p className="text-lg font-semibold">
                {metricas?.receitaMensal?.reduce((sum, m) => sum + (m.quantidadeCompras || 0), 0) || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="comportamento" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comportamento">Comportamento de Compra</TabsTrigger>
          <TabsTrigger value="segmentacao">Segmentação RFM</TabsTrigger>
          <TabsTrigger value="alertas">
            Alertas & Recomendações
            {alertas && alertas.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alertas.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Comportamento de Compra */}
        <TabsContent value="comportamento" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Marcas Favoritas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Marcas Favoritas</CardTitle>
                <CardDescription>Top 3 marcas mais compradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {comportamento?.marcasFavoritas?.slice(0, 3).map((marca, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{marca}</span>
                      <Badge variant="secondary">#{idx + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Diversidade de Compras */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Diversidade</CardTitle>
                <CardDescription>Variedade de produtos comprados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Marcas Diferentes</p>
                    <p className="text-2xl font-bold">{comportamento?.diversidadeMarcas || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Grupos de Produtos</p>
                    <p className="text-2xl font-bold">{comportamento?.diversidadeGrupos || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concentração em Top 3</p>
                    <p className="text-2xl font-bold">{numeral(comportamento?.concentracaoCompra || 0).format('0.0')}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Marcas Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Marcas Compradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comportamento?.marcasPrincipais?.slice(0, 10).map((marca, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{marca.marca || 'Sem Marca'}</span>
                      <span className="text-muted-foreground">
                        {marca.quantidadeCompras} compras • {numeral(marca.percentualReceita).format('0.0')}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${marca.percentualReceita}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-right min-w-fit">
                        {numeral(marca.valorTotal).format('$0,0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Segmentação RFM */}
        <TabsContent value="segmentacao" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recência (R)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{segmentacao?.recencia || 0}</div>
                <p className="text-xs text-muted-foreground">dias desde última compra</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Frequência (F)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{segmentacao?.frequencia || 0}</div>
                <p className="text-xs text-muted-foreground">número de compras</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monetário (M)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {numeral(segmentacao?.valorMonetario || 0).format('$0,0')}
                </div>
                <p className="text-xs text-muted-foreground">valor total gasto</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Score RFM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{segmentacao?.scoreRFM || 0}</div>
                <p className="text-xs text-muted-foreground">score combinado (max 15)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Segmentação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Segmento</p>
                <Badge className="text-base py-1 px-3">
                  {formatSegmento(segmentacao?.segmento || '')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Descrição</p>
                <p className="text-sm">{segmentacao?.descricaoSegmento}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Potencial de Crescimento</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {segmentacao?.potencialCrescimento}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risco de Churn</p>
                  <Badge
                    variant={
                      segmentacao?.riscoChurn === 'alto'
                        ? 'destructive'
                        : segmentacao?.riscoChurn === 'medio'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="mt-1 capitalize"
                  >
                    {segmentacao?.riscoChurn}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Alertas e Recomendações */}
        <TabsContent value="alertas" className="space-y-4">
          {alertas && alertas.length > 0 ? (
            <>
              {/* Alertas de Alta Prioridade */}
              {alertas.filter(a => a.prioridade === 'alta').length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Alertas de Alta Prioridade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alertas
                      .filter(a => a.prioridade === 'alta')
                      .map((alerta, idx) => (
                        <AlertaCard key={idx} alerta={alerta} />
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Alertas de Média Prioridade */}
              {alertas.filter(a => a.prioridade === 'media').length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Alertas de Média Prioridade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alertas
                      .filter(a => a.prioridade === 'media')
                      .map((alerta, idx) => (
                        <AlertaCard key={idx} alerta={alerta} />
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Alertas de Baixa Prioridade */}
              {alertas.filter(a => a.prioridade === 'baixa').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-gray-600" />
                      Alertas de Baixa Prioridade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alertas
                      .filter(a => a.prioridade === 'baixa')
                      .map((alerta, idx) => (
                        <AlertaCard key={idx} alerta={alerta} />
                      ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum alerta ativo para este cliente
              </CardContent>
            </Card>
          )}

          {/* Recomendações */}
          {recomendacoes && recomendacoes.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base">Recomendações de Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recomendacoes.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{rec.titulo}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{rec.descricao}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {rec.tipo.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div>
                        <p className="text-muted-foreground">Impacto Estimado</p>
                        <p className="font-semibold">{numeral(rec.impactoEstimado).format('$0,0')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Probabilidade de Sucesso</p>
                        <p className="font-semibold">{rec.probabilidadeSucesso}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertaCard({ alerta }: { alerta: any }) {
  return (
    <div className="p-3 bg-white rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-sm">{alerta.mensagem}</h4>
          <p className="text-xs text-muted-foreground mt-1">{formatTipoAlerta(alerta.tipo)}</p>
        </div>
        <Badge
          variant={
            alerta.prioridade === 'alta'
              ? 'destructive'
              : alerta.prioridade === 'media'
                ? 'secondary'
                : 'outline'
          }
          className="capitalize"
        >
          {alerta.prioridade}
        </Badge>
      </div>

      {alerta.diasSemCompra && (
        <p className="text-xs text-muted-foreground">
          <strong>Dias sem compra:</strong> {alerta.diasSemCompra}
        </p>
      )}

      {alerta.receitaPotencialPerdida && (
        <p className="text-xs text-muted-foreground mt-1">
          <strong>Receita em risco:</strong> {numeral(alerta.receitaPotencialPerdida).format('$0,0.00')}
        </p>
      )}

      <div className="mt-2 p-2 bg-muted rounded text-xs">
        <p>
          <strong>Ação recomendada:</strong> {alerta.acaoRecomendada}
        </p>
      </div>
    </div>
  );
}

function formatTipoAlerta(tipo: string): string {
  const map: Record<string, string> = {
    inativo_30_dias: 'Inativos 30+ dias',
    inativo_60_dias: 'Inativos 60+ dias',
    inativo_90_dias: 'Inativos 90+ dias',
    queda_receita: 'Queda de Receita',
    risco_churn: 'Risco de Perda',
    oportunidade_upselling: 'Oportunidade Upsell',
  };
  return map[tipo] || tipo;
}

function formatSegmento(segmento: string): string {
  const map: Record<string, string> = {
    campeoes: 'Campeões',
    fieis: 'Fiéis',
    grandes_gastadores: 'Grandes Gastadores',
    promissores: 'Promissores',
    necessitam_atencao: 'Necessitam Atenção',
    em_risco: 'Em Risco',
    perdidos: 'Perdidos',
    hibernando: 'Hibernando',
  };
  return map[segmento] || segmento;
}
