'use client';

import { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string; // Label específico para mobile (opcional)
  mobilePriority?: 'high' | 'medium' | 'low'; // Prioridade de exibição em mobile
};

type ResponsiveTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  className?: string;
};

export function ResponsiveTable<T>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Nenhum item encontrado.',
  keyExtractor,
  className = '',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</div>
    );
  }

  // Filtrar colunas por prioridade para mobile (mostrar apenas high e medium)
  const mobileColumns = columns.filter(
    (col) => !col.mobilePriority || col.mobilePriority !== 'low'
  );

  return (
    <div className={className}>
      {/* Desktop Table View (md+) */}
      <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-border text-xs">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm shadow-sm">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 py-2 text-left text-xs font-medium text-muted-foreground ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-2 ${column.className || ''}`}>
                    {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (<md) */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 ${
              onRowClick ? 'cursor-pointer' : ''
            }`}
          >
            <div className="space-y-3">
              {mobileColumns.map((column) => {
                const content = column.render
                  ? column.render(item)
                  : String((item as Record<string, unknown>)[column.key] || '');

                return (
                  <div key={column.key} className="flex flex-col gap-1">
                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {column.mobileLabel || column.label}
                    </div>
                    <div className="text-sm text-foreground">{content}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

