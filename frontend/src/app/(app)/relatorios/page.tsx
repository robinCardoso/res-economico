import Link from 'next/link';
import { FileBarChart, BrainCircuit, FileText } from 'lucide-react';

const RelatoriosPage = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Relatórios
        </h1>
        <p className="text-sm text-slate-500">
          Gere relatórios consolidados e análises inteligentes dos seus dados.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/relatorios/resultado"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-sky-700"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-sky-100 p-3 dark:bg-sky-500/20">
              <FileBarChart className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Resultado Econômico
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Gere relatórios consolidados por filial ou consolidado para análise de resultados
                mensais e anuais.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/relatorios/comparativo"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-purple-700"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-500/20">
              <FileBarChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Relatório Comparativo
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Compare períodos (mês a mês ou ano a ano) com análise de variações e gráficos de tendências.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/analises"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-purple-700"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-500/20">
              <BrainCircuit className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Análises Inteligentes
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Análises assistidas pela Groq AI para explicar variações, apontar anomalias e gerar insights automáticos dos seus dados.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/resumos"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-sky-700"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-sky-100 p-3 dark:bg-sky-500/20">
              <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Resumos Econômicos
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Histórico de análises salvas, respostas detalhadas e exportação de insights em PDF, Excel ou JSON.
              </p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default RelatoriosPage;
