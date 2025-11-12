import Link from 'next/link';

type UploadDetalheProps = {
  params: Promise<{ id: string }>;
};

const UploadDetalhePage = async ({ params }: UploadDetalheProps) => {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Upload {id}
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
              <dd className="text-slate-900 dark:text-slate-100">Filial Matriz</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Período</dt>
              <dd className="text-slate-900 dark:text-slate-100">Agosto/2025</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Linhas</dt>
              <dd className="text-slate-900 dark:text-slate-100">482</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Alertas</dt>
              <dd className="text-amber-500">2 pendentes</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Alertas detectados
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li className="rounded-lg border border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-400/30 dark:bg-amber-400/10">
              Saldo divergente na conta 1.01.01.02 - Banco Cooperativo Sicredi S.A.
            </li>
            <li className="rounded-lg border border-sky-300/60 bg-sky-50/60 p-4 dark:border-sky-400/30 dark:bg-sky-400/10">
              Nova conta identificada: 4.02.07.15 - Taxas extraordinárias.
            </li>
          </ul>
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
          Visualização detalhada das linhas importadas em desenvolvimento.
        </div>
      </section>
    </div>
  );
};

export default UploadDetalhePage;

