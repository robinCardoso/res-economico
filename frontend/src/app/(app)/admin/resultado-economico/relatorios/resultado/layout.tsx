import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  children: ReactNode;
};

const RelatorioResultadoLayout = ({ children }: Props) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-background">
      {/* Header compacto */}
      <header className="sticky top-0 z-[110] border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/resultado-economico/relatorios"
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-foreground/80 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-sm font-semibold text-foreground">
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

