'use client';

import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useFiltros } from './filtros-context';

export const HeaderContent = () => {
  const { setFiltrosExpandidos } = useFiltros();

  return (
    <header className="sticky top-0 z-[110] border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-foreground">
            Relatório de Resultado Econômico
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/resultado-economico/relatorios"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-sky-300 bg-sky-50 px-3 text-xs font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Link>
          <button
            onClick={() => setFiltrosExpandidos(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-sky-300 bg-sky-50 px-3 text-xs font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/30"
            aria-label="Editar filtros do relatório"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Editar Filtros
          </button>
        </div>
      </div>
    </header>
  );
};

