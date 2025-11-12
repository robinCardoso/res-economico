const mockContas = [
  {
    classificacao: '1.01.01.02',
    nome: 'Banco Cooperativo Sicredi S.A.',
    tipo: 'Ativo circulante',
    nivel: 4,
    status: 'Regular',
  },
  {
    classificacao: '4.02.07.15',
    nome: 'Taxas extraordinárias',
    tipo: 'Despesas operacionais',
    nivel: 4,
    status: 'Nova',
  },
];

const ContasPage = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Catálogo de contas
        </h1>
        <p className="text-sm text-slate-500">
          Histórico consolidado das contas importadas, com destaque para novidades.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/60 dark:bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Classificação
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Nível</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {mockContas.map((conta) => (
              <tr key={conta.classificacao}>
                <td className="px-4 py-3 font-semibold">{conta.classificacao}</td>
                <td className="px-4 py-3">{conta.nome}</td>
                <td className="px-4 py-3">{conta.tipo}</td>
                <td className="px-4 py-3">{conta.nivel}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      conta.status === 'Nova'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                    }`}
                  >
                    {conta.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ContasPage;

