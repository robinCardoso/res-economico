import Link from 'next/link';
import { FileBarChart, BrainCircuit } from 'lucide-react';

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

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-500/20">
              <BrainCircuit className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Análises Inteligentes
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Em breve: análises assistidas pela Groq para explicar variações e apontar anomalias.
              </p>
            </div>
          </div>
        </article>
      </section>

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
