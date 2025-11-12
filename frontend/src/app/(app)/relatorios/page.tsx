const consultas = [
  {
    id: 'ai-001',
    titulo: 'Resumo econômico Agosto/2025',
    status: 'Concluído',
    modelo: 'Groq LLaMA 3.1',
    criadoEm: '12/11/2025 09:12',
  },
  {
    id: 'ai-002',
    titulo: 'Anomalias em despesas administrativas',
    status: 'Processando',
    modelo: 'Groq LLaMA 3.1',
    criadoEm: '12/11/2025 11:05',
  },
];

const RelatoriosPage = () => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Relatórios inteligentes
          </h1>
          <p className="text-sm text-slate-500">
            Gere análises assistidas pela Groq para explicar variações e apontar anomalias.
          </p>
        </div>
        <button className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300">
          Nova análise
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {consultas.map((consulta) => (
          <article
            key={consulta.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {consulta.titulo}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Criado em {consulta.criadoEm} • Modelo {consulta.modelo}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                consulta.status === 'Concluído'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'
              }`}
            >
              {consulta.status}
            </span>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
              Em breve: histórico de perguntas, respostas detalhadas e exportação de
              insights.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default RelatoriosPage;

