const ConfiguracoesPage = () => {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Configurações
        </h1>
        <p className="text-sm text-slate-500">
          Ajustes de empresa, notificações, armazenamento local e integrações.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Empresa &amp; filiais
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Cadastro de CNPJs, identificação de filiais e preferências regionais.
          </p>
          <button className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Gerenciar
          </button>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Notificações &amp; push
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Configuração de push via Web Push (VAPID), e-mails pelo Resend e alertas no app.
          </p>
          <button className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Configurar
          </button>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Armazenamento offline
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Limpeza do cache, dados sincronizados via IndexedDB e última atualização.
          </p>
          <button className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Gerenciar cache
          </button>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Integrações
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Tokens da Groq, credenciais do Supabase Storage e webhooks externos.
          </p>
          <button className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Conectar APIs
          </button>
        </article>
      </section>
    </div>
  );
};

export default ConfiguracoesPage;

