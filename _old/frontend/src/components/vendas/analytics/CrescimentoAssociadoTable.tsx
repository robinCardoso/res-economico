'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvolutionCell } from './EvolutionCell';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CrescimentoAssociadoResponse } from '@/services/vendas.service';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface CrescimentoAssociadoTableProps {
  data: CrescimentoAssociadoResponse;
  onPageChange: (page: number) => void;
}

export function CrescimentoAssociadoTable({ data, onPageChange }: CrescimentoAssociadoTableProps) {
  const { associados, totalGeral, anosDisponiveis, total, page, limit } = data;
  const totalPages = Math.ceil(total / limit);

  // Ordenar associados do maior para o menor valor (soma de todos os anos ou ano mais recente)
  const associadosOrdenados = React.useMemo(() => {
    return [...associados].sort((a, b) => {
      // Calcular soma total de todos os anos para cada associado
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
  }, [associados, anosDisponiveis]);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-7">
              <TableHead className="sticky left-0 bg-background z-10 min-w-[200px] py-1 text-xs">
                Nome Fantasia (Associado)
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
            {associadosOrdenados.map((associado) => (
              <TableRow key={associado.nomeFantasia} className="h-7">
                <TableCell className="sticky left-0 bg-background z-10 font-medium py-1 text-xs">
                  {associado.nomeFantasia}
                </TableCell>
                {anosDisponiveis.map((ano) => (
                  <React.Fragment key={ano}>
                    <TableCell className="text-right py-1 text-xs">
                      {formatCurrency(associado.dados[ano]?.venda || 0)}
                    </TableCell>
                    <TableCell className="text-center py-1 text-xs">
                      <EvolutionCell value={associado.dados[ano]?.evolucao} />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between py-1">
          <div className="text-xs text-muted-foreground">
            Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} associados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3 w-3" />
              Anterior
            </Button>
            <div className="text-xs">
              Página {page} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Próxima
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
