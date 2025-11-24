'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  BarChart3,
  Filter,
  XCircle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAlertaDetalhes, useUpdateAlertaStatus } from '@/hooks/use-alertas';
import { formatDateTime, getStatusLabel } from '@/lib/format';
import { maskCNPJ } from '@/lib/masks';
import type { AlertaStatus } from '@/types/api';

type AlertaDetalheProps = {
  params: Promise<{ id: string }>;
};

const tipoLabels: Record<string, string> = {
  SALDO_DIVERGENTE: 'Saldo Divergente',
  CONTA_NOVA: 'Conta Nova',
  DADO_INCONSISTENTE: 'Dado Inconsistente',
  CABECALHO_ALTERADO: 'Cabeçalho Alterado',
  CONTINUIDADE_TEMPORAL_DIVERGENTE: 'Continuidade Temporal Divergente',
};

const severidadeColors: Record<string, string> = {
  BAIXA: 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200',
  MEDIA: 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200',
  ALTA: 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200',
};

const statusColors: Record<string, string> = {
  ABERTO: 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200',
  EM_ANALISE: 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200',
  RESOLVIDO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200',
};

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

export default function AlertaDetalhePage({ params }: AlertaDetalheProps) {
  const { id } = use(params);
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'visao-geral' | 'historico' | 'comparacao' | 'acoes'>('visao-geral');

  // Filtros do histórico
  const [anoInicio, setAnoInicio] = useState<number | ''>('');
  const [anoFim, setAnoFim] = useState<number | ''>('');
  const [mesInicio, setMesInicio] = useState<number | ''>('');
  const [mesFim, setMesFim] = useState<number | ''>('');
  const [apenasComAlerta, setApenasComAlerta] = useState<boolean>(false);
  const [tipoDado, setTipoDado] = useState<'saldoAtual' | 'saldoAnterior' | 'debito' | 'credito'>('saldoAtual');

  const { data: detalhes, isLoading, error } = useAlertaDetalhes(id);
  const updateStatusMutation = useUpdateAlertaStatus();

  const handleUpdateStatus = async (status: AlertaStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (error) {
      console.error('Erro ao atualizar status do alerta:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando detalhes do alerta...</div>
      </div>
    );
  }

  if (error || !detalhes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar alerta. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  const { alerta, historico, estatisticas, comparacaoTemporal, alertasRelacionados } = detalhes;

  // Filtrar histórico baseado nos filtros
  const historicoFiltrado = useMemo(() => {
    if (!historico || historico.length === 0) return [];

    let filtrado = [...historico];

    // Filtro por ano inicial
    if (anoInicio) {
      filtrado = filtrado.filter((item) => item.ano >= Number(anoInicio));
    }

    // Filtro por ano final
    if (anoFim) {
      filtrado = filtrado.filter((item) => item.ano <= Number(anoFim));
    }

    // Filtro por mês inicial (se ano inicial estiver definido)
    if (mesInicio && anoInicio) {
      filtrado = filtrado.filter(
        (item) => item.ano > Number(anoInicio) || (item.ano === Number(anoInicio) && item.mes >= Number(mesInicio)),
      );
    }

    // Filtro por mês final (se ano final estiver definido)
    if (mesFim && anoFim) {
      filtrado = filtrado.filter(
        (item) => item.ano < Number(anoFim) || (item.ano === Number(anoFim) && item.mes <= Number(mesFim)),
      );
    }

    // Filtro por presença de alertas
    if (apenasComAlerta) {
      filtrado = filtrado.filter((item) => item.temAlerta);
    }

    return filtrado.sort((a, b) => {
      if (a.ano !== b.ano) return b.ano - a.ano;
      return b.mes - a.mes;
    });
  }, [historico, anoInicio, anoFim, mesInicio, mesFim, apenasComAlerta]);

  // Calcular estatísticas do histórico filtrado
  const estatisticasFiltradas = useMemo(() => {
    if (!historicoFiltrado || historicoFiltrado.length === 0) return null;

    const valores = historicoFiltrado.map((h) => h[tipoDado]);
    const valorMedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    const valorMaximo = Math.max(...valores);
    const valorMinimo = Math.min(...valores);

    // Calcular variação média
    let variacaoMedia = 0;
    if (valores.length > 1) {
      const variacoes: number[] = [];
      for (let i = 1; i < valores.length; i++) {
        const anterior = valores[i];
        const atual = valores[i - 1];
        if (anterior !== 0) {
          variacoes.push(((atual - anterior) / Math.abs(anterior)) * 100);
        }
      }
      variacaoMedia = variacoes.length > 0 ? variacoes.reduce((a, b) => a + b, 0) / variacoes.length : 0;
    }

    // Determinar tendência
    let tendencia: 'CRESCENTE' | 'DECRESCENTE' | 'ESTAVEL' = 'ESTAVEL';
    if (valores.length >= 3) {
      const ultimos3 = valores.slice(0, 3);
      const mediaUltimos3 = ultimos3.reduce((a, b) => a + b, 0) / 3;
      const mediaAnteriores =
        valores.slice(3, 6).length > 0
          ? valores.slice(3, 6).reduce((a, b) => a + b, 0) / valores.slice(3, 6).length
          : mediaUltimos3;

      if (mediaUltimos3 > mediaAnteriores * 1.05) {
        tendencia = 'CRESCENTE';
      } else if (mediaUltimos3 < mediaAnteriores * 0.95) {
        tendencia = 'DECRESCENTE';
      }
    }

    return {
      valorMedio,
      valorMaximo,
      valorMinimo,
      variacaoMedia,
      tendencia,
    };
  }, [historicoFiltrado, tipoDado]);

  // Obter anos únicos do histórico para os filtros
  const anosDisponiveis = useMemo(() => {
    if (!historico) return [];
    const anos = new Set(historico.map((h) => h.ano));
    return Array.from(anos).sort((a, b) => b - a);
  }, [historico]);

  const limparFiltros = () => {
    setAnoInicio('');
    setAnoFim('');
    setMesInicio('');
    setMesFim('');
    setApenasComAlerta(false);
    setTipoDado('saldoAtual');
  };

  const temFiltrosAtivos = anoInicio || anoFim || mesInicio || mesFim || apenasComAlerta;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link
            href="/alertas"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Alertas
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Detalhes do Alerta
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${severidadeColors[alerta.severidade]}`}>
              {getStatusLabel(alerta.severidade)}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[alerta.status]}`}>
              {getStatusLabel(alerta.status)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{tipoLabels[alerta.tipo] || alerta.tipo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime(alerta.createdAt)}</span>
            </div>
            {alerta.upload?.empresa && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <Link
                  href={`/alertas?empresaId=${alerta.upload.empresa?.id}`}
                  className="hover:text-sky-600 dark:hover:text-sky-400"
                >
                  {alerta.upload.empresa.razaoSocial}
                </Link>
              </div>
            )}
            {alerta.upload && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <Link
                  href={`/uploads/${alerta.upload.id}`}
                  className="hover:text-sky-600 dark:hover:text-sky-400"
                >
                  {alerta.upload.mes}/{alerta.upload.ano}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mensagem do Alerta */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">Mensagem do Alerta</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{alerta.mensagem}</p>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-1">
          {[
            { id: 'visao-geral', label: 'Visão Geral' },
            { id: 'historico', label: 'Histórico' },
            { id: 'comparacao', label: 'Comparação' },
            { id: 'acoes', label: 'Ações' },
          ].map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id as any)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                abaAtiva === aba.id
                  ? 'border-b-2 border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      <div className="space-y-6">
        {abaAtiva === 'visao-geral' && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                Informações Básicas
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">ID</label>
                  <p className="text-sm font-mono text-slate-900 dark:text-slate-50">{alerta.id}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo</label>
                  <p className="text-sm text-slate-900 dark:text-slate-50">
                    {tipoLabels[alerta.tipo] || alerta.tipo}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Severidade</label>
                  <p className="text-sm text-slate-900 dark:text-slate-50">
                    {getStatusLabel(alerta.severidade)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
                  <p className="text-sm text-slate-900 dark:text-slate-50">
                    {getStatusLabel(alerta.status)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Criado em</label>
                  <p className="text-sm text-slate-900 dark:text-slate-50">
                    {formatDateTime(alerta.createdAt)}
                  </p>
                </div>
                {alerta.resolvedAt && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Resolvido em
                    </label>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {formatDateTime(alerta.resolvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Dados da Linha */}
            {alerta.linha && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Dados da Conta
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Classificação
                    </label>
                    <Link
                      href={(() => {
                        const params = new URLSearchParams();
                        params.append('classificacaoPrefix', alerta.linha.classificacao);
                        if (alerta.linha.tipoConta) {
                          params.append('tipoConta', alerta.linha.tipoConta);
                        }
                        // Adicionar conta e subConta se disponíveis para busca mais precisa
                        if (alerta.linha.conta) {
                          params.append('conta', alerta.linha.conta);
                        }
                        if (alerta.linha.subConta) {
                          params.append('subConta', alerta.linha.subConta);
                        }
                        return `/contas?${params.toString()}`;
                      })()}
                      className="text-sm font-mono text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 underline inline-block transition-colors"
                      title="Clique para ver detalhes desta conta no catálogo"
                    >
                      {alerta.linha.classificacao}
                    </Link>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Clique para ver no catálogo de contas
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Nome da Conta
                    </label>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {alerta.linha.nomeConta}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Tipo de Conta
                    </label>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {alerta.linha.tipoConta || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nível</label>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {alerta.linha.nivel || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Saldo Anterior
                    </label>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(alerta.linha.saldoAnterior || 0))}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Débito</label>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(alerta.linha.debito || 0))}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Crédito</label>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(alerta.linha.credito || 0))}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Saldo Atual
                    </label>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(alerta.linha.saldoAtual || 0))}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Comparação Temporal (se disponível) */}
            {comparacaoTemporal && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-800 dark:bg-amber-900/20">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Comparação Temporal
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-slate-900/70">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Mês Anterior ({comparacaoTemporal.mesAnterior.mes}/{comparacaoTemporal.mesAnterior.ano})
                    </label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(comparacaoTemporal.mesAnterior.saldoAtual)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Saldo Atual</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-slate-900/70">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Mês Atual ({comparacaoTemporal.mesAtual.mes}/{comparacaoTemporal.mesAtual.ano})
                    </label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(comparacaoTemporal.mesAtual.saldoAnterior)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Saldo Anterior</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-100 p-4 dark:border-amber-700 dark:bg-amber-900/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      Diferença Detectada:
                    </span>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(comparacaoTemporal.diferenca)}{' '}
                      ({comparacaoTemporal.percentual > 0 ? '+' : ''}
                      {comparacaoTemporal.percentual.toFixed(2)}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    ⚠️ Alteração retroativa detectada. O saldo do mês anterior foi modificado.
                  </p>
                </div>
              </section>
            )}
          </div>
        )}

        {abaAtiva === 'historico' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Histórico e Estatísticas
              </h2>
              {temFiltrosAtivos && (
                <button
                  onClick={limparFiltros}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Limpar Filtros
                </button>
              )}
            </div>

            {/* Filtros Avançados */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Filtros Avançados</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Tipo de Dado */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tipo de Dado
                  </label>
                  <select
                    value={tipoDado}
                    onChange={(e) => setTipoDado(e.target.value as any)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="saldoAtual">Saldo Atual</option>
                    <option value="saldoAnterior">Saldo Anterior</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>

                {/* Ano Início */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ano Início
                  </label>
                  <select
                    value={anoInicio}
                    onChange={(e) => setAnoInicio(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Todos</option>
                    {anosDisponiveis.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ano Fim */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ano Fim
                  </label>
                  <select
                    value={anoFim}
                    onChange={(e) => setAnoFim(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Todos</option>
                    {anosDisponiveis.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mês Início */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Mês Início
                  </label>
                  <select
                    value={mesInicio}
                    onChange={(e) => setMesInicio(e.target.value ? Number(e.target.value) : '')}
                    disabled={!anoInicio}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Todos</option>
                    {meses.map((mes) => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mês Fim */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Mês Fim
                  </label>
                  <select
                    value={mesFim}
                    onChange={(e) => setMesFim(e.target.value ? Number(e.target.value) : '')}
                    disabled={!anoFim}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Todos</option>
                    {meses.map((mes) => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Apenas com Alerta */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apenasComAlerta}
                      onChange={(e) => setApenasComAlerta(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Apenas meses com alertas
                    </span>
                  </label>
                </div>
              </div>
              {temFiltrosAtivos && (
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Mostrando {historicoFiltrado.length} de {historico?.length || 0} registro(s)
                </div>
              )}
            </div>

            {historicoFiltrado && historicoFiltrado.length > 0 ? (
              <div className="space-y-6">
                {/* Gráfico de Evolução */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-sky-600" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Evolução do {tipoDado === 'saldoAtual' ? 'Saldo Atual' : tipoDado === 'saldoAnterior' ? 'Saldo Anterior' : tipoDado === 'debito' ? 'Débito' : 'Crédito'} ({historicoFiltrado.length} {historicoFiltrado.length === 1 ? 'mês' : 'meses'})
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={historicoFiltrado
                        .slice()
                        .reverse()
                        .map((item) => ({
                          periodo: `${item.mes}/${item.ano}`,
                          saldoAtual: item.saldoAtual,
                          saldoAnterior: item.saldoAnterior,
                          debito: item.debito,
                          credito: item.credito,
                          temAlerta: item.temAlerta,
                        }))}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                      <XAxis
                        dataKey="periodo"
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fill: 'currentColor' }}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            notation: 'compact',
                            maximumFractionDigits: 0,
                          }).format(value)
                        }
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(value)
                        }
                        contentStyle={{
                          backgroundColor: 'var(--slate-900)',
                          border: '1px solid var(--slate-700)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      {tipoDado === 'saldoAtual' && (
                        <Line
                          type="monotone"
                          dataKey="saldoAtual"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          name="Saldo Atual"
                          dot={{ r: 4, fill: '#0ea5e9' }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {tipoDado === 'saldoAnterior' && (
                        <Line
                          type="monotone"
                          dataKey="saldoAnterior"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          name="Saldo Anterior"
                          dot={{ r: 4, fill: '#94a3b8' }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {tipoDado === 'debito' && (
                        <Line
                          type="monotone"
                          dataKey="debito"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Débito"
                          dot={{ r: 4, fill: '#ef4444' }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {tipoDado === 'credito' && (
                        <Line
                          type="monotone"
                          dataKey="credito"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Crédito"
                          dot={{ r: 4, fill: '#10b981' }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {historicoFiltrado
                        .slice()
                        .reverse()
                        .map((item, index) =>
                          item.temAlerta ? (
                            <ReferenceLine
                              key={`alert-${index}`}
                              x={`${item.mes}/${item.ano}`}
                              stroke="#f59e0b"
                              strokeDasharray="3 3"
                              label={{ value: 'Alerta', position: 'top', fill: '#f59e0b' }}
                            />
                          ) : null,
                        )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {estatisticasFiltradas && (
                  <div className="grid gap-4 sm:grid-cols-4 mb-6">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Valor Médio
                      </label>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(estatisticasFiltradas.valorMedio)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Máximo</label>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(estatisticasFiltradas.valorMaximo)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Mínimo</label>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(estatisticasFiltradas.valorMinimo)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tendência</label>
                      <div className="flex items-center gap-2 mt-1">
                        {estatisticasFiltradas.tendencia === 'CRESCENTE' && (
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                        )}
                        {estatisticasFiltradas.tendencia === 'DECRESCENTE' && (
                          <TrendingDown className="w-5 h-5 text-rose-600" />
                        )}
                        {estatisticasFiltradas.tendencia === 'ESTAVEL' && (
                          <Minus className="w-5 h-5 text-slate-400" />
                        )}
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                          {estatisticasFiltradas.tendencia === 'CRESCENTE'
                            ? 'Crescente'
                            : estatisticasFiltradas.tendencia === 'DECRESCENTE'
                              ? 'Decrescente'
                              : 'Estável'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900/80">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Mês/Ano</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                          Saldo Anterior
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Débito</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Crédito</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Saldo Atual</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {historicoFiltrado.map((item, index) => (
                        <tr
                          key={`${item.ano}-${item.mes}`}
                          className={index === 0 ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
                        >
                          <td className="px-3 py-2 whitespace-nowrap text-slate-900 dark:text-slate-50">
                            {item.mes}/{item.ano}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(item.saldoAnterior)}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(item.debito)}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(item.credito)}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-50">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(item.saldoAtual)}
                          </td>
                          <td className="px-3 py-2">
                            {item.temAlerta ? (
                              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200">
                                Alerta
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200">
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : historico && historico.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                  Nenhum resultado encontrado
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Nenhum registro corresponde aos filtros aplicados. Tente ajustar os filtros ou{' '}
                  <button
                    onClick={limparFiltros}
                    className="text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 underline"
                  >
                    limpar os filtros
                  </button>
                  .
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nenhum histórico disponível para esta conta.</p>
            )}
          </div>
        )}

        {abaAtiva === 'comparacao' && (
          <div className="space-y-6">
            {/* Comparação Temporal */}
            {comparacaoTemporal ? (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-800 dark:bg-amber-900/20">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Comparação Temporal
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div className="rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-slate-900/70">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Mês Anterior ({comparacaoTemporal.mesAnterior.mes}/{comparacaoTemporal.mesAnterior.ano})
                    </label>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(comparacaoTemporal.mesAnterior.saldoAtual)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Saldo Atual do Mês Anterior</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-slate-900/70">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Mês Atual ({comparacaoTemporal.mesAtual.mes}/{comparacaoTemporal.mesAtual.ano})
                    </label>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(comparacaoTemporal.mesAtual.saldoAnterior)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Saldo Anterior do Mês Atual</p>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-300 bg-amber-100 p-4 dark:border-amber-700 dark:bg-amber-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Diferença Detectada:
                    </span>
                    <span
                      className={`text-xl font-bold ${
                        comparacaoTemporal.diferenca > 0
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(comparacaoTemporal.diferenca)}{' '}
                      ({comparacaoTemporal.percentual > 0 ? '+' : ''}
                      {comparacaoTemporal.percentual.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      ⚠️ Alteração Retroativa Detectada
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      O saldo do mês anterior foi modificado retroativamente. Isso pode indicar:
                    </p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside ml-2 space-y-1">
                      <li>Correção de lançamento contábil</li>
                      <li>Ajuste de saldo anterior</li>
                      <li>Reclassificação de contas</li>
                      <li>Erro corrigido na contabilidade</li>
                    </ul>
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Comparação Temporal
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Comparação temporal disponível apenas para alertas do tipo{' '}
                  <strong>Continuidade Temporal Divergente</strong>.
                </p>
              </section>
            )}

            {/* Análise de Padrões */}
            {estatisticas && historico && historico.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Análise de Padrões
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Variação Média Mensal
                    </label>
                    <p
                      className={`text-xl font-bold mt-1 ${
                        estatisticas.variacaoMedia > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : estatisticas.variacaoMedia < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {estatisticas.variacaoMedia > 0 ? '+' : ''}
                      {estatisticas.variacaoMedia.toFixed(2)}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Média das variações entre meses consecutivos
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tendência</label>
                    <div className="flex items-center gap-2 mt-1">
                      {estatisticas.tendencia === 'CRESCENTE' && (
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                      )}
                      {estatisticas.tendencia === 'DECRESCENTE' && (
                        <TrendingDown className="w-6 h-6 text-rose-600" />
                      )}
                      {estatisticas.tendencia === 'ESTAVEL' && (
                        <Minus className="w-6 h-6 text-slate-400" />
                      )}
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
                        {estatisticas.tendencia === 'CRESCENTE'
                          ? 'Crescente'
                          : estatisticas.tendencia === 'DECRESCENTE'
                            ? 'Decrescente'
                            : 'Estável'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Baseado nos últimos 3 meses vs. anteriores
                    </p>
                  </div>
                </div>

                {/* Alertas no Histórico */}
                {historico.filter((h) => h.temAlerta).length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                      ⚠️ Alertas no Histórico
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Esta conta teve{' '}
                      <strong>
                        {historico.filter((h) => h.temAlerta).length} alerta(s) nos últimos 12 meses
                      </strong>
                      . Isso pode indicar um padrão de inconsistências que requer atenção.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Comparação com Valores Médios */}
            {estatisticas && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Comparação com Valores Médios
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Valor Atual</label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                      {historico && historico.length > 0
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(historico[0].saldoAtual)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Valor Médio</label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(estatisticas.valorMedio)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Desvio</label>
                    <p
                      className={`text-lg font-semibold mt-1 ${
                        historico && historico.length > 0
                          ? Math.abs(historico[0].saldoAtual - estatisticas.valorMedio) >
                              estatisticas.valorMedio * 0.2
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-slate-50'
                          : 'text-slate-900 dark:text-slate-50'
                      }`}
                    >
                      {historico && historico.length > 0
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(historico[0].saldoAtual - estatisticas.valorMedio)
                        : 'N/A'}
                    </p>
                    {historico &&
                      historico.length > 0 &&
                      Math.abs(historico[0].saldoAtual - estatisticas.valorMedio) >
                        estatisticas.valorMedio * 0.2 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          ⚠️ Desvio significativo da média
                        </p>
                      )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {abaAtiva === 'acoes' && (
          <div className="space-y-6">
            {/* Ações de Status */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                Alterar Status
              </h2>
              <div className="flex flex-wrap gap-3">
                {alerta.status === 'ABERTO' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('EM_ANALISE')}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-400/20 dark:text-amber-200 dark:hover:bg-amber-400/30"
                    >
                      <Clock className="h-4 w-4" />
                      Marcar como Em Análise
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('RESOLVIDO')}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-400/20 dark:text-emerald-200 dark:hover:bg-emerald-400/30"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar como Resolvido
                    </button>
                  </>
                )}
                {alerta.status === 'EM_ANALISE' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('ABERTO')}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    >
                      <X className="h-4 w-4" />
                      Reabrir Alerta
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('RESOLVIDO')}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-400/20 dark:text-emerald-200 dark:hover:bg-emerald-400/30"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar como Resolvido
                    </button>
                  </>
                )}
                {alerta.status === 'RESOLVIDO' && (
                  <button
                    onClick={() => handleUpdateStatus('ABERTO')}
                    disabled={updateStatusMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    <X className="h-4 w-4" />
                    Reabrir Alerta
                  </button>
                )}
              </div>
            </section>

            {/* Alertas Relacionados */}
            {alertasRelacionados && alertasRelacionados.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Alertas Relacionados ({alertasRelacionados.length})
                </h2>
                <div className="space-y-2">
                  {alertasRelacionados.map((alertaRel) => (
                    <Link
                      key={alertaRel.id}
                      href={`/alertas/${alertaRel.id}`}
                      className="block rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {tipoLabels[alertaRel.tipo] || alertaRel.tipo}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {alertaRel.upload?.mes}/{alertaRel.upload?.ano} -{' '}
                            {alertaRel.upload?.empresa?.razaoSocial}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[alertaRel.status]}`}
                        >
                          {getStatusLabel(alertaRel.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

