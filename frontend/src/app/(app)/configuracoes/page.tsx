'use client';

import Link from 'next/link';

const ConfiguracoesPage = () => {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-foreground">
          Configurações
        </h1>
        <p className="text-sm text-slate-500">
          Ajustes de empresa, notificações, armazenamento local e integrações.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Empresa &amp; filiais
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Cadastro de CNPJs, identificação de filiais e preferências regionais.
          </p>
          <Link
            href="/empresas"
            className="mt-4 inline-block rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            Gerenciar
          </Link>
        </article>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Modelos de Negócio
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Configure modelos de negócio uma vez e aplique a todas as empresas automaticamente. Defina contas de receita, custos e detalhes específicos por modelo.
          </p>
          <Link
            href="/configuracoes/modelos-negocio"
            className="mt-4 inline-block rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            Gerenciar
          </Link>
        </article>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Notificações &amp; push
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Configuração de push via Web Push (VAPID), e-mails pelo Resend e alertas no app.
          </p>
          <button className="mt-4 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">
            Configurar
          </button>
        </article>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Armazenamento offline
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Limpeza do cache, dados sincronizados via IndexedDB e última atualização.
          </p>
          <button className="mt-4 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">
            Gerenciar cache
          </button>
        </article>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Integrações
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Tokens da Groq, credenciais do Supabase Storage e webhooks externos.
          </p>
          <button className="mt-4 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">
            Conectar APIs
          </button>
        </article>
      </section>
    </div>
  );
};

export default ConfiguracoesPage;

