'use client';

import { useContas } from '@/hooks/use-contas';
import { getStatusLabel } from '@/lib/format';

const ContasPage = () => {
  const { data: contas, isLoading, error } = useContas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando contas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar contas. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  // Garantir que contas seja sempre um array
  const contasList = Array.isArray(contas) ? contas : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Catálogo de contas
        </h1>
        <p className="text-sm text-slate-500">
          Catálogo unificado de todas as contas importadas. Cada classificação aparece apenas uma vez, independente da empresa.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {contasList.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Nenhuma conta encontrada. As contas aparecerão aqui após importações.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Primeira Importação</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Última Importação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {contasList.map((conta) => (
                  <tr key={conta.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-semibold">{conta.classificacao}</td>
                    <td className="px-4 py-3">{conta.nomeConta}</td>
                    <td className="px-4 py-3">{conta.tipoConta}</td>
                    <td className="px-4 py-3">{conta.nivel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          conta.status === 'NOVA'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                        }`}
                      >
                        {getStatusLabel(conta.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(conta.primeiraImportacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(conta.ultimaImportacao).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ContasPage;

