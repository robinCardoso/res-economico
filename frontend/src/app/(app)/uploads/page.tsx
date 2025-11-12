import Link from 'next/link';

const mockUploads = [
  {
    id: 'upl-2025-08-01',
    filial: 'Filial Matriz',
    periodo: 'Agosto/2025',
    status: 'Concluído',
    alertas: 2,
    linhas: 482,
    atualizadoEm: '12/11/2025 10:43',
  },
  {
    id: 'upl-2025-07-15',
    filial: 'Filial 02',
    periodo: 'Julho/2025',
    status: 'Com alertas',
    alertas: 5,
    linhas: 458,
    atualizadoEm: '15/10/2025 17:22',
  },
];

const UploadsPage = () => {
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
            {mockUploads.map((upload) => (
              <tr key={upload.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900">
                <td className="px-4 py-3">{upload.filial}</td>
                <td className="px-4 py-3">{upload.periodo}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      upload.status === 'Concluído'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                    }`}
                  >
                    {upload.status}
                  </span>
                </td>
                <td className="px-4 py-3">{upload.alertas}</td>
                <td className="px-4 py-3">{upload.linhas}</td>
                <td className="px-4 py-3 text-slate-500">{upload.atualizadoEm}</td>
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
      </section>
    </div>
  );
};

export default UploadsPage;

