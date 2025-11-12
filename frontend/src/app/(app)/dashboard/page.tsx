import { ArrowUpRight, BellRing, FileSpreadsheet, Layers3 } from 'lucide-react';

const stats = [
  {
    name: 'Upload mais recente',
    value: 'Agosto/2025',
    change: '+2%',
    icon: FileSpreadsheet,
  },
  { name: 'Alertas abertos', value: '7', change: '3 críticos', icon: BellRing },
  { name: 'Contas em análise', value: '12', change: '+5 novas', icon: Layers3 },
];

const recentActivities = [
  { title: 'Upload - Filial 01', subtitle: 'Processado em 12/11/2025 - 480 linhas' },
  { title: 'Conta nova detectada: 4.01.07.02', subtitle: 'Cadastrado automaticamente' },
  { title: 'Alerta resolvido - Saldo divergente', subtitle: 'Apontamento revisado por Financeiro' },
];

const DashboardPage = () => {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Visão Geral
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Acompanhe rapidamente os uploads e alertas do resultado econômico.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {item.value}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-500">
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                    {item.change}
                  </span>
                </div>
                <span className="rounded-full bg-sky-500/10 p-3 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Últimas atividades
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {recentActivities.map((activity) => (
              <li
                key={activity.title}
                className="rounded-lg border border-slate-200/70 p-4 dark:border-slate-800/80"
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {activity.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activity.subtitle}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Próximas ações
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• Revisar divergências de saldo da Filial 02</li>
            <li>• Aprovar novas contas classificadas pela contabilidade</li>
            <li>• Agendar análise assistida com Groq para o mês corrente</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

