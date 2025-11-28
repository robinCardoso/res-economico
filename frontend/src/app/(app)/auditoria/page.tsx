'use client';

import { useState, useMemo } from 'react';
import { useAuditoria, useAuditoriaRecursos, useAuditoriaAcoes } from '@/hooks/use-auditoria';
import { formatDateTime } from '@/lib/format';
import { Search, Calendar } from 'lucide-react';
import type { FilterAuditoriaParams } from '@/services/auditoria.service';

const AuditoriaPage = () => {
  const [recursoFiltro, setRecursoFiltro] = useState<string>('');
  const [acaoFiltro, setAcaoFiltro] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  const filters = useMemo(() => {
    const f: FilterAuditoriaParams = {};
    if (recursoFiltro) f.recurso = recursoFiltro;
    if (acaoFiltro) f.acao = acaoFiltro;
    if (busca) f.busca = busca;
    if (dataInicio) f.dataInicio = dataInicio;
    if (dataFim) f.dataFim = dataFim;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [recursoFiltro, acaoFiltro, busca, dataInicio, dataFim]);

  const { data: logs, isLoading, error } = useAuditoria(filters);
  const { data: recursos } = useAuditoriaRecursos();
  const { data: acoes } = useAuditoriaAcoes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Carregando logs de auditoria...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar logs de auditoria. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  const logsList = Array.isArray(logs) ? logs : [];
  const recursosList = Array.isArray(recursos) ? recursos : [];
  const acoesList = Array.isArray(acoes) ? acoes : [];

  const hasActiveFilters = recursoFiltro || acaoFiltro || busca || dataInicio || dataFim;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground dark:text-slate-50">
          Logs de Auditoria
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico completo de todas as ações realizadas no sistema.
        </p>
      </header>

      {/* Filtros e Busca */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por recurso ou ação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-md border border-border bg-input pl-10 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Filtros em Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filtro por Recurso */}
            <div>
              <label htmlFor="recurso-filtro" className="mb-1 block text-xs font-medium text-foreground dark:text-slate-300">
                Recurso
              </label>
              <select
                id="recurso-filtro"
                value={recursoFiltro}
                onChange={(e) => setRecursoFiltro(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Todos</option>
                {recursosList.map((recurso) => (
                  <option key={recurso} value={recurso}>
                    {recurso}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Ação */}
            <div>
              <label htmlFor="acao-filtro" className="mb-1 block text-xs font-medium text-foreground dark:text-slate-300">
                Ação
              </label>
              <select
                id="acao-filtro"
                value={acaoFiltro}
                onChange={(e) => setAcaoFiltro(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Todas</option>
                {acoesList.map((acao) => (
                  <option key={acao} value={acao}>
                    {acao}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Data Início */}
            <div>
              <label htmlFor="data-inicio" className="mb-1 block text-xs font-medium text-foreground dark:text-slate-300">
                Data Início
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  id="data-inicio"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full rounded-md border border-border bg-input pl-10 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Filtro por Data Fim */}
            <div>
              <label htmlFor="data-fim" className="mb-1 block text-xs font-medium text-foreground dark:text-slate-300">
                Data Fim
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  id="data-fim"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full rounded-md border border-border bg-input pl-10 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Contador e Limpar Filtros */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {logsList.length} log(s) encontrado(s)
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setRecursoFiltro('');
                  setAcaoFiltro('');
                  setBusca('');
                  setDataInicio('');
                  setDataFim('');
                }}
                className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tabela de Logs */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        {logsList.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Nenhum log encontrado com os filtros aplicados.'
              : 'Nenhum log de auditoria encontrado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Recurso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {logsList.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/70">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground dark:text-slate-400">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-foreground dark:text-slate-300">
                        {log.usuario?.nome || 'N/A'}
                      </div>
                      <div className="text-[10px] text-muted-foreground dark:text-slate-400">
                        {log.usuario?.email || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                        {log.recurso}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-foreground dark:text-slate-300">
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-muted-foreground dark:text-slate-400 max-w-md">
                        {Object.keys(log.dados).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
                              Ver detalhes
                            </summary>
                            <pre className="mt-2 text-[10px] bg-muted p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(log.dados, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AuditoriaPage;

