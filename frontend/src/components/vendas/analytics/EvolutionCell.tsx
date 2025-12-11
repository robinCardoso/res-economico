'use client';

import { cn } from '@/lib/utils';

interface EvolutionCellProps {
  value: number | null | undefined;
  className?: string;
}

export function EvolutionCell({ value, className }: EvolutionCellProps) {
  if (value === null || value === undefined) {
    return <span className={cn('text-muted-foreground', className)}>-</span>;
  }

  const isNegative = value < 0;
  const formattedValue = value.toFixed(1);

  return (
    <span
      className={cn(
        'font-medium',
        isNegative
          ? 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-2 py-1 rounded'
          : 'text-green-600 dark:text-green-400',
        className
      )}
    >
      {isNegative ? '' : '+'}
      {formattedValue}%
    </span>
  );
}
