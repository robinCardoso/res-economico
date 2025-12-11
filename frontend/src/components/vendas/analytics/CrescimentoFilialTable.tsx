'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvolutionCell } from './EvolutionCell';
import type { CrescimentoFilialResponse } from '@/services/vendas.service';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CrescimentoFilialTable({ data }: { data: CrescimentoFilialResponse }) {
  const { filiais, totalGeral, anosDisponiveis } = data;

  // Ordenar filiais do maior para o menor valor (soma de todos os anos ou ano mais recente)
  const filiaisOrdenadas = React.useMemo(() => {
    return [...filiais].sort((a, b) => {
      // Calcular soma total de todos os anos para cada filial
      const somaA = anosDisponiveis.reduce((acc, ano) => acc + (a.dados[ano]?.vendas || 0), 0);
      const somaB = anosDisponiveis.reduce((acc, ano) => acc + (b.dados[ano]?.vendas || 0), 0);
      // Se as somas forem iguais, usar o ano mais recente
      if (somaA === somaB && anosDisponiveis.length > 0) {
        const anoMaisRecente = Math.max(...anosDisponiveis);
        const valorA = a.dados[anoMaisRecente]?.vendas || 0;
        const valorB = b.dados[anoMaisRecente]?.vendas || 0;
        return valorB - valorA;
      }
      return somaB - somaA; // Ordem decrescente
    });
  }, [filiais, anosDisponiveis]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="h-9">
            <TableHead className="sticky left-0 bg-background z-10 min-w-[100px] py-2">
              Filial (UF)
            </TableHead>
            {anosDisponiveis.map((ano) => (
              <React.Fragment key={ano}>
                <TableHead className="text-center min-w-[150px] py-2">
                  {ano} - Vendas
                </TableHead>
                <TableHead className="text-center min-w-[120px] py-2">
                  {ano} - % Evol.
                </TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filiaisOrdenadas.map((filial) => (
            <TableRow key={filial.uf} className="h-9">
              <TableCell className="sticky left-0 bg-background z-10 font-medium py-2">
                {filial.uf}
              </TableCell>
              {anosDisponiveis.map((ano) => (
                <React.Fragment key={ano}>
                  <TableCell className="text-right py-2">
                    {formatCurrency(filial.dados[ano]?.vendas || 0)}
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <EvolutionCell value={filial.dados[ano]?.evolucao} />
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/50 h-9">
            <TableCell className="sticky left-0 bg-muted/50 z-10 py-2">
              Total Geral
            </TableCell>
            {anosDisponiveis.map((ano) => (
              <React.Fragment key={ano}>
                <TableCell className="text-right py-2">
                  {formatCurrency(totalGeral[ano]?.vendas || 0)}
                </TableCell>
                <TableCell className="text-center py-2">
                  <EvolutionCell value={totalGeral[ano]?.evolucao} />
                </TableCell>
              </React.Fragment>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
