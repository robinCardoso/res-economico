'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { uploadsService } from '@/services/uploads.service';
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['conta745', anoFiltro, mesFiltro],
    queryFn: () => uploadsService.getConta745(anoFiltro, mesFiltro),
  });

  // Gerar anos disponíveis (últimos 5 anos)
  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatarValor = (valor: number) => {
    // Formatar valores grandes com separador de milhar
    if (Math.abs(valor) >= 1000) {
      return numeral(valor).format('0,0');
    }
    return numeral(valor).format('0,0.00');
  };

  // Preparar dados para gráfico consolidado
  const dadosConsolidado = data?.consolidado || [];

  // Calcular acumulado do ano (soma de todos os valores do consolidado)
  const acumuladoAno = dadosConsolidado.reduce((sum, item) => sum + item.valor, 0);

  // Preparar dados para gráfico por empresa
  // Agrupar por empresa e período
  const dadosPorEmpresaMap = new Map<string, Array<{ periodo: string; valor: number }>>();
  
  data?.porEmpresa.forEach((item) => {
    if (!dadosPorEmpresaMap.has(item.empresaNome)) {
      dadosPorEmpresaMap.set(item.empresaNome, []);
    }
    const empresaData = dadosPorEmpresaMap.get(item.empresaNome)!;
    empresaData.push({ periodo: item.periodo, valor: item.valor });
  });

  // Converter para array de séries
  const empresasUnicas = Array.from(dadosPorEmpresaMap.keys());
  const periodosUnicos = Array.from(
    new Set(data?.porEmpresa.map((item) => item.periodo) || [])
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

  // Criar dados para gráfico de barras agrupadas
  const dadosPorEmpresa = periodosUnicos.map((periodo) => {
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
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Resultado do Exercício - Período do Balanço (Conta 745)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Análise consolidada e por empresa da conta 745 - Resultado do Exercício-Período do Balanço
        </p>
      </section>

      {/* Filtros */}
      <section className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-2">
          <label htmlFor="ano" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Ano:
          </label>
          <select
            id="ano"
            value={anoFiltro || ''}
            onChange={(e) => setAnoFiltro(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todos</option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="mes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Mês:
          </label>
          <select
            id="mes"
            value={mesFiltro || ''}
            onChange={(e) => setMesFiltro(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todos</option>
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Card Acumulado do Ano */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Acumulado do Ano</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {formatarValor(acumuladoAno)}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-500">
                {anoFiltro ? `Ano ${anoFiltro}` : 'Todos os anos'}
              </span>
            </div>
            <span className="rounded-full bg-sky-500/10 p-3 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </span>
          </div>
        </div>
      </section>

      {/* Gráfico Consolidado */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Visão Consolidada (Todas as Empresas)
        </h2>
        {dadosConsolidado.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dadosConsolidado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis
                tickFormatter={(value) => {
                  // Formatar valores do eixo Y com separador de milhar
                  const num = Number(value);
                  if (isNaN(num)) return value.toString();
                  // Usar formatação mais simples para evitar cortes
                  if (Math.abs(num) >= 1000) {
                    return num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
                  }
                  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }}
                width={90}
              />
              <Tooltip
                formatter={(value: number) => formatarValor(value)}
                labelFormatter={(label) => {
                  // Se contém "/", é MM/YYYY, senão é apenas o ano
                  if (label.includes('/')) {
                    return `Período: ${label}`;
                  }
                  return `Ano: ${label} (Acumulado)`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="valor"
                name="Resultado do Exercício"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  dataKey="valor"
                  position="top"
                  formatter={(value: number) => {
                    const num = Number(value);
                    if (Math.abs(num) >= 1000) {
                      return num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
                    }
                    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  }}
                  style={{ fontSize: '11px', fill: '#475569', fontWeight: 500 }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-96 items-center justify-center">
            <p className="text-sm text-slate-500">Nenhum dado disponível para o período selecionado.</p>
          </div>
        )}
      </section>

      {/* Gráfico por Empresa */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Visão Individual por Empresa
        </h2>
        {dadosPorEmpresa.length > 0 && empresasUnicas.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosPorEmpresa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis
                tickFormatter={(value) => {
                  // Formatar valores do eixo Y com separador de milhar
                  const num = Number(value);
                  if (isNaN(num)) return value.toString();
                  // Usar formatação mais simples para evitar cortes
                  if (Math.abs(num) >= 1000) {
                    return num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
                  }
                  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }}
                width={90}
              />
              <Tooltip
                formatter={(value: number) => formatarValor(value)}
                labelFormatter={(label) => {
                  // Se contém "/", é MM/YYYY, senão é apenas o ano
                  if (label.includes('/')) {
                    return `Período: ${label}`;
                  }
                  return `Ano: ${label} (Acumulado)`;
                }}
              />
              <Legend />
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
                    fill={cores[index % cores.length]}
                  >
                    <LabelList
                      dataKey={empresa}
                      position={dadosPorEmpresa.length <= 6 ? 'top' : 'inside'}
                      formatter={(value: number) => {
                        if (value === 0) return '';
                        const num = Number(value);
                        if (Math.abs(num) >= 1000) {
                          return num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
                        }
                        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      }}
                      style={{ fontSize: '10px', fill: '#1e293b', fontWeight: 500 }}
                    />
                  </Bar>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-96 items-center justify-center">
            <p className="text-sm text-slate-500">Nenhum dado disponível para o período selecionado.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
