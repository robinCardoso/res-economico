import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  children: ReactNode;
};

const RelatorioResultadoLayout = ({ children }: Props) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* Header compacto */}
      <header className="sticky top-0 z-[110] border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/relatorios"
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Link>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Relatório de Resultado Econômico
            </h1>
          </div>
        </div>
      </header>

      {/* Conteúdo principal - ocupa todo o espaço restante */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

export default RelatorioResultadoLayout;

