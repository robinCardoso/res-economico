const mockTemplates = [
  {
    id: 'tmp-001',
    nome: 'Padrão Matriz',
    colunas: 12,
    ultimaAtualizacao: '10/11/2025',
    descricao: 'Template base para balancete consolidado - matriz.',
  },
  {
    id: 'tmp-002',
    nome: 'Filial Comercial',
    colunas: 14,
    ultimaAtualizacao: '02/11/2025',
    descricao: 'Inclui campos adicionais de centro de custo e natureza.',
  },
];

const TemplatesPage = () => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Templates de importação
          </h1>
          <p className="text-sm text-slate-500">
            Defina o mapeamento de colunas para cada filial ou tipo de planilha.
          </p>
        </div>
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">
          Criar template
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {mockTemplates.map((template) => (
          <article
            key={template.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {template.nome}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              {template.descricao}
            </p>
            <dl className="mt-4 flex flex-wrap gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <dt>Colunas mapeadas</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {template.colunas}
                </dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {template.ultimaAtualizacao}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3 text-sm">
              <button className="rounded-md border border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Editar
              </button>
              <button className="rounded-md border border-rose-300 px-3 py-2 text-rose-500 hover:bg-rose-500/10 dark:border-rose-500/60 dark:text-rose-300">
                Duplicar
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default TemplatesPage;

