'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAlertas, useUpdateAlertaStatus, useContagemPorTipoConta } from '@/hooks/use-alertas';
import { useEmpresas } from '@/hooks/use-empresas';
import { formatDateTime, getStatusLabel } from '@/lib/format';
import { maskCNPJ } from '@/lib/masks';
import type { AlertaStatus, AlertaTipo, AlertaSeveridade } from '@/types/api';
import { CheckCircle2, Clock, X, Search } from 'lucide-react';
import Link from 'next/link';

const AlertasPage = () => {
  const searchParams = useSearchParams();
  const uploadIdFromUrl = searchParams.get('uploadId');
  const alertaIdFromUrl = searchParams.get('alertaId');

  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [statusFiltro, setStatusFiltro] = useState<AlertaStatus | ''>('');
  const [tipoFiltro, setTipoFiltro] = useState<AlertaTipo | ''>('');
  const [severidadeFiltro, setSeveridadeFiltro] = useState<AlertaSeveridade | ''>('');
  const [tipoContaFiltro, setTipoContaFiltro] = useState<string>('');
  const [busca, setBusca] = useState<string>('');

  const { data: empresas } = useEmpresas();
  const updateStatusMutation = useUpdateAlertaStatus();

  // Construir filtros (sem tipoConta para contagem)
  const filtersBase = {
    ...(empresaFiltro && { empresaId: empresaFiltro }),
    ...(uploadIdFromUrl && { uploadId: uploadIdFromUrl }),
    ...(alertaIdFromUrl && { alertaId: alertaIdFromUrl }),
    ...(statusFiltro && { status: statusFiltro }),
    ...(tipoFiltro && { tipo: tipoFiltro }),
    ...(severidadeFiltro && { severidade: severidadeFiltro }),
    ...(busca && { busca }),
  };

  // Filtros completos (incluindo tipoConta)
  const filters = {
    ...filtersBase,
    ...(tipoContaFiltro && { tipoConta: tipoContaFiltro }),
  };

  // Buscar contagem por tipoConta (sem filtro de tipoConta)
  const { data: contagemPorTipoConta } = useContagemPorTipoConta(filtersBase);

  const { data: alertas, isLoading, error } = useAlertas(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const handleUpdateStatus = async (id: string, status: AlertaStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (error) {
      console.error('Erro ao atualizar status do alerta:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando alertas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar alertas. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  // Garantir que alertas seja sempre um array
  const alertasList = Array.isArray(alertas) ? alertas : [];
  const empresasList = Array.isArray(empresas) ? empresas : [];

  const hasActiveFilters = empresaFiltro || statusFiltro || tipoFiltro || severidadeFiltro || tipoContaFiltro || busca || uploadIdFromUrl || alertaIdFromUrl;

  // Função para limpar filtro de tipoConta
  const handleTipoContaClick = (tipoConta: string) => {
    if (tipoContaFiltro === tipoConta) {
      setTipoContaFiltro(''); // Se já está selecionado, remove o filtro
    } else {
      setTipoContaFiltro(tipoConta); // Caso contrário, aplica o filtro
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Alertas
        </h1>
        <p className="text-sm text-slate-500">
          Acompanhe divergências de saldo e contas inéditas detectadas nas importações.
        </p>
      </header>

      {/* Indicador de filtro por alerta específico */}
      {alertaIdFromUrl && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-3 shadow-sm dark:border-sky-800 dark:bg-sky-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
                Visualizando alerta específico
              </span>
              <span className="text-xs text-sky-600 dark:text-sky-400 font-mono">
                {alertaIdFromUrl.slice(0, 8)}...
              </span>
            </div>
            <Link
              href={uploadIdFromUrl ? `/alertas?uploadId=${uploadIdFromUrl}` : '/alertas'}
              className="text-xs font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 underline"
            >
              Ver todos os alertas
            </Link>
          </div>
        </section>
      )}

      {/* Indicador de filtro por upload */}
      {uploadIdFromUrl && !alertaIdFromUrl && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-3 shadow-sm dark:border-sky-800 dark:bg-sky-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
                Filtrado por upload específico
              </span>
              <span className="text-xs text-sky-600 dark:text-sky-400 font-mono">
                {uploadIdFromUrl.slice(0, 8)}...
              </span>
            </div>
            <Link
              href="/alertas"
              className="text-xs font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 underline"
            >
              Remover filtro
            </Link>
          </div>
        </section>
      )}

      {/* Contadores por Tipo de Conta */}
      {contagemPorTipoConta && contagemPorTipoConta.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
            Alertas por Tipo de Conta
          </h2>
          <div className="flex flex-wrap gap-2">
            {contagemPorTipoConta.map((item) => (
              <button
                key={item.tipoConta}
                onClick={() => handleTipoContaClick(item.tipoConta)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  tipoContaFiltro === item.tipoConta
                    ? 'bg-sky-500 text-white shadow-sm hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                title={`Clique para ${tipoContaFiltro === item.tipoConta ? 'remover' : 'aplicar'} filtro por ${item.tipoConta}`}
              >
                <span>{item.tipoConta}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    tipoContaFiltro === item.tipoConta
                      ? 'bg-white/20 text-white'
                      : 'bg-sky-500 text-white dark:bg-sky-600'
                  }`}
                >
                  {item.quantidade}
                </span>
              </button>
            ))}
          </div>
          {tipoContaFiltro && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Filtrado por: <strong className="text-slate-700 dark:text-slate-300">{tipoContaFiltro}</strong>
              </span>
              <button
                onClick={() => setTipoContaFiltro('')}
                className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 underline"
              >
                Remover filtro
              </button>
            </div>
          )}
        </section>
      )}

      {/* Filtros e Busca */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por mensagem, classificação ou nome da conta..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Filtros em Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filtro por Empresa */}
            <div>
              <label htmlFor="empresa-filtro" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Empresa
              </label>
              <select
                id="empresa-filtro"
                value={empresaFiltro}
                onChange={(e) => setEmpresaFiltro(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todas</option>
                {empresasList.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razaoSocial} {empresa.nomeFantasia ? `(${empresa.nomeFantasia})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Status */}
            <div>
              <label htmlFor="status-filtro" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                id="status-filtro"
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value as AlertaStatus | '')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todos</option>
                <option value="ABERTO">Aberto</option>
                <option value="EM_ANALISE">Em análise</option>
                <option value="RESOLVIDO">Resolvido</option>
              </select>
            </div>

            {/* Filtro por Tipo */}
            <div>
              <label htmlFor="tipo-filtro" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Tipo
              </label>
              <select
                id="tipo-filtro"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as AlertaTipo | '')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todos</option>
                <option value="SALDO_DIVERGENTE">Saldo divergente</option>
                <option value="CONTA_NOVA">Conta nova</option>
                <option value="DADO_INCONSISTENTE">Dado inconsistente</option>
                <option value="CABECALHO_ALTERADO">Cabeçalho alterado</option>
              </select>
            </div>

            {/* Filtro por Severidade */}
            <div>
              <label htmlFor="severidade-filtro" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Severidade
              </label>
              <select
                id="severidade-filtro"
                value={severidadeFiltro}
                onChange={(e) => setSeveridadeFiltro(e.target.value as AlertaSeveridade | '')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todas</option>
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>

          {/* Contador e Limpar Filtros */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {alertasList.length} alerta(s) encontrado(s)
            </span>
            {hasActiveFilters && (
              <Link
                href="/alertas"
                className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
              >
                Limpar filtros
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Tabela de Alertas */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {alertasList.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {hasActiveFilters
              ? 'Nenhum alerta encontrado com os filtros aplicados.'
              : 'Nenhum alerta encontrado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-800">
              <thead className="bg-slate-50/60 dark:bg-slate-900/80">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-20">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-32">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-28">Tipo Conta</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 min-w-[200px] max-w-[300px]">
                    Detalhe
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 min-w-[180px] max-w-[250px]">Empresa</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-24">Severidade</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-28">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 min-w-[140px]">
                    Criado em
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {alertasList.map((alerta) => {
                  const detalheTexto = alerta.linha
                    ? `${alerta.linha.classificacao} - ${alerta.linha.nomeConta}`
                    : alerta.mensagem;
                  const empresaTexto = alerta.upload?.empresa?.razaoSocial || 'N/A';
                  const empresaCompleto = alerta.upload?.empresa
                    ? `${alerta.upload.empresa.razaoSocial}${alerta.upload.empresa.nomeFantasia ? ` (${alerta.upload.empresa.nomeFantasia})` : ''}${alerta.upload.empresa.cnpj ? ` - ${maskCNPJ(alerta.upload.empresa.cnpj)}` : ''}`
                    : 'N/A';

                  return (
                    <tr key={alerta.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900">
                      <td className="px-3 py-2 font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
                        {alerta.id.slice(0, 8)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {getStatusLabel(alerta.tipo)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {alerta.linha?.tipoConta ? (
                          <button
                            onClick={() => handleTipoContaClick(alerta.linha!.tipoConta)}
                            className={`text-xs font-medium transition-colors ${
                              tipoContaFiltro === alerta.linha!.tipoConta
                                ? 'text-sky-600 underline dark:text-sky-400'
                                : 'text-slate-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400'
                            }`}
                            title={`Clique para filtrar por ${alerta.linha!.tipoConta}`}
                          >
                            {alerta.linha.tipoConta}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">N/A</span>
                        )}
                      </td>
                      <td 
                        className="px-3 py-2 max-w-[300px]"
                        title={detalheTexto}
                      >
                        <div className="truncate text-xs text-slate-700 dark:text-slate-300">
                          {detalheTexto}
                        </div>
                      </td>
                      <td 
                        className="px-3 py-2 max-w-[250px]"
                        title={empresaCompleto}
                      >
                        <div className="truncate text-xs text-slate-700 dark:text-slate-300">
                          {empresaTexto}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            alerta.severidade === 'ALTA'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200'
                              : alerta.severidade === 'MEDIA'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200'
                          }`}
                        >
                          {getStatusLabel(alerta.severidade)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            alerta.status === 'ABERTO'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200'
                              : alerta.status === 'EM_ANALISE'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                          }`}
                        >
                          {getStatusLabel(alerta.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(alerta.createdAt)}
                      </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {alerta.status === 'ABERTO' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(alerta.id, 'EM_ANALISE')}
                              disabled={updateStatusMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-400/20 dark:text-amber-200 dark:hover:bg-amber-400/30 whitespace-nowrap"
                              title="Marcar como em análise"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span>Em análise</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(alerta.id, 'RESOLVIDO')}
                              disabled={updateStatusMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-400/20 dark:text-emerald-200 dark:hover:bg-emerald-400/30 whitespace-nowrap"
                              title="Marcar como resolvido"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Resolver</span>
                            </button>
                          </>
                        )}
                        {alerta.status === 'EM_ANALISE' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(alerta.id, 'ABERTO')}
                              disabled={updateStatusMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 whitespace-nowrap"
                              title="Reabrir alerta"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reabrir</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(alerta.id, 'RESOLVIDO')}
                              disabled={updateStatusMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-400/20 dark:text-emerald-200 dark:hover:bg-emerald-400/30 whitespace-nowrap"
                              title="Marcar como resolvido"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Resolver</span>
                            </button>
                          </>
                        )}
                        {alerta.status === 'RESOLVIDO' && (
                          <button
                            onClick={() => handleUpdateStatus(alerta.id, 'ABERTO')}
                            disabled={updateStatusMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 whitespace-nowrap"
                            title="Reabrir alerta"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reabrir</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AlertasPage;
