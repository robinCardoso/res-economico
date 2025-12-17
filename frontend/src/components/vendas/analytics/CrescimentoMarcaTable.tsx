'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvolutionCell } from './EvolutionCell';
import type { CrescimentoMarcaResponse } from '@/services/vendas.service';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CrescimentoMarcaTable({ data }: { data: CrescimentoMarcaResponse }) {
  const { marcas, totalGeral, anosDisponiveis } = data;

  // Ordenar marcas do maior para o menor valor (soma de todos os anos ou ano mais recente)
  const marcasOrdenadas = React.useMemo(() => {
    return [...marcas].sort((a, b) => {
      // Calcular soma total de todos os anos para cada marca
      const somaA = anosDisponiveis.reduce((acc, ano) => acc + (a.dados[ano]?.venda || 0), 0);
      const somaB = anosDisponiveis.reduce((acc, ano) => acc + (b.dados[ano]?.venda || 0), 0);
      // Se as somas forem iguais, usar o ano mais recente
      if (somaA === somaB && anosDisponiveis.length > 0) {
        const anoMaisRecente = Math.max(...anosDisponiveis);
        const valorA = a.dados[anoMaisRecente]?.venda || 0;
        const valorB = b.dados[anoMaisRecente]?.venda || 0;
        return valorB - valorA;
      }
      return somaB - somaA; // Ordem decrescente
    });
  }, [marcas, anosDisponiveis]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="h-7">
            <TableHead className="sticky left-0 bg-background z-10 min-w-[150px] py-1 text-xs">
              Marca
            </TableHead>
            {anosDisponiveis.map((ano) => (
              <React.Fragment key={ano}>
                <TableHead className="text-center min-w-[150px] py-1 text-xs">
                  {ano} - Venda
                </TableHead>
                <TableHead className="text-center min-w-[120px] py-1 text-xs">
                  {ano} - %
                </TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {marcasOrdenadas.map((marca) => (
            <TableRow key={marca.marca} className="h-7">
              <TableCell className="sticky left-0 bg-background z-10 font-medium py-1 text-xs">
                {marca.marca}
              </TableCell>
              {anosDisponiveis.map((ano) => (
                <React.Fragment key={ano}>
                  <TableCell className="text-right py-1 text-xs">
                    {formatCurrency(marca.dados[ano]?.venda || 0)}
                  </TableCell>
                  <TableCell className="text-center py-1 text-xs">
                    <EvolutionCell value={marca.dados[ano]?.evolucao} />
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/50 h-7">
            <TableCell className="sticky left-0 bg-muted/50 z-10 py-1 text-xs">
              Total Geral
            </TableCell>
            {anosDisponiveis.map((ano) => (
              <React.Fragment key={ano}>
                <TableCell className="text-right py-1 text-xs">
                  {formatCurrency(totalGeral[ano]?.venda || 0)}
                </TableCell>
                <TableCell className="text-center py-1 text-xs">
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
