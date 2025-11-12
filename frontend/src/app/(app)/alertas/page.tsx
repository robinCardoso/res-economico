const mockAlertas = [
  {
    id: 'al-001',
    tipo: 'Saldo divergente',
    conta: '1.01.01.02 - Banco Cooperativo Sicredi S.A.',
    filial: 'Filial 01',
    status: 'Aberto',
    criadoEm: '12/11/2025 10:48',
  },
  {
    id: 'al-002',
    tipo: 'Conta nova',
    conta: '4.02.07.15 - Taxas extraordinárias',
    filial: 'Filial 02',
    status: 'Em análise',
    criadoEm: '11/11/2025 16:17',
  },
];

const AlertasPage = () => {
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

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/60 dark:bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Conta / Detalhe
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Filial</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Criado em
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {mockAlertas.map((alerta) => (
              <tr key={alerta.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900">
                <td className="px-4 py-3 font-medium">{alerta.id}</td>
                <td className="px-4 py-3">{alerta.tipo}</td>
                <td className="px-4 py-3">{alerta.conta}</td>
                <td className="px-4 py-3">{alerta.filial}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      alerta.status === 'Aberto'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                    }`}
                  >
                    {alerta.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{alerta.criadoEm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AlertasPage;

