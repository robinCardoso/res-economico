'use client';

import { useVendasImportLogs } from '@/hooks/use-vendas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ImportHistoryTable() {
  const { data: logs, isLoading } = useVendasImportLogs();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Importações</CardTitle>
          <CardDescription>Nenhuma importação realizada ainda</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Importações</CardTitle>
        <CardDescription>
          Últimas importações de vendas realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Mapeamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Novos</TableHead>
                <TableHead>Existentes</TableHead>
                <TableHead>Erros</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{log.nomeArquivo}</TableCell>
                  <TableCell>{log.mappingName || '-'}</TableCell>
                  <TableCell>{log.totalLinhas}</TableCell>
                  <TableCell className="text-green-600 font-semibold">
                    {log.novosCount ?? 0}
                  </TableCell>
                  <TableCell className="text-blue-600 font-semibold">
                    {log.duplicatasCount ?? 0}
                  </TableCell>
                  <TableCell className="text-destructive font-semibold">
                    {log.erroCount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.erroCount === 0 ? 'default' : 'destructive'
                      }
                    >
                      {log.erroCount === 0 ? 'Sucesso' : 'Com Erros'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
