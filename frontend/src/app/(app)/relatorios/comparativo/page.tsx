'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEmpresas } from '@/hooks/use-empresas';
import { relatoriosService } from '@/services/relatorios.service';
import type { ContaComparativa } from '@/types/api';
import { TipoRelatorio, TipoComparacao, TipoValor } from '@/types/api';
import { Loader2, ChevronRight, ChevronDown, FileSpreadsheet, FileText, BarChart3, ChevronUp } from 'lucide-react';
import { exportarComparativoParaExcel, exportarComparativoParaPDF } from '@/utils/export-relatorio';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

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

const RelatorioComparativoPage = () => {
  // Estado para controlar se os filtros estão expandidos
  const [filtrosExpandidos, setFiltrosExpandidos] = useState<boolean>(true);

  // Estados locais dos filtros (não aplicados ainda)
  const [tipoComparacaoLocal, setTipoComparacaoLocal] = useState<TipoComparacao>(TipoComparacao.CUSTOMIZADO);
  const [mes1Local, setMes1Local] = useState<number>(new Date().getMonth() + 1);
  const [ano1Local, setAno1Local] = useState<number>(new Date().getFullYear());
  const [mes2Local, setMes2Local] = useState<number>(new Date().getMonth() + 1);
  const [ano2Local, setAno2Local] = useState<number>(new Date().getFullYear());
  const [tipoLocal, setTipoLocal] = useState<TipoRelatorio>(TipoRelatorio.CONSOLIDADO);
  const [empresaIdLocal, setEmpresaIdLocal] = useState<string>('');
  const [empresaIdsLocal, setEmpresaIdsLocal] = useState<string[]>([]);
  const [descricaoLocal, setDescricaoLocal] = useState<string>('');
  const [tipoValorLocal, setTipoValorLocal] = useState<TipoValor>(TipoValor.ACUMULADO);

  // Estados dos filtros aplicados (usados na query)
  const [tipoComparacao, setTipoComparacao] = useState<TipoComparacao>(TipoComparacao.CUSTOMIZADO);
  const [mes1, setMes1] = useState<number>(new Date().getMonth() + 1);
  const [ano1, setAno1] = useState<number>(new Date().getFullYear());
  const [mes2, setMes2] = useState<number>(new Date().getMonth() + 1);
  const [ano2, setAno2] = useState<number>(new Date().getFullYear());
  const [tipo, setTipo] = useState<TipoRelatorio>(TipoRelatorio.CONSOLIDADO);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [empresaIds, setEmpresaIds] = useState<string[]>([]);
  const [descricao, setDescricao] = useState<string>('');
  const [tipoValor, setTipoValor] = useState<TipoValor>(TipoValor.ACUMULADO);

  // Estados para autocomplete de descrição
  const [descricoesSugeridas, setDescricoesSugeridas] = useState<string[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState<boolean>(false);
  const [carregandoDescricoes, setCarregandoDescricoes] = useState<boolean>(false);

  // Estado para controlar visibilidade dos gráficos
  const [mostrarGraficos, setMostrarGraficos] = useState<boolean>(false);

  const { data: empresas } = useEmpresas();
  const empresasList = empresas || [];

  // Buscar anos disponíveis no banco de dados
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [carregandoAnos, setCarregandoAnos] = useState<boolean>(true);

  useEffect(() => {
    const buscarAnos = async () => {
      try {
        const anos = await relatoriosService.getAnosDisponiveis();
        setAnosDisponiveis(anos);
        if (anos.length > 0) {
          const primeiroAno = anos[0];
          setAno1Local(primeiroAno);
          setAno2Local(primeiroAno);
          setAno1(primeiroAno);
          setAno2(primeiroAno);
        }
      } catch (error) {
        console.error('Erro ao buscar anos disponíveis:', error);
      } finally {
        setCarregandoAnos(false);
      }
    };
    buscarAnos();
  }, []);

  // Ajustar período 2 baseado no tipo de comparação
  useEffect(() => {
    if (tipoComparacaoLocal === TipoComparacao.MES_A_MES) {
      // Mês seguinte
      const mesSeguinte = mes1Local === 12 ? 1 : mes1Local + 1;
      const anoSeguinte = mes1Local === 12 ? ano1Local + 1 : ano1Local;
      setMes2Local(mesSeguinte);
      setAno2Local(anoSeguinte);
    } else if (tipoComparacaoLocal === TipoComparacao.ANO_A_ANO) {
      // Mesmo mês, ano seguinte
      setMes2Local(mes1Local);
      setAno2Local(ano1Local + 1);
    }
    // CUSTOMIZADO: não ajusta automaticamente
  }, [tipoComparacaoLocal, mes1Local, ano1Local]);

  const params = useMemo(
    () => ({
      tipoComparacao,
      mes1,
      ano1,
      mes2,
      ano2,
      tipo,
      empresaId: tipo === 'FILIAL' ? empresaId : undefined,
      empresaIds: tipo === 'CONSOLIDADO' && empresaIds.length > 0 ? empresaIds : undefined,
      descricao: descricao && descricao.trim().length > 0 ? descricao : undefined,
      tipoValor,
    }),
    [tipoComparacao, mes1, ano1, mes2, ano2, tipo, empresaId, empresaIds, descricao, tipoValor],
  );

  // Buscar descrições para autocomplete
  useEffect(() => {
    const buscarDescricoes = async () => {
      if (descricaoLocal.trim().length < 2) {
        setDescricoesSugeridas([]);
        setMostrarSugestoes(false);
        return;
      }

      setCarregandoDescricoes(true);
      try {
        const descricoes = await relatoriosService.getDescricoesDisponiveis(descricaoLocal);
        setDescricoesSugeridas(descricoes);
        setMostrarSugestoes(descricoes.length > 0);
      } catch (error) {
        console.error('Erro ao buscar descrições:', error);
        setDescricoesSugeridas([]);
        setMostrarSugestoes(false);
      } finally {
        setCarregandoDescricoes(false);
      }
    };

    const timeoutId = setTimeout(buscarDescricoes, 300);
    return () => clearTimeout(timeoutId);
  }, [descricaoLocal]);

  const aplicarFiltros = () => {
    setTipoComparacao(tipoComparacaoLocal);
    setMes1(mes1Local);
    setAno1(ano1Local);
    setMes2(mes2Local);
    setAno2(ano2Local);
    setTipo(tipoLocal);
    setEmpresaId(empresaIdLocal);
    setEmpresaIds(empresaIdsLocal);
    setDescricao(descricaoLocal);
    setTipoValor(tipoValorLocal);
    setFiltrosExpandidos(false);
    setMostrarSugestoes(false);
  };

  const limparFiltros = () => {
    const anoParaUsar = anosDisponiveis.length > 0 ? anosDisponiveis[0] : new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    setTipoComparacaoLocal(TipoComparacao.CUSTOMIZADO);
    setMes1Local(mesAtual);
    setAno1Local(anoParaUsar);
    setMes2Local(mesAtual);
    setAno2Local(anoParaUsar);
    setTipoLocal(TipoRelatorio.CONSOLIDADO);
    setEmpresaIdLocal('');
    setEmpresaIdsLocal([]);
    setDescricaoLocal('');
    setTipoValorLocal(TipoValor.ACUMULADO);

    setTipoComparacao(TipoComparacao.CUSTOMIZADO);
    setMes1(mesAtual);
    setAno1(anoParaUsar);
    setMes2(mesAtual);
    setAno2(anoParaUsar);
    setTipo(TipoRelatorio.CONSOLIDADO);
    setEmpresaId('');
    setEmpresaIds([]);
    setDescricao('');
    setTipoValor(TipoValor.ACUMULADO);
    setMostrarSugestoes(false);
    setFiltrosExpandidos(false);
  };

  // Query para buscar relatório comparativo
  const { data: relatorio, isLoading, error } = useQuery({
    queryKey: ['relatorio-comparativo', params],
    queryFn: () => relatoriosService.gerarComparativo(params),
    enabled: !!params.mes1 && !!params.ano1 && !!params.mes2 && !!params.ano2,
  });

  const formatarValor = (valor: number): string => {
    if (valor === 0) return '0';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const formatarPercentual = (percentual: number): string => {
    const sinal = percentual >= 0 ? '+' : '';
    return `${sinal}${percentual.toFixed(2)}%`;
  };

  // Função para determinar cor baseada na variação
  const getVariacaoClassName = (percentual: number): string => {
    const absPercentual = Math.abs(percentual);
    if (absPercentual >= 20) {
      return percentual >= 0
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 font-semibold'
        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200 font-semibold';
    } else if (absPercentual >= 10) {
      return percentual >= 0
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
        : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300';
    } else if (absPercentual >= 5) {
      return percentual >= 0
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
        : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
    }
    return '';
  };

  const [contasExpandidas, setContasExpandidas] = useState<Set<string>>(new Set());
  const [expandirTodosNiveis, setExpandirTodosNiveis] = useState<boolean>(false);

  // Preparar dados para gráficos - top 10 contas por valor absoluto
  const dadosGrafico = useMemo(() => {
    if (!relatorio?.contas) return [];

    const coletarTodasContas = (contas: ContaComparativa[]): ContaComparativa[] => {
      const todas: ContaComparativa[] = [];
      const processar = (lista: ContaComparativa[]) => {
        for (const conta of lista) {
          todas.push(conta);
          if (conta.filhos && conta.filhos.length > 0) {
            processar(conta.filhos);
          }
        }
      };
      processar(contas);
      return todas;
    };

    const todasContas = coletarTodasContas(relatorio.contas);
    const contasOrdenadas = todasContas
      .filter((c) => Math.abs(c.valorPeriodo1) > 0 || Math.abs(c.valorPeriodo2) > 0)
      .sort((a, b) => {
        const valorA = Math.max(Math.abs(a.valorPeriodo1), Math.abs(a.valorPeriodo2));
        const valorB = Math.max(Math.abs(b.valorPeriodo1), Math.abs(b.valorPeriodo2));
        return valorB - valorA;
      })
      .slice(0, 10);

    return contasOrdenadas.map((conta) => ({
      nome: conta.conta || conta.classificacao, // Usar número da conta, ou classificação como fallback
      nomeCompleto: conta.nomeConta, // Manter nome completo para tooltip
      classificacao: conta.classificacao,
      periodo1: conta.valorPeriodo1,
      periodo2: conta.valorPeriodo2,
      diferenca: conta.diferenca,
      percentual: conta.percentual,
    }));
  }, [relatorio]);

  // Função para coletar todas as classificações de contas que têm filhos
  const coletarTodasClassificacoes = useCallback(
    (contas: ContaComparativa[] | undefined, resultado: Set<string> = new Set()): Set<string> => {
      if (!contas) return resultado;
      for (const conta of contas) {
        if (conta.filhos && conta.filhos.length > 0) {
          resultado.add(conta.classificacao);
          coletarTodasClassificacoes(conta.filhos, resultado);
        }
      }
      return resultado;
    },
    [],
  );

  // Expandir/colapsar todas as contas
  useEffect(() => {
    if (expandirTodosNiveis) {
      const todasClassificacoes = coletarTodasClassificacoes(relatorio?.contas);
      setContasExpandidas(todasClassificacoes);
    } else {
      setContasExpandidas(new Set());
    }
  }, [expandirTodosNiveis, relatorio?.contas, coletarTodasClassificacoes]);

  const toggleExpandir = (classificacao: string) => {
    const novasExpandidas = new Set(contasExpandidas);
    if (novasExpandidas.has(classificacao)) {
      novasExpandidas.delete(classificacao);
    } else {
      novasExpandidas.add(classificacao);
    }
    setContasExpandidas(novasExpandidas);
  };

  const renderizarContas = (contas: ContaComparativa[] | undefined, nivel = 0, caminhoPai = ''): React.ReactElement[] => {
    if (!contas || contas.length === 0) return [];

    const elementos: React.ReactElement[] = [];

    for (let index = 0; index < contas.length; index++) {
      const conta = contas[index];
      const temFilhos = conta.filhos && conta.filhos.length > 0;
      const estaExpandida = contasExpandidas.has(conta.classificacao);
      // Criar chave única usando caminho completo + índice para garantir unicidade
      const chaveUnica = `${caminhoPai ? caminhoPai + '>' : ''}${conta.classificacao}|${conta.nomeConta}|${index}|${nivel}`;

      elementos.push(
        <React.Fragment key={chaveUnica}>
          <tr className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
            <td
              className="sticky left-0 z-[51] bg-white border-r border-slate-200 px-2 py-1.5 text-[10px] font-medium text-slate-700 dark:!bg-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 shadow-[2px_0_4px_rgba(0,0,0,0.05)] box-border border-b border-slate-200 dark:border-b-slate-800"
              style={{ paddingLeft: `${nivel * 12 + 8}px` }}
            >
              <div className="flex items-center gap-1">
                {temFilhos ? (
                  <button
                    onClick={() => toggleExpandir(conta.classificacao)}
                    className="flex-shrink-0 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  >
                    {estaExpandida ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <span className="font-mono text-[9px]">{conta.classificacao}</span>
              </div>
            </td>
            <td className="px-2 py-1.5 text-[10px] text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-b-slate-800">
              {conta.nomeConta}
            </td>
            <td className="px-2 py-1.5 text-[10px] text-right font-mono border-b border-slate-200 dark:border-b-slate-800">
              {formatarValor(conta.valorPeriodo1)}
            </td>
            <td className="px-2 py-1.5 text-[10px] text-right font-mono border-b border-slate-200 dark:border-b-slate-800">
              {formatarValor(conta.valorPeriodo2)}
            </td>
            <td className="px-2 py-1.5 text-[10px] text-right font-mono border-b border-slate-200 dark:border-b-slate-800">
              {formatarValor(conta.diferenca)}
            </td>
            <td
              className={`px-2 py-1.5 text-[10px] text-right font-mono rounded border-b border-slate-200 dark:border-b-slate-800 ${getVariacaoClassName(conta.percentual)}`}
            >
              {formatarPercentual(conta.percentual)}
            </td>
          </tr>
          {temFilhos && estaExpandida && renderizarContas(conta.filhos, nivel + 1, chaveUnica)}
        </React.Fragment>
      );
    }

    return elementos;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Relatório Comparativo
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Compare períodos para análise de variações e tendências.
        </p>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <button
          onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filtros</h2>
          <span className="text-xs text-slate-500">
            {filtrosExpandidos ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {filtrosExpandidos && (
          <div className="mt-4 space-y-6">
            {/* 1. Tipo de Comparação */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  1. Tipo de Comparação
                </label>
                <select
                  value={tipoComparacaoLocal}
                  onChange={(e) => setTipoComparacaoLocal(e.target.value as TipoComparacao)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value={TipoComparacao.MES_A_MES}>Mês a Mês</option>
                  <option value={TipoComparacao.ANO_A_ANO}>Ano a Ano</option>
                  <option value={TipoComparacao.CUSTOMIZADO}>Customizado</option>
                </select>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {tipoComparacaoLocal === TipoComparacao.MES_A_MES && 'Compara dois meses consecutivos (ex: Janeiro vs Fevereiro)'}
                  {tipoComparacaoLocal === TipoComparacao.ANO_A_ANO && 'Compara o mesmo mês em anos diferentes (ex: Janeiro/2024 vs Janeiro/2025)'}
                  {tipoComparacaoLocal === TipoComparacao.CUSTOMIZADO && 'Compare dois períodos específicos de sua escolha'}
                </p>
              </div>

              {/* 1.1. Tipo de Valor */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  1.1. Tipo de Valor
                </label>
                <select
                  value={tipoValorLocal}
                  onChange={(e) => setTipoValorLocal(e.target.value as TipoValor)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  title={tipoValorLocal === TipoValor.ACUMULADO ? 'Saldo acumulado até o mês (saldoAtual)' : 'Movimentação do mês (crédito - débito)'}
                >
                  <option value={TipoValor.ACUMULADO}>Valor Acumulado</option>
                  <option value={TipoValor.PERIODO}>Valor do Período</option>
                </select>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {tipoValorLocal === TipoValor.ACUMULADO ? 'Saldo acumulado até o mês (saldoAtual)' : 'Movimentação do mês (crédito - débito)'}
                </p>
              </div>
            </div>

            {/* 2. Períodos */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">2. Períodos para Comparação</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Período 1 */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Período 1 (Base)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        Mês
                      </label>
                      <select
                        value={mes1Local}
                        onChange={(e) => setMes1Local(Number(e.target.value))}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {meses.map((mes) => (
                          <option key={mes.value} value={mes.value}>
                            {mes.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        Ano
                      </label>
                      <select
                        value={ano1Local}
                        onChange={(e) => setAno1Local(Number(e.target.value))}
                        disabled={carregandoAnos}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {anosDisponiveis.map((ano) => (
                          <option key={ano} value={ano}>
                            {ano}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Período 2 */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Período 2 (Comparação)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        Mês
                      </label>
                      <select
                        value={mes2Local}
                        onChange={(e) => setMes2Local(Number(e.target.value))}
                        disabled={tipoComparacaoLocal !== TipoComparacao.CUSTOMIZADO}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {meses.map((mes) => (
                          <option key={mes.value} value={mes.value}>
                            {mes.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        Ano
                      </label>
                      <select
                        value={ano2Local}
                        onChange={(e) => setAno2Local(Number(e.target.value))}
                        disabled={carregandoAnos || tipoComparacaoLocal !== TipoComparacao.CUSTOMIZADO}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {anosDisponiveis.map((ano) => (
                          <option key={ano} value={ano}>
                            {ano}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {tipoComparacaoLocal !== TipoComparacao.CUSTOMIZADO && (
                    <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                      Ajustado automaticamente conforme o tipo de comparação
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Tipo de Relatório e Empresas */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">3. Escopo do Relatório</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tipo de Relatório
                  </label>
                  <select
                    value={tipoLocal}
                    onChange={(e) => setTipoLocal(e.target.value as TipoRelatorio)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="CONSOLIDADO">Consolidado</option>
                    <option value="FILIAL">Filial</option>
                  </select>
                </div>

                {tipoLocal === 'FILIAL' ? (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Empresa *
                    </label>
                    <select
                      value={empresaIdLocal}
                      onChange={(e) => setEmpresaIdLocal(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">Selecione uma empresa</option>
                      {empresasList.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.razaoSocial}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Empresas (opcional)
                    </label>
                    <div className="max-h-32 overflow-y-auto rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                      {empresasList.length === 0 ? (
                        <p className="text-[10px] text-slate-500">Nenhuma empresa disponível</p>
                      ) : (
                        empresasList.map((empresa) => (
                          <label key={empresa.id} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={empresaIdsLocal.includes(empresa.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEmpresaIdsLocal([...empresaIdsLocal, empresa.id]);
                                } else {
                                  setEmpresaIdsLocal(empresaIdsLocal.filter((id) => id !== empresa.id));
                                }
                              }}
                              className="h-3 w-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                            />
                            <span className="text-[10px]">{empresa.razaoSocial}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      Deixe vazio para incluir todas as empresas
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Filtro por Descrição */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                4. Filtro por Descrição (opcional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={descricaoLocal}
                  onChange={(e) => {
                    setDescricaoLocal(e.target.value);
                    setMostrarSugestoes(e.target.value.trim().length >= 2);
                  }}
                  onFocus={() => {
                    if (descricaoLocal.trim().length >= 2 && descricoesSugeridas.length > 0) {
                      setMostrarSugestoes(true);
                    }
                  }}
                  placeholder="Buscar por descrição da conta..."
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {mostrarSugestoes && descricoesSugeridas.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {carregandoDescricoes ? (
                      <div className="px-3 py-2 text-xs text-slate-500">Carregando...</div>
                    ) : (
                      descricoesSugeridas.map((desc, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setDescricaoLocal(desc);
                            setMostrarSugestoes(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {desc}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                Digite pelo menos 2 caracteres para ver sugestões
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={limparFiltros}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Limpar
              </button>
              <button
                onClick={aplicarFiltros}
                className="rounded-md bg-sky-500 px-4 py-2 text-xs font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                Filtrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Relatório */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Carregando relatório...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-200">
          Erro ao carregar relatório. Verifique os filtros e tente novamente.
        </div>
      )}

      {relatorio && !isLoading && (
        <div className="space-y-4">
          {/* Cabeçalho do relatório */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {relatorio.empresaNome}
                  {relatorio.uf && ` - ${relatorio.uf}`}
                </h2>
                <p className="text-sm text-slate-500">
                  Comparação: {relatorio.periodo1.label} vs {relatorio.periodo2.label}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Tipo de valor: <span className="font-medium">{tipoValor === TipoValor.ACUMULADO ? 'Acumulado' : 'Período'}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expandirTodosNiveis}
                    onChange={(e) => setExpandirTodosNiveis(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                    Expandir Níveis
                  </span>
                </label>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => exportarComparativoParaExcel(relatorio)}
                    className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    title="Exportar para Excel"
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                    Excel
                  </button>
                  <button
                    onClick={() => {
                      exportarComparativoParaPDF(relatorio).catch((error) => {
                        console.error('Erro ao exportar PDF:', error);
                        alert('Erro ao exportar PDF. Tente novamente.');
                      });
                    }}
                    className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    title="Exportar para PDF"
                  >
                    <FileText className="h-3 w-3" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Totais */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500">Total {relatorio.periodo1.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatarValor(relatorio.totais.periodo1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total {relatorio.periodo2.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatarValor(relatorio.totais.periodo2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Diferença</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatarValor(relatorio.totais.diferenca)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Variação %</p>
                <p
                  className={`mt-1 text-lg font-semibold ${getVariacaoClassName(relatorio.totais.percentual)}`}
                >
                  {formatarPercentual(relatorio.totais.percentual)}
                </p>
              </div>
            </div>
          </div>

          {/* Gráficos (Opcional) */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <button
              onClick={() => setMostrarGraficos(!mostrarGraficos)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Gráficos de Tendências
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">(Opcional)</span>
              </div>
              {mostrarGraficos ? (
                <ChevronUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            {mostrarGraficos && (
              <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                <div className="space-y-6">
                  {/* Gráfico de Barras - Comparação */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Comparação Lado a Lado (Top 10 Contas)
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="nome"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 9 }}
                          stroke="#64748b"
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          stroke="#64748b"
                          tickFormatter={(value) => {
                            if (Math.abs(value) >= 1000000) {
                              return `R$ ${(value / 1000000).toFixed(1)}M`;
                            } else if (Math.abs(value) >= 1000) {
                              return `R$ ${(value / 1000).toFixed(0)}k`;
                            }
                            return `R$ ${value.toFixed(0)}`;
                          }}
                        />
                        <Tooltip
                          formatter={(value: number) => formatarValor(value)}
                          labelFormatter={(label, payload) => {
                            if (payload && Array.isArray(payload) && payload[0]?.payload) {
                              const nomeCompleto = (payload[0].payload as { nomeCompleto?: string })?.nomeCompleto;
                              return nomeCompleto || label;
                            }
                            return label;
                          }}
                          labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '8px 12px',
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="periodo1"
                          name={relatorio.periodo1.label}
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="periodo2"
                          name={relatorio.periodo2.label}
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de Linha - Tendência */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tendência de Variação (Top 10 Contas)
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="nome"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 9 }}
                          stroke="#64748b"
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          stroke="#64748b"
                          tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
                        />
                        <Tooltip
                          formatter={(value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`}
                          labelFormatter={(label, payload) => {
                            if (payload && Array.isArray(payload) && payload[0]?.payload) {
                              const nomeCompleto = (payload[0].payload as { nomeCompleto?: string })?.nomeCompleto;
                              return nomeCompleto || label;
                            }
                            return label;
                          }}
                          labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '8px 12px',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="percentual"
                          name="Variação %"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse divide-y divide-slate-200 text-[10px] dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="sticky left-0 z-[52] bg-slate-50 border-r border-slate-200 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      Classificação
                    </th>
                    <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                      Descrição
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                      {relatorio.periodo1.label}
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                      {relatorio.periodo2.label}
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                      Diferença
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                      Variação %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900/70">
                  {renderizarContas(relatorio.contas)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatorioComparativoPage;

