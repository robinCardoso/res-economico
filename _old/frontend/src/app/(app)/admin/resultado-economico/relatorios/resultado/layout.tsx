import type { ReactNode } from 'react';
import { FiltrosProvider } from './filtros-context';
import { HeaderContent } from './header-content';

type Props = {
  children: ReactNode;
};

const RelatorioResultadoLayout = ({ children }: Props) => {
  return (
    <FiltrosProvider>
      <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-background">
        {/* Header compacto */}
        <HeaderContent />

        {/* Conteúdo principal - ocupa todo o espaço restante */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </FiltrosProvider>
  );
};

export default RelatorioResultadoLayout;

