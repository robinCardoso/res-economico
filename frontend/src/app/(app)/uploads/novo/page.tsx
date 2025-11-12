import Link from 'next/link';

const steps = [
  {
    title: 'Selecionar arquivo',
    description: 'Importe o balancete em XLS/XLSX enviado pela contabilidade.',
  },
  {
    title: 'Mapear colunas',
    description: 'Associe as colunas do arquivo aos campos configuráveis do sistema.',
  },
  {
    title: 'Validar dados',
    description: 'Revise saldos, contas novas e eventuais divergências antes de concluir.',
  },
  {
    title: 'Confirmar upload',
    description: 'Envie o arquivo para processamento e acompanhe o status.',
  },
];

const NovoUploadPage = () => {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Novo upload
          </h1>
          <p className="text-sm text-slate-500">
            Fluxo guiado para importar arquivos contábeis e gerar alertas automaticamente.
          </p>
        </div>
        <Link
          href="/uploads"
          className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Voltar para uploads
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Passos do assistente
        </h2>
        <ol className="mt-6 space-y-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sm font-semibold text-sky-500 dark:bg-sky-500/20 dark:text-sky-200">
                {index + 1}
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {step.title}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          Zona de arraste para upload de arquivo (em construção).
        </div>
      </section>
    </div>
  );
};

export default NovoUploadPage;

