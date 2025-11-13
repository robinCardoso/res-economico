'use client';

import Link from 'next/link';
import { useUploads } from '@/hooks/use-uploads';
import { formatPeriodo, formatDateTime, getStatusLabel } from '@/lib/format';

const UploadsPage = () => {
  const { data: uploads, isLoading, error } = useUploads();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando uploads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar uploads. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  // Garantir que uploads seja sempre um array
  const uploadsList = Array.isArray(uploads) ? uploads : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Uploads
          </h1>
          <p className="text-sm text-slate-500">
            Histórico de importações por filial, período e status.
          </p>
        </div>
        <Link
          href="/uploads/novo"
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          Novo upload
        </Link>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {uploadsList.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Nenhum upload encontrado. Comece criando um novo upload.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50/60 dark:bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Filial</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Período</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Alertas</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Linhas</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Atualizado</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {uploadsList.map((upload) => (
                <tr key={upload.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900">
                  <td className="px-4 py-3">{upload.filial?.nome || 'N/A'}</td>
                  <td className="px-4 py-3">{formatPeriodo(upload.mes, upload.ano)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        upload.status === 'CONCLUIDO'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                          : upload.status === 'COM_ALERTAS'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200'
                      }`}
                    >
                      {getStatusLabel(upload.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{upload.alertas?.length || 0}</td>
                  <td className="px-4 py-3">{upload.totalLinhas}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(upload.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/uploads/${upload.id}`}
                      className="text-sm font-medium text-sky-500 hover:text-sky-400"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default UploadsPage;

