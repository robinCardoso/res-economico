'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FilialAssociadoResponse } from '@/services/vendas.service';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function FilialAssociadoTable({ data }: { data: FilialAssociadoResponse }) {
  const { ufs, totalGeral, mesesDisponiveis } = data;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="h-7">
            <TableHead className="sticky left-0 bg-background z-10 min-w-[120px] py-1 text-xs">
              UF-DESTINC.
            </TableHead>
            <TableHead className="sticky left-[120px] bg-background z-10 min-w-[200px] py-1 text-xs">
              Nome Fantasia
            </TableHead>
            {mesesDisponiveis.map((mes) => (
              <TableHead key={mes} className="text-center min-w-[120px] py-1 text-xs">
                {mes}
              </TableHead>
            ))}
            <TableHead className="text-center min-w-[150px] py-1 text-xs font-bold">
              Total Geral
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ufs.map((ufData) => (
            <React.Fragment key={ufData.uf}>
              {/* Linhas de Associados */}
              {ufData.associados.map((associado) => (
                <TableRow
                  key={`${ufData.uf}-${associado.nomeFantasia}`}
                  className="h-7"
                >
                  <TableCell className="sticky left-0 bg-background z-10 py-1 text-xs">
                    {ufData.uf}
                  </TableCell>
                  <TableCell className="sticky left-[120px] bg-background z-10 font-medium py-1 text-xs">
                    {associado.nomeFantasia}
                  </TableCell>
                  {mesesDisponiveis.map((mes) => (
                    <TableCell key={mes} className="text-right py-1 text-xs">
                      {formatCurrency(associado.monthlySales[mes] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium py-1 text-xs">
                    {formatCurrency(associado.totalGeral)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Linha de Subtotal da UF */}
              <TableRow className="font-bold bg-blue-50 h-7">
                <TableCell className="sticky left-0 bg-blue-50 z-10 py-1 text-xs">
                  {ufData.uf} Total
                </TableCell>
                <TableCell className="sticky left-[120px] bg-blue-50 z-10 py-1 text-xs">
                  {/* Vazio */}
                </TableCell>
                {mesesDisponiveis.map((mes) => (
                  <TableCell key={mes} className="text-right py-1 text-xs">
                    {formatCurrency(ufData.monthlyTotals[mes] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right py-1 text-xs">
                  {formatCurrency(ufData.totalGeral)}
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}

          {/* Linha de Total Geral */}
          <TableRow className="font-bold bg-muted/50 h-7">
            <TableCell
              className="sticky left-0 bg-muted/50 z-10 py-1 text-xs"
              colSpan={2}
            >
              Total Geral
            </TableCell>
            {mesesDisponiveis.map((mes) => (
              <TableCell key={mes} className="text-right py-1 text-xs">
                {formatCurrency(totalGeral[mes] || 0)}
              </TableCell>
            ))}
            <TableCell className="text-right py-1 text-xs">
              {formatCurrency(totalGeral.total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
