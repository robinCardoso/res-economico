'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  DollarSign,
  Target,
  Download,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { useClienteAnalyticsVisaoGeral, useClienteAnalyticsAlertas, useClienteAnalyticsRelatorios } from '@/hooks/use-cliente-analytics';
import numeral from 'numeral';
import { 
  ReceitaMensalChart,
  TopMarcasChart,
  SegmentosChart,
  LTVChart,
  SazonalidadeChart
} from '@/components/analytics/cliente-charts';

// Configuração de segmentos
const SEGMENTOS_CONFIG = {
  campeoes: { label: 'Campeões', color: 'bg-yellow-100 text-yellow-900' },
  fieis: { label: 'Fiéis', color: 'bg-blue-100 text-blue-900' },
  grandes_gastadores: { label: 'Grandes Gastadores', color: 'bg-green-100 text-green-900' },
  promissores: { label: 'Promissores', color: 'bg-purple-100 text-purple-900' },
  necessitam_atencao: { label: 'Necessitam Atenção', color: 'bg-orange-100 text-orange-900' },
  em_risco: { label: 'Em Risco', color: 'bg-red-100 text-red-900' },
  perdidos: { label: 'Perdidos', color: 'bg-slate-100 text-slate-900' },
  hibernando: { label: 'Hibernando', color: 'bg-cyan-100 text-cyan-900' },
};

interface FiltrosAvancados {
  anos: number[];
  segmentos: string[];
  ufs: string[];
  receitaMin: number;
  receitaMax: number;
  busca: string;
}

export default function PerfilClientePage() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [filtros, setFiltros] = useState<FiltrosAvancados>({
    anos: [new Date().getFullYear()],
    segmentos: [],
    ufs: [],
    receitaMin: 0,
    receitaMax: 0,
    busca: '',
  });
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const clienteParam = searchParams?.get('cliente');

  // Carregar filtros da URL
  useEffect(() => {
    if (searchParams) {
      const anos = searchParams.get('anos')?.split(',').map(Number) || [new Date().getFullYear()];
      const segmentos = searchParams.get('segmentos')?.split(',') || [];
      const ufs = searchParams.get('ufs')?.split(',') || [];
      const receitaMin = Number(searchParams.get('receitaMin') || '0');
      const receitaMax = Number(searchParams.get('receitaMax') || '0');
      const busca = searchParams.get('busca') || '';

      setFiltros({ anos, segmentos, ufs, receitaMin, receitaMax, busca });
      setSelectedYears(anos);
    }
  }, [searchParams]);

  // Se vier com parâmetro de cliente, ir direto para a tab de visao geral
  useEffect(() => {
    if (clienteParam) {
      setActiveTab('visao-geral');
    }
  }, [clienteParam]);

  // Atualizar URL com filtros
  const updateUrl = (newFiltros: FiltrosAvancados) => {
    const params = new URLSearchParams();
    if (newFiltros.anos.length > 0) params.set('anos', newFiltros.anos.join(','));
    if (newFiltros.segmentos.length > 0) params.set('segmentos', newFiltros.segmentos.join(','));
    if (newFiltros.ufs.length > 0) params.set('ufs', newFiltros.ufs.join(','));
    if (newFiltros.receitaMin > 0) params.set('receitaMin', newFiltros.receitaMin.toString());
    if (newFiltros.receitaMax > 0) params.set('receitaMax', newFiltros.receitaMax.toString());
    if (newFiltros.busca) params.set('busca', newFiltros.busca);

    const queryString = params.toString();
    router.push(queryString ? `/admin/clientes/perfil?${queryString}` : '/admin/clientes/perfil');
  };

  // Buscar dados
  const { data: visaoGeral, isLoading: loadingVisao, refetch: refetchVisao } = useClienteAnalyticsVisaoGeral(
    filtros.anos.length > 0 ? { ano: filtros.anos, segmento: filtros.segmentos, uf: filtros.ufs } : undefined
  );
  const { data: alertas, isLoading: loadingAlertas, refetch: refetchAlertas } = useClienteAnalyticsAlertas(
    filtros.anos.length > 0 ? { ano: filtros.anos, segmento: filtros.segmentos, uf: filtros.ufs } : undefined
  );
  const { data: relatorios, isLoading: loadingRelatorios } = useClienteAnalyticsRelatorios(
    filtros.anos.length > 0 ? { ano: filtros.anos, segmento: filtros.segmentos, uf: filtros.ufs } : undefined
  );

  const isLoading = loadingVisao || loadingAlertas || loadingRelatorios;

  // Obter UFs únicas disponíveis
  const ufsDisponiveis = useMemo(() => {
    if (!relatorios) return [];
    const ufs = new Set<string>();
    relatorios.forEach(r => {
      if (r.uf) ufs.add(r.uf);
    });
    return Array.from(ufs).sort();
  }, [relatorios]);

  // Aplicar filtros de receita e busca aos relatórios
  const clientesFiltrados = useMemo(() => {
    if (!relatorios) return [];
    return relatorios.filter(cliente => {
      const passaReceita = (
        (filtros.receitaMin === 0 || cliente.metricas?.receitaTotal >= filtros.receitaMin) &&
        (filtros.receitaMax === 0 || cliente.metricas?.receitaTotal <= filtros.receitaMax)
      );
      const passaBusca = (
        filtros.busca === '' ||
        cliente.nomeFantasia?.toLowerCase().includes(filtros.busca.toLowerCase())
      );
      return passaReceita && passaBusca;
    });
  }, [relatorios, filtros.receitaMin, filtros.receitaMax, filtros.busca]);

  // Funções para gerenciar filtros
  const handleYearToggle = (year: number) => {
    const newAnos = filtros.anos.includes(year)
      ? filtros.anos.filter(y => y !== year)
      : [...filtros.anos, year].sort((a, b) => b - a);
    const newFiltros = { ...filtros, anos: newAnos };
    setFiltros(newFiltros);
    updateUrl(newFiltros);
  };

  const handleSegmentoToggle = (segmento: string) => {
    const newSegmentos = filtros.segmentos.includes(segmento)
      ? filtros.segmentos.filter(s => s !== segmento)
      : [...filtros.segmentos, segmento];
    const newFiltros = { ...filtros, segmentos: newSegmentos };
    setFiltros(newFiltros);
    updateUrl(newFiltros);
  };

  const handleUFToggle = (uf: string) => {
    const newUfs = filtros.ufs.includes(uf)
      ? filtros.ufs.filter(u => u !== uf)
      : [...filtros.ufs, uf];
    const newFiltros = { ...filtros, ufs: newUfs };
    setFiltros(newFiltros);
    updateUrl(newFiltros);
  };

  const handleBuscaChange = (busca: string) => {
    const newFiltros = { ...filtros, busca };
    setFiltros(newFiltros);
    updateUrl(newFiltros);
  };

  const handleReceitaMinChange = (min: number) => {
    const newFiltros = { ...filtros, receitaMin: min };
    setFiltros(newFiltros);
    updateUrl(newFiltros);
  };

  const handleReceitaMaxChange = (max: number) => {
    const newFiltros = { ...filtros, receitaMax: max };
    setFiltros(newFiltros);
    updateUrl(newFiltros);
  };

  const handleLimparFiltros = () => {
    const newFiltros: FiltrosAvancados = {
      anos: [new Date().getFullYear()],
      segmentos: [],
      ufs: [],
      receitaMin: 0,
      receitaMax: 0,
      busca: '',
    };
    setFiltros(newFiltros);
    updateUrl(newFiltros);
    setShowFilters(false);
  };

  const temFiltrosAtivos = filtros.segmentos.length > 0 || 
                           filtros.ufs.length > 0 || 
                           filtros.receitaMin > 0 || 
                           filtros.receitaMax > 0 || 
                           filtros.busca !== '';

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleRefresh = () => {
    refetchVisao();
    refetchAlertas();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análise de Perfil de Cliente</h1>
          <p className="text-muted-foreground mt-1">
            Insights acionáveis para aumentar a receita por cliente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <label className="text-sm font-medium whitespace-nowrap">Filtrar por ano:</label>
              <div className="flex gap-2 flex-wrap">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearToggle(year)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filtros.anos.includes(year)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              {temFiltrosAtivos && <Badge variant="destructive">1</Badge>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Avançados */}
      {showFilters && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros Avançados
                </CardTitle>
                <CardDescription>Refine sua análise de clientes</CardDescription>
              </div>
              {temFiltrosAtivos && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLimparFiltros}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Busca por Nome */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Buscar por Nome do Cliente:</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Digite o nome do cliente..."
                  value={filtros.busca}
                  onChange={e => handleBuscaChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Segmentos */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Segmentos:</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SEGMENTOS_CONFIG).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={filtros.segmentos.includes(key) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSegmentoToggle(key)}
                    className="text-xs"
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Estados (UF) */}
            {ufsDisponiveis.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Estados (UF):</label>
                <div className="flex flex-wrap gap-2">
                  {ufsDisponiveis.map(uf => (
                    <Button
                      key={uf}
                      variant={filtros.ufs.includes(uf) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUFToggle(uf)}
                      className="text-xs"
                    >
                      {uf}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Faixa de Receita */}
            <div>
              <label className="text-sm font-semibold mb-4 block">Faixa de Receita:</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Receita Mínima:</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filtros.receitaMin}
                    onChange={e => handleReceitaMinChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                  {filtros.receitaMin > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {numeral(filtros.receitaMin).format('$0,0.00')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Receita Máxima:</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filtros.receitaMax}
                    onChange={e => handleReceitaMaxChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                  {filtros.receitaMax > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {numeral(filtros.receitaMax).format('$0,0.00')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Filtros Ativos */}
            {temFiltrosAtivos && (
              <div className="p-3 bg-white rounded border border-blue-200">
                <p className="text-xs font-semibold mb-2">Filtros Ativos:</p>
                <div className="flex flex-wrap gap-2">
                  {filtros.segmentos.map(seg => (
                    <Badge key={seg} variant="secondary" className="cursor-pointer" onClick={() => handleSegmentoToggle(seg)}>
                      {SEGMENTOS_CONFIG[seg as keyof typeof SEGMENTOS_CONFIG]?.label}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                  {filtros.ufs.map(uf => (
                    <Badge key={uf} variant="secondary" className="cursor-pointer" onClick={() => handleUFToggle(uf)}>
                      {uf}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                  {filtros.busca && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleBuscaChange('')}>
                      {filtros.busca}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {filtros.receitaMin > 0 && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleReceitaMinChange(0)}>
                      Mín: {numeral(filtros.receitaMin).format('$0,0')}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {filtros.receitaMax > 0 && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleReceitaMaxChange(0)}>
                      Máx: {numeral(filtros.receitaMax).format('$0,0')}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="alertas">
            Alertas
            {alertas && alertas.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alertas.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">Carregando dados...</div>
          ) : visaoGeral ? (
            <>
              {/* Cards de Métricas Principais */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{numeral(visaoGeral.totalClientes || 0).format('0,0')}</div>
                    <p className="text-xs text-muted-foreground">
                      {numeral(visaoGeral.clientesAtivos || 0).format('0,0')} ativos •{' '}
                      {numeral(visaoGeral.clientesInativos || 0).format('0,0')} inativos
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
                      {numeral(visaoGeral.receitaTotal || 0).format('$0,0.00')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Média: {numeral(visaoGeral.receitaMediaPorCliente || 0).format('$0,0.00')}/cliente
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">LTV Médio</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {numeral(visaoGeral.lifetimeValueMedio || 0).format('$0,0.00')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {numeral(visaoGeral.lifetimeValueTotal || 0).format('$0,0.00')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tendência</CardTitle>
                    {visaoGeral.tendenciaGeral === 'crescente' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : visaoGeral.tendenciaGeral === 'decrescente' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(visaoGeral.crescimentoReceita || 0) > 0 ? '+' : ''}
                      {numeral(visaoGeral.crescimentoReceita || 0).format('0.0')}%
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {visaoGeral.tendenciaGeral || 'indisponível'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos Interativos */}
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {/* Gráfico de Receita Mensal */}
                <ReceitaMensalChart 
                  data={visaoGeral.receitaMensalAgregada?.map(item => ({
                    mes: `${item.mesDescricao}/${item.ano}`,
                    ano: item.ano,
                    receita: item.receita
                  })) || []}
                  isLoading={isLoading}
                />
                
                {/* Gráfico de Top Marcas */}
                <TopMarcasChart 
                  data={visaoGeral.marcasMaisCompradas || []}
                  isLoading={isLoading}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {/* Gráfico de Segmentos */}
                <SegmentosChart 
                  data={visaoGeral.distribuicaoSegmentos?.map(seg => ({
                    segmento: seg.segmento,
                    quantidade: seg.quantidade,
                    receita: seg.receitaTotal
                  })) || []}
                  isLoading={isLoading}
                />
                
                {/* Gráfico de LTV */}
                <LTVChart 
                  data={visaoGeral.lifetimeValueMedio ? [
                    {
                      periodo: 'Atual',
                      ltvAtual: visaoGeral.lifetimeValueMedio,
                      ltvProjetado: visaoGeral.lifetimeValueMedio * 1.2 // Simulação
                    }
                  ] : []}
                  isLoading={isLoading}
                />
              </div>

              {/* Heatmap de Sazonalidade */}
              <SazonalidadeChart 
                data={visaoGeral.sazonalidadeAgregada?.map(item => ({
                  mes: item.mesDescricao,
                  valor: item.receita
                })) || []}
                isLoading={isLoading}
              />

              {/* Alertas Resumidos */}
              {(visaoGeral.totalAlertas || 0) > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <CardTitle>Alertas Ativos</CardTitle>
                    </div>
                    <CardDescription>
                      {visaoGeral.totalAlertas || 0} alerta(s) requer(em) atenção
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-3">
                      {visaoGeral.alertasPorTipo?.slice(0, 3).map((item) => (
                        <div key={item.tipo} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm font-medium">{formatTipoAlerta(item.tipo)}</span>
                          <Badge variant="secondary">{item.quantidade}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Clientes por Receita</CardTitle>
                  <CardDescription>Clientes com maior contribuição de receita</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visaoGeral.topClientes?.map((cliente, index) => (
                      <Link
                        key={index}
                        href={`/admin/clientes/${encodeURIComponent(cliente.nomeFantasia)}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium hover:underline">{cliente.nomeFantasia}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {formatSegmento(cliente.segmento)}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-lg font-bold">
                            {numeral(cliente.receita).format('$0,0.00')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Segmento */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Segmento</CardTitle>
                  <CardDescription>Segmentação RFM dos clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visaoGeral.distribuicaoSegmentos?.map((item) => (
                      <div key={item.segmento} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{formatSegmento(item.segmento)}</span>
                          <span className="text-muted-foreground">
                            {item.quantidade} clientes ({numeral(item.percentual).format('0.0')}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${item.percentual}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {numeral(item.receitaTotal).format('$0,0')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">Nenhum dado disponível</div>
          )}
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alertas">
          <AlertasTab alertas={alertas} isLoading={loadingAlertas} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function AlertasTab({ alertas, isLoading }: { alertas: any[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-12">Carregando alertas...</div>;
  }

  if (!alertas || alertas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nenhum alerta ativo</p>
        </CardContent>
      </Card>
    );
  }

  const alertasPorPrioridade = {
    alta: alertas.filter((a) => a.prioridade === 'alta'),
    media: alertas.filter((a) => a.prioridade === 'media'),
    baixa: alertas.filter((a) => a.prioridade === 'baixa'),
  };

  return (
    <div className="space-y-4">
      {/* Alertas de Alta Prioridade */}
      {alertasPorPrioridade.alta.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Prioridade Alta ({alertasPorPrioridade.alta.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasPorPrioridade.alta.map((alerta, index) => (
              <AlertaCard key={index} alerta={alerta} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alertas de Média Prioridade */}
      {alertasPorPrioridade.media.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Prioridade Média ({alertasPorPrioridade.media.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasPorPrioridade.media.map((alerta, index) => (
              <AlertaCard key={index} alerta={alerta} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alertas de Baixa Prioridade */}
      {alertasPorPrioridade.baixa.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
              Prioridade Baixa ({alertasPorPrioridade.baixa.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasPorPrioridade.baixa.map((alerta, index) => (
              <AlertaCard key={index} alerta={alerta} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AlertaCard({ alerta }: { alerta: any }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold">{alerta.nomeFantasia}</h4>
          <p className="text-sm text-muted-foreground">{alerta.mensagem}</p>
        </div>
        <Badge
          variant={
            alerta.prioridade === 'alta'
              ? 'destructive'
              : alerta.prioridade === 'media'
                ? 'default'
                : 'secondary'
          }
        >
          {alerta.tipo.replace(/_/g, ' ')}
        </Badge>
      </div>

      {alerta.diasSemCompra && (
        <p className="text-sm mb-2">
          <strong>Dias sem compra:</strong> {alerta.diasSemCompra}
        </p>
      )}

      {alerta.receitaPotencialPerdida && (
        <p className="text-sm mb-2">
          <strong>Receita potencial em risco:</strong>{' '}
          {numeral(alerta.receitaPotencialPerdida).format('$0,0.00')}
        </p>
      )}

      <div className="mt-3 p-3 bg-muted rounded">
        <p className="text-sm">
          <strong>Ação Recomendada:</strong> {alerta.acaoRecomendada}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

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
