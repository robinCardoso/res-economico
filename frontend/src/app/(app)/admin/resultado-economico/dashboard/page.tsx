'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { uploadsService } from '@/services/uploads.service';
import { relatoriosService } from '@/services/relatorios.service';
import { useResponsiveChart } from '@/hooks/use-responsive-chart';
import { useEmpresas } from '@/hooks/use-empresas';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Area,
  AreaChart,
  Cell,
} from 'recharts';
import numeral from 'numeral';

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const DashboardPage = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [anoFiltro, setAnoFiltro] = useState<number | undefined>(currentYear);
  const [mesFiltro, setMesFiltro] = useState<number | undefined>(undefined);
  const [empresaFiltro, setEmpresaFiltro] = useState<string | undefined>(undefined);
  
  // Hook para configurações responsivas dos gráficos
  const chartConfig = useResponsiveChart();
  
  // Buscar empresas para o filtro
  const { data: empresas } = useEmpresas();

  const { data, isLoading, error } = useQuery({
    queryKey: ['conta745', anoFiltro, mesFiltro, empresaFiltro],
    queryFn: () => uploadsService.getConta745(anoFiltro, mesFiltro, empresaFiltro),
  });

  // Buscar anos disponíveis do banco de dados
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [carregandoAnos, setCarregandoAnos] = useState<boolean>(true);

  useEffect(() => {
    const buscarAnos = async () => {
      try {
        const anos = await relatoriosService.getAnosDisponiveis();
        setAnosDisponiveis(anos);
        // Se não houver ano selecionado e houver anos disponíveis, usar o mais recente
        if (!anoFiltro && anos.length > 0) {
          setAnoFiltro(anos[0]);
        }
      } catch (error) {
        console.error('Erro ao buscar anos disponíveis:', error);
        // Fallback: usar últimos 5 anos se a busca falhar
        setAnosDisponiveis(Array.from({ length: 5 }, (_, i) => currentYear - i));
      } finally {
        setCarregandoAnos(false);
      }
    };
    buscarAnos();
  }, []);

  const formatarValor = (valor: number) => {
    // Formatar valores grandes com separador de milhar
    if (Math.abs(valor) >= 1000) {
      return numeral(valor).format('0,0');
    }
    return numeral(valor).format('0,0.00');
  };

  // Dados já vêm filtrados do backend se empresaFiltro estiver ativo
  const dadosPorEmpresaFiltrados = data?.porEmpresa || [];

  // Preparar dados para gráfico consolidado
  // Se empresa filtrada, usar apenas dados dessa empresa, senão usar consolidado
  const dadosConsolidadoRaw = empresaFiltro 
    ? dadosPorEmpresaFiltrados.reduce((acc, item) => {
        const existing = acc.find(d => d.periodo === item.periodo);
        if (existing) {
          existing.valor += item.valor;
        } else {
          acc.push({ periodo: item.periodo, valor: item.valor });
        }
        return acc;
      }, [] as Array<{ periodo: string; valor: number }>)
    : (data?.consolidado || []);

  // Ordenar dados consolidados por período (sempre mês a mês quando possível)
  const dadosConsolidado = [...dadosConsolidadoRaw].sort((a, b) => {
    // Se ambos têm "/", são períodos mensais (MM/YYYY)
    if (a.periodo.includes('/') && b.periodo.includes('/')) {
      const [mesA, anoA] = a.periodo.split('/').map(Number);
      const [mesB, anoB] = b.periodo.split('/').map(Number);
      if (anoA !== anoB) return anoA - anoB;
      return mesA - mesB;
    }
    // Se não, comparar como números (anos)
    return Number(a.periodo) - Number(b.periodo);
  });

  // Calcular acumulado do ano (soma de todos os valores do consolidado)
  const acumuladoAno = dadosConsolidado.reduce((sum, item) => sum + item.valor, 0);

  // Preparar dados para gráfico por empresa
  // Agrupar por empresa e período
  const dadosPorEmpresaMap = new Map<string, Array<{ periodo: string; valor: number }>>();
  
  dadosPorEmpresaFiltrados.forEach((item) => {
    if (!dadosPorEmpresaMap.has(item.empresaNome)) {
      dadosPorEmpresaMap.set(item.empresaNome, []);
    }
    const empresaData = dadosPorEmpresaMap.get(item.empresaNome)!;
    empresaData.push({ periodo: item.periodo, valor: item.valor });
  });

  // Converter para array de séries
  const empresasUnicas = Array.from(dadosPorEmpresaMap.keys());
  const periodosUnicos = Array.from(
    new Set(dadosPorEmpresaFiltrados.map((item) => item.periodo) || [])
  ).sort((a, b) => {
    // Se o período contém "/", é formato MM/YYYY (mensal)
    // Se não, é apenas o ano (acumulado)
    if (a.includes('/') && b.includes('/')) {
      const [mesA, anoA] = a.split('/').map(Number);
      const [mesB, anoB] = b.split('/').map(Number);
      if (anoA !== anoB) return anoA - anoB; // Ano crescente
      return mesA - mesB; // Mês crescente (Janeiro primeiro)
    } else {
      // Comparação numérica simples para anos
      return Number(a) - Number(b);
    }
  });

  // Verificar se estamos mostrando dados mensais ou acumulados
  const isAcumulado = periodosUnicos.length === 1 && !periodosUnicos[0].includes('/');

  // Criar dados para gráfico de barras
  // Se for acumulado, mostrar uma barra por empresa
  // Se for mensal, mostrar barras agrupadas por período
  const dadosPorEmpresa = isAcumulado
    ? empresasUnicas.map((empresa) => {
        const empresaData = dadosPorEmpresaMap.get(empresa) || [];
        const valor = empresaData[0]?.valor || 0;
        return {
          empresa,
          valor,
        };
      })
    : periodosUnicos.map((periodo) => {
        const item: Record<string, string | number> = { periodo };
        empresasUnicas.forEach((empresa) => {
          const empresaData = dadosPorEmpresaMap.get(empresa) || [];
          const valor = empresaData.find((d) => d.periodo === periodo)?.valor || 0;
          item[empresa] = valor;
        });
        return item;
      });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar dados. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-foreground">
          Resultado do Exercício - Período do Balanço (Conta 745)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Análise consolidada e por empresa da conta 745 - Resultado do Exercício-Período do Balanço
        </p>
      </section>

      {/* Filtros */}
      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 rounded-xl border border-border bg-card p-5 shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <label htmlFor="ano" className="text-sm font-medium text-foreground">
            Ano:
          </label>
          <select
            id="ano"
            value={anoFiltro || ''}
            onChange={(e) => setAnoFiltro(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={carregandoAnos}
          >
            <option value="">{carregandoAnos ? 'Carregando...' : 'Todos os anos'}</option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <label htmlFor="mes" className="text-sm font-medium text-foreground">
            Mês:
          </label>
          <select
            id="mes"
            value={mesFiltro || ''}
            onChange={(e) => setMesFiltro(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Todos</option>
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <label htmlFor="empresa" className="text-sm font-medium text-foreground">
            Empresa:
          </label>
          <select
            id="empresa"
            value={empresaFiltro || ''}
            onChange={(e) => setEmpresaFiltro(e.target.value || undefined)}
            className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Todas</option>
            {empresas?.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.razaoSocial}
              </option>
            ))}
          </select>
        </div>

        {/* Indicadores de Filtros Ativos */}
        {(anoFiltro || mesFiltro || empresaFiltro) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground">Filtros ativos:</span>
            {anoFiltro && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                Ano: {anoFiltro}
                <button
                  onClick={() => setAnoFiltro(undefined)}
                  className="ml-1 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800"
                  aria-label="Remover filtro de ano"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {mesFiltro && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                Mês: {meses.find(m => m.value === mesFiltro)?.label || mesFiltro}
                <button
                  onClick={() => setMesFiltro(undefined)}
                  className="ml-1 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800"
                  aria-label="Remover filtro de mês"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {empresaFiltro && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                Empresa: {empresas?.find(e => e.id === empresaFiltro)?.razaoSocial || 'Selecionada'}
                <button
                  onClick={() => setEmpresaFiltro(undefined)}
                  className="ml-1 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800"
                  aria-label="Remover filtro de empresa"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* Card Acumulado do Ano */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative w-full sm:w-auto overflow-hidden rounded-xl border border-border bg-card p-6 shadow-lg transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                Acumulado do Ano
              </p>
              <p className="mt-3 text-3xl font-bold text-foreground">
                {formatarValor(acumuladoAno)}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {anoFiltro ? `Ano ${anoFiltro}` : 'Todos os anos'}
                  </span>
                </div>
            <div className="ml-4 rounded-xl bg-sky-500/10 p-3 text-sky-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-sky-500/20 dark:bg-sky-500/20 dark:text-sky-300">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
              </div>
            </div>
      </section>

      {/* Gráfico Consolidado */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Visão Consolidada
          </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {empresaFiltro 
                ? empresas?.find(e => e.id === empresaFiltro)?.razaoSocial || 'Empresa Selecionada'
                : 'Todas as Empresas'}
            </p>
          </div>
        </div>
        {dadosConsolidado.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartConfig.height}>
            <AreaChart 
              data={dadosConsolidado}
              margin={{ 
                top: 10, 
                right: chartConfig.isMobile ? 10 : 20, 
                left: 0, 
                bottom: chartConfig.isMobile ? 50 : 40 
              }}
            >
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                opacity={0.5}
                vertical={false}
              />
              <XAxis 
                dataKey="periodo" 
                tick={{ 
                  fontSize: chartConfig.fontSize,
                  fill: '#64748b',
                  fontWeight: 500
                }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                angle={chartConfig.isMobile ? -45 : 0}
                textAnchor={chartConfig.isMobile ? 'end' : 'middle'}
                height={chartConfig.isMobile ? 50 : 40}
                interval={0}
              />
              <YAxis
                tickFormatter={(value) => {
                  const num = Number(value);
                  if (isNaN(num)) return value.toString();
                  if (Math.abs(num) >= 1000000) {
                    return `${(num / 1000000).toFixed(1)}M`;
                  }
                  if (Math.abs(num) >= 1000) {
                    return `${(num / 1000).toFixed(0)}K`;
                  }
                  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }}
                width={chartConfig.isMobile ? 60 : 120}
                tick={{ 
                  fontSize: chartConfig.fontSize,
                  fill: '#64748b',
                  fontWeight: 500,
                  dx: chartConfig.isMobile ? -60 : -132
                }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length || !label) return null;
                  
                  const currentValue = payload[0].value as number;
                  const labelStr = String(label);
                  const currentIndex = dadosConsolidado.findIndex(item => String(item.periodo) === labelStr);
                  const previousItem = currentIndex > 0 ? dadosConsolidado[currentIndex - 1] : null;
                  
                  let diff: number | null = null;
                  let percentual: number | null = null;
                  
                  if (previousItem) {
                    diff = currentValue - previousItem.valor;
                    const percentualValue = previousItem.valor !== 0 
                      ? (diff / Math.abs(previousItem.valor)) * 100 
                      : (currentValue !== 0 ? (currentValue > 0 ? 100 : -100) : 0);
                    percentual = percentualValue;
                  }
                  
                  return (
                    <div style={{
                      fontSize: chartConfig.fontSize,
                      padding: chartConfig.isMobile ? '10px' : '16px',
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      fontWeight: 500,
                      maxWidth: chartConfig.isMobile ? '200px' : 'none'
                    }}>
                      <div style={{
                        color: '#1e293b',
                        fontWeight: 600,
                        marginBottom: '8px',
                        fontSize: chartConfig.isMobile ? '11px' : '13px'
                      }}>
                        {labelStr.includes('/') ? `Período: ${labelStr}` : `Ano: ${labelStr} (Acumulado)`}
                      </div>
                      <div style={{
                        color: '#0ea5e9',
                        fontWeight: 600,
                        marginBottom: diff !== null ? '8px' : '0',
                        fontSize: chartConfig.isMobile ? '11px' : '13px'
                      }}>
                        Resultado: {formatarValor(currentValue)}
                      </div>
                      {diff !== null && (
                        <>
                          <div style={{
                            color: diff >= 0 ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                            marginBottom: '4px',
                            fontSize: chartConfig.isMobile ? '10px' : '12px'
                          }}>
                            Diferença: {diff >= 0 ? '+' : ''}{formatarValor(diff)}
                          </div>
                          <div style={{
                            color: percentual !== null && percentual >= 0 ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                            fontSize: chartConfig.isMobile ? '10px' : '12px'
                          }}>
                            Variação: {percentual !== null && percentual >= 0 ? '+' : ''}{percentual !== null ? percentual.toFixed(2) : '0.00'}%
                    </div>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fill="url(#colorValor)"
                dot={{ 
                  r: 4, 
                  fill: '#0ea5e9',
                  strokeWidth: 2,
                  stroke: '#ffffff'
                }}
                activeDot={{ 
                  r: 7, 
                  fill: '#0284c7',
                  strokeWidth: 3,
                  stroke: '#ffffff',
                  style: { filter: 'drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3))' }
                }}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={false}
                activeDot={false}
              >
                <LabelList
                  dataKey="valor"
                  position="top"
                  formatter={(value: any) => {
                    const num = typeof value === 'number' ? value : Number(value);
                    return isNaN(num) ? '' : formatarValor(num);
                  }}
                  style={{ 
                    fontSize: `${chartConfig.labelFontSize}px`, 
                    fill: '#1e293b', 
                    fontWeight: 600,
                    textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                  }}
                />
              </Line>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] sm:h-96 items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhum dado disponível para o período selecionado.</p>
          </div>
        )}
      </section>

      {/* Gráfico por Empresa */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Visão Individual por Empresa
          </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAcumulado ? 'Valores acumulados do ano' : 'Comparação mensal por empresa'}
            </p>
                    </div>
                    </div>
        {dadosPorEmpresa.length > 0 && empresasUnicas.length > 0 ? (
          <div className={`w-full ${chartConfig.isMobile ? '' : '-ml-6'} ${chartConfig.isMobile ? 'pr-0' : 'pr-2'}`}>
            <ResponsiveContainer width="100%" height={chartConfig.barHeight}>
              {isAcumulado ? (
                <BarChart 
                  data={dadosPorEmpresa} 
                  layout="vertical"
                  margin={{ 
                    top: 10, 
                    right: chartConfig.isMobile ? 50 : 80, 
                    left: 0, 
                    bottom: 10 
                  }}
                >
                <defs>
                  <linearGradient id="colorBarAccumulated" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  opacity={0.5}
                  horizontal={false}
                />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => {
                    const num = Number(value);
                    if (isNaN(num)) return value.toString();
                    if (Math.abs(num) >= 1000000) {
                      return `${(num / 1000000).toFixed(1)}M`;
                    }
                    if (Math.abs(num) >= 1000) {
                      return `${(num / 1000).toFixed(0)}K`;
                    }
                    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  }}
                  tick={{ 
                    fontSize: chartConfig.fontSize,
                    fill: '#64748b',
                    fontWeight: 500
                  }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  width={chartConfig.isMobile ? 60 : 120}
                />
                <YAxis 
                  type="category"
                  dataKey="empresa" 
                  tick={{ 
                    fontSize: chartConfig.fontSize,
                    fill: '#64748b',
                    fontWeight: 500,
                    textAnchor: 'start',
                    dx: chartConfig.isMobile ? -120 : -168
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={chartConfig.isMobile ? 100 : 200}
                  tickFormatter={(value) => {
                    return value;
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatarValor(value),
                    'Valor Acumulado'
                  ]}
                  labelFormatter={(label) => `Empresa: ${label}`}
                  contentStyle={{ 
                    fontSize: chartConfig.fontSize,
                    padding: chartConfig.isMobile ? '10px' : '16px',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    fontWeight: 500,
                    maxWidth: chartConfig.isMobile ? '200px' : 'none'
                  }}
                  labelStyle={{
                    color: '#1e293b',
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontSize: chartConfig.isMobile ? '11px' : '13px'
                  }}
                  itemStyle={{
                    color: '#0ea5e9',
                    fontWeight: 600,
                    fontSize: chartConfig.isMobile ? '11px' : '13px'
                  }}
                />
                <Bar
                  dataKey="valor"
                  name="Valor Acumulado"
                  fill="url(#colorBarAccumulated)"
                  radius={[0, 8, 8, 0]}
                  barSize={30}
                >
                  <LabelList
                    dataKey="valor"
                    position="right"
                    offset={5}
                    formatter={(value: any) => {
                      const num = typeof value === 'number' ? value : Number(value);
                      if (isNaN(num) || num === 0) return '';
                      return formatarValor(num);
                    }}
                    style={{ 
                      fontSize: `${chartConfig.labelFontSize}px`, 
                      fill: '#1e293b', 
                      fontWeight: 600,
                      textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                    }}
                  />
                </Bar>
              </BarChart>
            ) : (
              <BarChart 
                data={dadosPorEmpresa}
                margin={{ 
                  top: 30, 
                  right: chartConfig.isMobile ? 10 : 30, 
                  left: 0, 
                  bottom: chartConfig.isMobile ? 70 : 60 
                }}
              >
                <defs>
                  {empresasUnicas.map((empresa, index) => {
                    const cores = [
                      { start: '#0ea5e9', end: '#0284c7' }, // sky
                      { start: '#10b981', end: '#059669' }, // emerald
                      { start: '#f59e0b', end: '#d97706' }, // amber
                      { start: '#ef4444', end: '#dc2626' }, // red
                      { start: '#8b5cf6', end: '#7c3aed' }, // violet
                      { start: '#ec4899', end: '#db2777' }, // pink
                      { start: '#14b8a6', end: '#0d9488' }, // teal
                      { start: '#f97316', end: '#ea580c' }, // orange
                    ];
                    const cor = cores[index % cores.length];
                    return (
                      <linearGradient key={empresa} id={`colorBar${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={cor.start} stopOpacity={1}/>
                        <stop offset="100%" stopColor={cor.end} stopOpacity={1}/>
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  opacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="periodo" 
                  tick={{ 
                    fontSize: chartConfig.fontSize,
                    fill: '#64748b',
                    fontWeight: 500
                  }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  angle={chartConfig.isMobile ? -45 : 0}
                  textAnchor={chartConfig.isMobile ? 'end' : 'middle'}
                  height={chartConfig.isMobile ? 60 : 50}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(value) => {
                    const num = Number(value);
                    if (isNaN(num)) return value.toString();
                    if (Math.abs(num) >= 1000000) {
                      return `${(num / 1000000).toFixed(1)}M`;
                    }
                    if (Math.abs(num) >= 1000) {
                      return `${(num / 1000).toFixed(0)}K`;
                    }
                    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  }}
                  width={chartConfig.isMobile ? 60 : 120}
                  tick={{ 
                    fontSize: chartConfig.fontSize,
                    fill: '#64748b',
                    fontWeight: 500,
                    dx: -132
                  }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatarValor(value),
                    name
                  ]}
                  labelFormatter={(label) => {
                    if (label.includes('/')) {
                      return `Período: ${label}`;
                    }
                    return `Ano: ${label} (Acumulado)`;
                  }}
                  contentStyle={{ 
                    fontSize: chartConfig.fontSize,
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    fontWeight: 500
                  }}
                  labelStyle={{
                    color: '#1e293b',
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontSize: '13px'
                  }}
                />
                {chartConfig.showLegend && (
                  <Legend 
                    wrapperStyle={{ fontSize: chartConfig.legendFontSize, paddingTop: '20px' }}
                    iconType="square"
                    iconSize={12}
                  />
                )}
                {empresasUnicas.map((empresa, index) => {
                  const cores = [
                    '#0ea5e9', // sky-500
                    '#10b981', // emerald-500
                    '#f59e0b', // amber-500
                    '#ef4444', // red-500
                    '#8b5cf6', // violet-500
                    '#ec4899', // pink-500
                    '#14b8a6', // teal-500
                    '#f97316', // orange-500
                  ];
                  return (
                    <Bar
                      key={empresa}
                      dataKey={empresa}
                      name={empresa}
                      fill={`url(#colorBar${index})`}
                      radius={[8, 8, 0, 0]}
                      barSize={35}
                    >
                      <LabelList
                        dataKey={empresa}
                        position={dadosPorEmpresa.length <= 6 ? 'top' : 'inside'}
                        formatter={(value: any) => {
                          const num = typeof value === 'number' ? value : Number(value);
                          if (isNaN(num) || num === 0) return '';
                          return formatarValor(num);
                        }}
                        style={{ 
                          fontSize: `${chartConfig.labelFontSize}px`, 
                          fill: dadosPorEmpresa.length <= 6 ? '#1e293b' : '#ffffff',
                          fontWeight: 600,
                          textShadow: dadosPorEmpresa.length <= 6 ? '0 1px 2px rgba(255, 255, 255, 0.8)' : '0 1px 2px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                    </Bar>
                );
              })}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        ) : (
          <div className="flex h-[200px] sm:h-96 items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhum dado disponível para o período selecionado.</p>
            </div>
          )}
      </section>
    </div>
  );
};

export default DashboardPage;
