'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvolutionCell } from './EvolutionCell';
import type { CrescimentoEmpresaResponse } from '@/services/vendas.service';

interface CrescimentoEmpresaTableProps {
  data: CrescimentoEmpresaResponse;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CrescimentoEmpresaTable({ data }: CrescimentoEmpresaTableProps) {
  const { meses, totalGeral, anosDisponiveis } = data;

  // Ordenar meses cronologicamente (Janeiro, Fevereiro, Março, etc.)
  const mesesOrdenados = React.useMemo(() => {
    return [...meses].sort((a, b) => {
      // Ordenar pelo número do mês (1-12)
      return a.mes - b.mes;
    });
  }, [meses]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="h-7">
            <TableHead className="sticky left-0 bg-background z-10 min-w-[120px] py-1 text-xs">
              Mês
            </TableHead>
            {anosDisponiveis.map((ano) => (
              <React.Fragment key={ano}>
                <TableHead className="text-center min-w-[150px] py-1 text-xs">
                  {ano} - Venda
                </TableHead>
                <TableHead className="text-center min-w-[120px] py-1 text-xs">
                  {ano} - % Evol.
                </TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {mesesOrdenados.map((mes) => (
            <TableRow key={mes.mes} className="h-7">
              <TableCell className="sticky left-0 bg-background z-10 font-medium py-1 text-xs">
                {mes.nomeMes}
              </TableCell>
              {anosDisponiveis.map((ano) => (
                <React.Fragment key={ano}>
                  <TableCell className="text-right py-1 text-xs">
                    {formatCurrency(mes.dados[ano]?.venda || 0)}
                  </TableCell>
                  <TableCell className="text-center py-1 text-xs">
                    <EvolutionCell value={mes.dados[ano]?.evolucao} />
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
