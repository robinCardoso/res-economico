'use client';

import { useState } from 'react';
import { useVendasImportLogs, useDeleteImportLog } from '@/hooks/use-vendas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ImportHistoryTable() {
  const { data: logs, isLoading } = useVendasImportLogs();
  const deleteMutation = useDeleteImportLog();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (logId: string, nomeArquivo: string, sucessoCount: number) => {
    setDeletingId(logId);
    try {
      await deleteMutation.mutateAsync(logId);
      toast({
        title: 'Importação deletada',
        description: `A importação "${nomeArquivo}" e ${sucessoCount} vendas foram removidas com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao deletar importação',
      });
    } finally {
      setDeletingId(null);
    }
  };

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
                <TableHead className="w-[100px]">Ações</TableHead>
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
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === log.id}
                        >
                          {deletingId === log.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar esta importação?
                            <br />
                            <br />
                            <strong>Arquivo:</strong> {log.nomeArquivo}
                            <br />
                            <strong>Data:</strong>{' '}
                            {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                            <br />
                            <strong>Total de vendas:</strong> {log.sucessoCount}
                            <br />
                            <br />
                            <span className="text-red-600 font-semibold">
                              ⚠️ Esta ação irá deletar {log.sucessoCount} vendas e não pode ser desfeita!
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDelete(log.id, log.nomeArquivo, log.sucessoCount)
                            }
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deletingId === log.id}
                          >
                            {deletingId === log.id ? 'Deletando...' : 'Deletar'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
