'use client';

import { ArrowUpRight, BellRing, FileSpreadsheet, Layers3 } from 'lucide-react';
import Link from 'next/link';
import { useUploads } from '@/hooks/use-uploads';
import { useAlertas } from '@/hooks/use-alertas';
import { useContas } from '@/hooks/use-contas';
import { formatPeriodo, formatDateTime } from '@/lib/format';

const DashboardPage = () => {
  const { data: uploads, isLoading: isLoadingUploads } = useUploads();
  const { data: alertas, isLoading: isLoadingAlertas } = useAlertas();
  const { data: contas, isLoading: isLoadingContas } = useContas();

  const isLoading = isLoadingUploads || isLoadingAlertas || isLoadingContas;

  // Calcular estatísticas
  const uploadsList = Array.isArray(uploads) ? uploads : [];
  const alertasList = Array.isArray(alertas) ? alertas : [];
  const contasList = Array.isArray(contas) ? contas : [];

  const ultimoUpload = uploadsList[0];
  const alertasAbertos = alertasList.filter((a) => a.status === 'ABERTO');
  const alertasCriticos = alertasAbertos.filter((a) => a.severidade === 'ALTA');
  const contasNovas = contasList.filter((c) => c.status === 'NOVA');

  const stats = [
    {
      name: 'Upload mais recente',
      value: ultimoUpload
        ? formatPeriodo(ultimoUpload.mes, ultimoUpload.ano)
        : 'Nenhum',
      change: ultimoUpload ? `${ultimoUpload.totalLinhas} linhas` : 'Comece fazendo upload',
      icon: FileSpreadsheet,
      link: ultimoUpload ? `/uploads/${ultimoUpload.id}` : '/uploads/novo',
    },
    {
      name: 'Alertas abertos',
      value: alertasAbertos.length.toString(),
      change: alertasCriticos.length > 0 ? `${alertasCriticos.length} críticos` : 'Todos resolvidos',
      icon: BellRing,
      link: '/alertas',
    },
    {
      name: 'Contas em análise',
      value: contasNovas.length.toString(),
      change: contasNovas.length > 0 ? `${contasNovas.length} novas` : 'Nenhuma nova',
      icon: Layers3,
      link: '/contas',
    },
  ];

  // Últimas atividades (últimos uploads e alertas)
  const recentActivities = [
    ...uploadsList.slice(0, 3).map((upload) => ({
      title: `Upload - ${upload.empresa?.razaoSocial || 'N/A'}`,
      subtitle: `Processado em ${formatDateTime(upload.createdAt)} - ${upload.totalLinhas} linhas`,
      link: `/uploads/${upload.id}`,
    })),
    ...alertasAbertos.slice(0, 2).map((alerta) => ({
      title: `Alerta: ${alerta.tipo}`,
      subtitle: alerta.mensagem.substring(0, 60) + (alerta.mensagem.length > 60 ? '...' : ''),
      link: '/alertas',
    })),
  ].slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Visão Geral
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Acompanhe rapidamente os uploads e alertas do resultado econômico.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {item.value}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-500">
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                    {item.change}
                  </span>
                </div>
                <span className="rounded-full bg-sky-500/10 p-3 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </div>
          );

          return item.link ? (
            <Link key={item.name} href={item.link}>
              {content}
            </Link>
          ) : (
            <div key={item.name}>{content}</div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Últimas atividades
          </h2>
          {recentActivities.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {recentActivities.map((activity, index) => {
                const content = (
                  <li
                    key={index}
                    className="rounded-lg border border-slate-200/70 p-4 dark:border-slate-800/80"
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {activity.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {activity.subtitle}
                    </div>
                  </li>
                );

                return activity.link ? (
                  <Link key={index} href={activity.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={index}>{content}</div>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4 rounded-lg border border-slate-200/70 p-8 text-center dark:border-slate-800/80">
              <p className="text-sm text-slate-500">
                Nenhuma atividade recente. Comece fazendo um{' '}
                <Link href="/uploads/novo" className="text-sky-500 hover:text-sky-400">
                  upload de arquivo
                </Link>
                .
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Próximas ações
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {alertasAbertos.length > 0 && (
              <li>
                • <Link href="/alertas" className="text-sky-500 hover:text-sky-400">
                  Revisar {alertasAbertos.length} alerta{alertasAbertos.length > 1 ? 's' : ''} aberto{alertasAbertos.length > 1 ? 's' : ''}
                </Link>
              </li>
            )}
            {contasNovas.length > 0 && (
              <li>
                • <Link href="/contas" className="text-sky-500 hover:text-sky-400">
                  Aprovar {contasNovas.length} conta{contasNovas.length > 1 ? 's' : ''} nova{contasNovas.length > 1 ? 's' : ''}
                </Link>
              </li>
            )}
            {uploadsList.length === 0 && (
              <li>
                • <Link href="/uploads/novo" className="text-sky-500 hover:text-sky-400">
                  Fazer primeiro upload de arquivo
                </Link>
              </li>
            )}
            {alertasAbertos.length === 0 && contasNovas.length === 0 && uploadsList.length > 0 && (
              <li className="text-slate-400">• Tudo em dia! Nenhuma ação pendente.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

