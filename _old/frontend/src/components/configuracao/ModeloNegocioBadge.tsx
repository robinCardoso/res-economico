'use client';

import type { ModeloNegocio } from '@/types/api';

interface ModeloNegocioBadgeProps {
  modelo: ModeloNegocio | null | undefined;
  className?: string;
}

const modeloNegocioLabels: Record<ModeloNegocio, string> = {
  ASSOCIACAO: 'Associação',
  COMERCIO: 'Comércio',
  INDUSTRIA: 'Indústria',
  SERVICOS: 'Serviços',
  AGROPECUARIA: 'Agronegócio',
  OUTRO: 'Outro',
};

const modeloNegocioColors: Record<ModeloNegocio, string> = {
  ASSOCIACAO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  COMERCIO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  INDUSTRIA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  SERVICOS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  AGROPECUARIA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  OUTRO: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

export const ModeloNegocioBadge = ({ modelo, className = '' }: ModeloNegocioBadgeProps) => {
  if (!modelo) return null;

  const label = modeloNegocioLabels[modelo];
  const colorClass = modeloNegocioColors[modelo];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
};

