'use client';

import { useState, useMemo } from 'react';
import { useContas } from '@/hooks/use-contas';
import { getStatusLabel } from '@/lib/format';
import type { ContaStatus } from '@/types/api';
import { Search } from 'lucide-react';

const ContasPage = () => {
  const [statusFiltro, setStatusFiltro] = useState<ContaStatus | ''>('');
  const [tipoContaFiltro, setTipoContaFiltro] = useState<string>('');
  const [nivelFiltro, setNivelFiltro] = useState<number | ''>('');
  const [classificacaoPrefix, setClassificacaoPrefix] = useState<string>('');
  const [busca, setBusca] = useState<string>('');

  // Construir filtros
  const filters = useMemo(() => {
    const f: any = {};
    if (statusFiltro) f.status = statusFiltro;
    if (tipoContaFiltro) f.tipoConta = tipoContaFiltro;
    if (nivelFiltro) f.nivel = nivelFiltro;
    if (classificacaoPrefix) f.classificacaoPrefix = classificacaoPrefix;
    if (busca) f.busca = busca;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [statusFiltro, tipoContaFiltro, nivelFiltro, classificacaoPrefix, busca]);

  const { data: contas, isLoading, error } = useContas(filters);
  const { data: todasContas } = useContas(); // Buscar todas para popular filtros

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando contas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar contas. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  // Garantir que contas seja sempre um array
  const contasList = Array.isArray(contas) ? contas : [];
  const todasContasList = Array.isArray(todasContas) ? todasContas : [];

  // Extrair tipos de conta únicos para o filtro (de todas as contas)
  const tiposConta = useMemo(() => {
    const tipos = new Set<string>();
    todasContasList.forEach((conta) => {
      if (conta.tipoConta) tipos.add(conta.tipoConta);
    });
    return Array.from(tipos).sort();
  }, [todasContasList]);

  // Extrair níveis únicos para o filtro (de todas as contas)
  const niveis = useMemo(() => {
    const niveisSet = new Set<number>();
    todasContasList.forEach((conta) => {
      niveisSet.add(conta.nivel);
    });
    return Array.from(niveisSet).sort((a, b) => a - b);
  }, [todasContasList]);

  const hasActiveFilters = statusFiltro || tipoContaFiltro || nivelFiltro || classificacaoPrefix || busca;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Catálogo de contas
        </h1>
        <p className="text-sm text-slate-500">
          Catálogo unificado de todas as contas importadas. Cada classificação aparece apenas uma vez, independente da empresa.
        </p>
      </header>

      {/* Filtros e Busca */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por classificação ou nome da conta..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Filtros em Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filtro por Status */}
            <div>
              <label htmlFor="status-filtro" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                id="status-filtro"
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value as ContaStatus | '')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todos</option>
                <option value="ATIVA">Regular</option>
                <option value="NOVA">Nova</option>
                <option value="ARQUIVADA">Arquivada</option>
              </select>
            </div>

            {/* Filtro por Tipo de Conta */}
            <div>
              <label htmlFor="tipo-conta-filtro" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Tipo de Conta
              </label>
              <select
                id="tipo-conta-filtro"
                value={tipoContaFiltro}
                onChange={(e) => setTipoContaFiltro(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todos</option>
                {tiposConta.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Nível */}
            <div>
              <label htmlFor="nivel-filtro" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Nível
              </label>
              <select
                id="nivel-filtro"
                value={nivelFiltro}
                onChange={(e) => setNivelFiltro(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todos</option>
                {niveis.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    Nível {nivel}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Prefixo de Classificação */}
            <div>
              <label htmlFor="classificacao-prefix-filtro" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Prefixo Classificação
              </label>
              <input
                id="classificacao-prefix-filtro"
                type="text"
                placeholder="Ex: 1. (Ativos)"
                value={classificacaoPrefix}
                onChange={(e) => setClassificacaoPrefix(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Contador e Limpar Filtros */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {contasList.length} conta(s) encontrada(s)
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setStatusFiltro('');
                  setTipoContaFiltro('');
                  setNivelFiltro('');
                  setClassificacaoPrefix('');
                  setBusca('');
                }}
                className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tabela de Contas */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {contasList.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {hasActiveFilters
              ? 'Nenhuma conta encontrada com os filtros aplicados.'
              : 'Nenhuma conta encontrada. As contas aparecerão aqui após importações.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50/60 dark:bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Classificação
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Nível</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Primeira Importação</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Última Importação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {contasList.map((conta) => (
                  <tr key={conta.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-semibold">{conta.classificacao}</td>
                    <td className="px-4 py-3">{conta.nomeConta}</td>
                    <td className="px-4 py-3">{conta.tipoConta}</td>
                    <td className="px-4 py-3">{conta.nivel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          conta.status === 'NOVA'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'
                            : conta.status === 'ARQUIVADA'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                        }`}
                      >
                        {getStatusLabel(conta.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(conta.primeiraImportacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(conta.ultimaImportacao).toLocaleDateString('pt-BR')}
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

export default ContasPage;
