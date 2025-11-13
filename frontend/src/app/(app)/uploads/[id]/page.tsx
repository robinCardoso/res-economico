'use client';

import Link from 'next/link';
import { use } from 'react';
import { useUpload } from '@/hooks/use-uploads';
import { formatPeriodo, getStatusLabel } from '@/lib/format';

type UploadDetalheProps = {
  params: Promise<{ id: string }>;
};

const UploadDetalhePage = ({ params }: UploadDetalheProps) => {
  const { id } = use(params);
  const { data: upload, isLoading, error } = useUpload(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando detalhes do upload...</div>
      </div>
    );
  }

  if (error || !upload) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar upload. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  const alertasPendentes = upload.alertas?.filter((a) => a.status === 'ABERTO') || [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Upload {id.slice(0, 8)}
          </h1>
          <p className="text-sm text-slate-500">
            Resumo do processamento, alertas detectados e histórico de alterações.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Reprocessar
          </button>
          <button className="rounded-md border border-rose-400 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10 dark:border-rose-500/60 dark:text-rose-300">
            Remover upload
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Informações gerais
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <dt>Filial</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {upload.filial?.nome || 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Período</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {formatPeriodo(upload.mes, upload.ano)}
              </dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Linhas</dt>
              <dd className="text-slate-900 dark:text-slate-100">{upload.totalLinhas}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Alertas</dt>
              <dd className={alertasPendentes.length > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-slate-100'}>
                {alertasPendentes.length} pendentes
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Alertas detectados
          </h2>
          {!upload.alertas || upload.alertas.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">Nenhum alerta encontrado.</div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {upload.alertas.map((alerta) => (
                <li
                  key={alerta.id}
                  className={`rounded-lg border p-4 ${
                    alerta.severidade === 'ALTA'
                      ? 'border-rose-300/60 bg-rose-50/60 dark:border-rose-400/30 dark:bg-rose-400/10'
                      : alerta.tipo === 'CONTA_NOVA'
                        ? 'border-sky-300/60 bg-sky-50/60 dark:border-sky-400/30 dark:bg-sky-400/10'
                        : 'border-amber-300/60 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-400/10'
                  }`}
                >
                  {alerta.linha
                    ? `${getStatusLabel(alerta.tipo)} na conta ${alerta.linha.classificacao} - ${alerta.linha.nomeConta}`
                    : alerta.mensagem}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Histórico do upload
          </h2>
          <Link
            href="/uploads"
            className="text-xs font-medium text-sky-500 hover:text-sky-400"
          >
            Voltar para lista
          </Link>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          {upload.linhas && upload.linhas.length > 0 ? (
            <div>
              Total de linhas: {upload.linhas.length}. Visualização detalhada em
              desenvolvimento.
            </div>
          ) : (
            <div>Visualização detalhada das linhas importadas em desenvolvimento.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UploadDetalhePage;

