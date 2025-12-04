'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { atasService } from '@/services/atas.service';
import { Bell, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface Lembrete {
  id: string;
  mensagem: string;
  tipo: string;
  enviado: boolean;
  dataEnvio?: string;
  prazo: {
    id: string;
    titulo: string;
    dataPrazo: string;
    status: string;
    concluido: boolean;
    ata: {
      id: string;
      numero: string;
      titulo: string;
    };
  };
}

export function NotificacoesLembretes() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Buscar lembretes não lidos
  const { data: lembretes, refetch } = useQuery({
    queryKey: ['lembretes', false],
    queryFn: () => atasService.listarLembretes(false) as Promise<Lembrete[]>,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const marcarComoLidoMutation = useMutation({
    mutationFn: (lembreteId: string) =>
      atasService.marcarLembreteComoLido(lembreteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembretes'] });
      refetch();
    },
  });

  const lembretesNaoLidos = lembretes?.filter((l) => !l.enviado) || [];
  const quantidade = lembretesNaoLidos.length;

  const handleMarcarComoLido = (lembreteId: string) => {
    marcarComoLidoMutation.mutate(lembreteId);
  };

  const handleMarcarTodosComoLidos = () => {
    lembretesNaoLidos.forEach((lembrete) => {
      marcarComoLidoMutation.mutate(lembrete.id);
    });
  };

  const getIconePorTipo = (tipo: string) => {
    switch (tipo) {
      case 'VENCIDO':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'HOJE':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'VENCIDO':
        return 'destructive' as const;
      case 'HOJE':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {quantidade > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {quantidade > 9 ? '9+' : quantidade}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Lembretes de Prazos</h3>
            {quantidade > 0 && (
              <Badge variant="secondary" className="ml-2">
                {quantidade}
              </Badge>
            )}
          </div>
          {quantidade > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarcarTodosComoLidos}
              disabled={marcarComoLidoMutation.isPending}
            >
              Marcar todos como lidos
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {lembretesNaoLidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum lembrete pendente
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Você está em dia com todos os prazos!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {lembretesNaoLidos.map((lembrete) => {
                const dataPrazo = new Date(lembrete.prazo.dataPrazo);
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const vencido = dataPrazo < hoje && !lembrete.prazo.concluido;

                return (
                  <div
                    key={lembrete.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      vencido ? 'bg-destructive/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getIconePorTipo(lembrete.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium line-clamp-2">
                            {lembrete.mensagem}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleMarcarComoLido(lembrete.id)}
                            disabled={marcarComoLidoMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getBadgeVariant(lembrete.tipo)} className="text-xs">
                            {lembrete.prazo.ata.numero}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Prazo: {dataPrazo.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <Link
                          href={`/admin/atas/${lembrete.prazo.ata.id}/processo`}
                          onClick={() => setOpen(false)}
                          className="text-xs text-primary hover:underline mt-1 block"
                        >
                          Ver ata →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {lembretesNaoLidos.length > 0 && (
          <div className="p-3 border-t bg-muted/50">
            <Link
              href="/admin/atas"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline"
            >
              Ver todas as atas →
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

