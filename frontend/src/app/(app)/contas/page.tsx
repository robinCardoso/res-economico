'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useContas } from '@/hooks/use-contas';
import { getStatusLabel } from '@/lib/format';
import type { ContaStatus } from '@/types/api';
import { Search } from 'lucide-react';

const ContasPage = () => {
  const searchParams = useSearchParams();
  
  // Ler query params da URL
  const classificacaoFromUrl = searchParams.get('classificacaoPrefix') || '';
  const contaFromUrl = searchParams.get('conta') || '';
  const subContaFromUrl = searchParams.get('subConta') || '';
  const tipoContaFromUrl = searchParams.get('tipoConta') || '';

  const [statusFiltro, setStatusFiltro] = useState<ContaStatus | ''>('');
  const [tipoContaFiltro, setTipoContaFiltro] = useState<string>(tipoContaFromUrl);
  const [nivelFiltro, setNivelFiltro] = useState<number | ''>('');
  const [classificacaoPrefix, setClassificacaoPrefix] = useState<string>(classificacaoFromUrl);
  const [buscaInput, setBuscaInput] = useState<string>(''); // Valor do input
  const [buscaFiltro, setBuscaFiltro] = useState<string>(''); // Valor aplicado no filtro
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Atualizar filtros quando query params mudarem
  useEffect(() => {
    if (classificacaoFromUrl) {
      setClassificacaoPrefix(classificacaoFromUrl);
    }
    if (tipoContaFromUrl) {
      setTipoContaFiltro(tipoContaFromUrl);
    }
    if (contaFromUrl) {
      setContaFiltro(contaFromUrl);
    }
    if (subContaFromUrl !== null) {
      setSubContaFiltro(subContaFromUrl);
    }
  }, [classificacaoFromUrl, tipoContaFromUrl, contaFromUrl, subContaFromUrl]);

  // Estados para conta e subConta (para filtros vindos da URL)
  const [contaFiltro, setContaFiltro] = useState<string>(contaFromUrl);
  const [subContaFiltro, setSubContaFiltro] = useState<string>(subContaFromUrl);

  // Construir filtros
  type FilterType = {
    status?: ContaStatus;
    tipoConta?: string;
    nivel?: number;
    classificacaoPrefix?: string;
    busca?: string;
    conta?: string;
    subConta?: string;
  };

  const filters = useMemo(() => {
    const f: FilterType = {};
    if (statusFiltro) f.status = statusFiltro;
    if (tipoContaFiltro) f.tipoConta = tipoContaFiltro;
    if (nivelFiltro) f.nivel = nivelFiltro;
    if (classificacaoPrefix) f.classificacaoPrefix = classificacaoPrefix;
    if (buscaFiltro) f.busca = buscaFiltro;
    if (contaFiltro) f.conta = contaFiltro;
    if (subContaFiltro !== undefined) f.subConta = subContaFiltro;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [statusFiltro, tipoContaFiltro, nivelFiltro, classificacaoPrefix, buscaFiltro, contaFiltro, subContaFiltro]);

  const { data: contas, isLoading, error } = useContas(filters);
  const { data: todasContas } = useContas(); // Buscar todas para popular filtros

  // Garantir que contas seja sempre um array
  const contasList = Array.isArray(contas) ? contas : [];
  const todasContasList = useMemo(() => {
    return Array.isArray(todasContas) ? todasContas : [];
  }, [todasContas]);

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

  // Gerar sugestões de autocomplete baseadas no input
  const autocompleteSuggestions = useMemo(() => {
    if (!buscaInput || buscaInput.trim().length < 2) {
      return [];
    }

    const searchLower = buscaInput.toLowerCase().trim();
    const suggestions: Array<{ classificacao: string; nomeConta: string }> = [];

    // Buscar em todas as contas
    todasContasList.forEach((conta) => {
      const classificacaoMatch = conta.classificacao.toLowerCase().includes(searchLower);
      const nomeMatch = conta.nomeConta.toLowerCase().includes(searchLower);

      if (classificacaoMatch || nomeMatch) {
        // Evitar duplicatas
        const alreadyAdded = suggestions.some(
          (s) => s.classificacao === conta.classificacao && s.nomeConta === conta.nomeConta
        );

        if (!alreadyAdded) {
          suggestions.push({
            classificacao: conta.classificacao,
            nomeConta: conta.nomeConta,
          });
        }
      }
    });

    // Ordenar: priorizar nome da conta quando busca for por nome, senão por classificação
    return suggestions
      .sort((a, b) => {
        const aNomeMatch = a.nomeConta.toLowerCase().includes(searchLower);
        const bNomeMatch = b.nomeConta.toLowerCase().includes(searchLower);
        const aClassMatch = a.classificacao.toLowerCase().includes(searchLower);
        const bClassMatch = b.classificacao.toLowerCase().includes(searchLower);
        
        // Se ambos têm match no nome, ordenar por nome
        if (aNomeMatch && bNomeMatch) {
          return a.nomeConta.localeCompare(b.nomeConta);
        }
        // Se apenas um tem match no nome, priorizar ele
        if (aNomeMatch && !bNomeMatch) return -1;
        if (!aNomeMatch && bNomeMatch) return 1;
        // Se ambos têm match na classificação, ordenar por classificação
        if (aClassMatch && bClassMatch) {
          return a.classificacao.localeCompare(b.classificacao);
        }
        // Se apenas um tem match na classificação, priorizar ele
        if (aClassMatch && !bClassMatch) return -1;
        if (!aClassMatch && bClassMatch) return 1;
        // Caso padrão: ordenar por nome
        return a.nomeConta.localeCompare(b.nomeConta);
      })
      .slice(0, 10); // Limitar a 10 sugestões
  }, [buscaInput, todasContasList]);

  // Função para aplicar busca
  const aplicarBusca = () => {
    setBuscaFiltro(buscaInput.trim());
    setShowAutocomplete(false);
  };

  // Função para selecionar sugestão - preenche apenas o nome da conta
  const selecionarSugestao = (sugestao: { classificacao: string; nomeConta: string }) => {
    setBuscaInput(sugestao.nomeConta);
    setBuscaFiltro(sugestao.nomeConta);
    setShowAutocomplete(false);
    setSelectedSuggestionIndex(-1);
  };

  // Fechar autocomplete ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navegação por teclado no autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && autocompleteSuggestions[selectedSuggestionIndex]) {
        selecionarSugestao(autocompleteSuggestions[selectedSuggestionIndex]);
      } else {
        aplicarBusca();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowAutocomplete(true);
      setSelectedSuggestionIndex((prev) =>
        prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setSelectedSuggestionIndex(-1);
    }
  };

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

  const hasActiveFilters = statusFiltro || tipoContaFiltro || nivelFiltro || classificacaoPrefix || buscaFiltro;

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Catálogo de contas
        </h1>
        <p className="text-xs text-slate-500">
          Catálogo unificado de todas as contas importadas. Cada classificação aparece apenas uma vez, independente da empresa.
        </p>
      </header>

      {/* Filtros e Busca */}
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="space-y-2.5">
          {/* Busca com Autocomplete */}
          <div className="relative">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar por classificação ou nome da conta..."
                  value={buscaInput}
                  onChange={(e) => {
                    setBuscaInput(e.target.value);
                    setShowAutocomplete(e.target.value.trim().length >= 2);
                    setSelectedSuggestionIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (buscaInput.trim().length >= 2 && autocompleteSuggestions.length > 0) {
                      setShowAutocomplete(true);
                    }
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {/* Autocomplete Dropdown */}
                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div
                    ref={autocompleteRef}
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
                  >
                    {autocompleteSuggestions.map((sugestao, index) => (
                      <button
                        key={`${sugestao.classificacao}-${index}`}
                        type="button"
                        onClick={() => selecionarSugestao(sugestao)}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          index === selectedSuggestionIndex
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        <div className="font-medium text-[10px]">{sugestao.nomeConta}</div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{sugestao.classificacao}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={aplicarBusca}
                className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-500 dark:hover:bg-sky-600"
              >
                <Search className="h-3.5 w-3.5" />
                Buscar
              </button>
            </div>
          </div>

          {/* Filtros em Grid */}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filtro por Status */}
            <div>
              <label htmlFor="status-filtro" className="mb-0.5 block text-[10px] font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                id="status-filtro"
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value as ContaStatus | '')}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todos</option>
                <option value="ATIVA">Regular</option>
                <option value="NOVA">Nova</option>
                <option value="ARQUIVADA">Arquivada</option>
              </select>
            </div>

            {/* Filtro por Tipo de Conta */}
            <div>
              <label htmlFor="tipo-conta-filtro" className="mb-0.5 block text-[10px] font-medium text-slate-700 dark:text-slate-300">
                Tipo de Conta
              </label>
              <select
                id="tipo-conta-filtro"
                value={tipoContaFiltro}
                onChange={(e) => setTipoContaFiltro(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              <label htmlFor="nivel-filtro" className="mb-0.5 block text-[10px] font-medium text-slate-700 dark:text-slate-300">
                Nível
              </label>
              <select
                id="nivel-filtro"
                value={nivelFiltro}
                onChange={(e) => setNivelFiltro(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              <label htmlFor="classificacao-prefix-filtro" className="mb-0.5 block text-[10px] font-medium text-slate-700 dark:text-slate-300">
                Prefixo Classificação
              </label>
              <input
                id="classificacao-prefix-filtro"
                type="text"
                placeholder="Ex: 1. (Ativos)"
                value={classificacaoPrefix}
                onChange={(e) => setClassificacaoPrefix(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Contador e Limpar Filtros */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500">
              {contasList.length} conta(s) encontrada(s)
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setStatusFiltro('');
                  setTipoContaFiltro('');
                  setNivelFiltro('');
                  setClassificacaoPrefix('');
                  setBuscaInput('');
                  setBuscaFiltro('');
                  setShowAutocomplete(false);
                }}
                className="text-[10px] text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
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
          <div className="px-4 py-8 text-center text-xs text-slate-500">
            {hasActiveFilters
              ? 'Nenhuma conta encontrada com os filtros aplicados.'
              : 'Nenhuma conta encontrada. As contas aparecerão aqui após importações.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-800">
              <thead className="bg-slate-50/60 dark:bg-slate-900/80">
                <tr>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500">
                    Classificação
                  </th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500">Nome</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500">Tipo</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500">Nível</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500">Status</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500">Primeira Importação</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500">Última Importação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {contasList.map((conta) => (
                  <tr key={conta.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-2 py-1.5 text-[10px] font-semibold font-mono">{conta.classificacao}</td>
                    <td className="px-2 py-1.5 text-[10px]">{conta.nomeConta}</td>
                    <td className="px-2 py-1.5 text-[10px]">{conta.tipoConta}</td>
                    <td className="px-2 py-1.5 text-[10px]">{conta.nivel}</td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
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
                    <td className="px-2 py-1.5 text-[10px] text-slate-500">
                      {new Date(conta.primeiraImportacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-500">
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
