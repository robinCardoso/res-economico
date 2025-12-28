'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { atasService } from '@/services/atas.service';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  User,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface HistoricoItem {
  id: string;
  acao: string;
  descricao?: string;
  responsavel?: string;
  data: string;
  criadoPor: string;
  criador: {
    id: string;
    nome: string;
    email: string;
  };
}

interface PrazoItem {
  id: string;
  titulo: string;
  descricao?: string;
  dataPrazo: string;
  dataConclusao?: string;
  status: string;
  concluido: boolean;
  criadoPor: string;
  criador: {
    id: string;
    nome: string;
    email: string;
  };
}

export default function ProcessoPage() {
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const [dialogHistoricoOpen, setDialogHistoricoOpen] = useState(false);
  const [dialogPrazoOpen, setDialogPrazoOpen] = useState(false);
  const [dialogEditarHistoricoOpen, setDialogEditarHistoricoOpen] = useState(false);
  const [dialogEditarPrazoOpen, setDialogEditarPrazoOpen] = useState(false);
  const [historicoEditando, setHistoricoEditando] = useState<HistoricoItem | null>(null);
  const [prazoEditando, setPrazoEditando] = useState<PrazoItem | null>(null);
  const [formHistorico, setFormHistorico] = useState({
    acao: '',
    descricao: '',
    responsavel: '',
    data: new Date().toISOString().split('T')[0],
  });
  const [formPrazo, setFormPrazo] = useState({
    titulo: '',
    descricao: '',
    dataPrazo: '',
  });

  // Buscar ata
  const { data: ata, isLoading } = useQuery({
    queryKey: ['ata', id],
    queryFn: () => atasService.getById(id),
    enabled: !!id,
  });

  // Buscar histórico
  const { data: historico, refetch: refetchHistorico } = useQuery({
    queryKey: ['historico', id],
    queryFn: () => atasService.listarHistorico(id) as Promise<HistoricoItem[]>,
    enabled: !!id,
  });

  // Buscar prazos
  const { data: prazos, refetch: refetchPrazos } = useQuery({
    queryKey: ['prazos', id],
    queryFn: () => atasService.listarPrazos(id) as Promise<PrazoItem[]>,
    enabled: !!id,
  });

  const historicoMutation = useMutation({
    mutationFn: () =>
      atasService.adicionarHistorico(
        id,
        formHistorico.acao,
        formHistorico.descricao,
        formHistorico.responsavel,
        formHistorico.data,
      ),
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Histórico adicionado com sucesso.',
      });
      setDialogHistoricoOpen(false);
      setFormHistorico({
        acao: '',
        descricao: '',
        responsavel: '',
        data: new Date().toISOString().split('T')[0],
      });
      refetchHistorico();
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao adicionar histórico',
      });
    },
  });

  const prazoMutation = useMutation({
    mutationFn: () =>
      atasService.criarPrazo(
        id,
        formPrazo.titulo,
        formPrazo.dataPrazo,
        formPrazo.descricao,
      ),
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Prazo criado com sucesso.',
      });
      setDialogPrazoOpen(false);
      setFormPrazo({
        titulo: '',
        descricao: '',
        dataPrazo: '',
      });
      refetchPrazos();
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao criar prazo',
      });
    },
  });

  const concluirPrazoMutation = useMutation({
    mutationFn: (prazoId: string) =>
      atasService.atualizarPrazo(prazoId, {
        concluido: true,
        dataConclusao: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Prazo marcado como concluído.',
      });
      refetchPrazos();
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao concluir prazo',
      });
    },
  });

  const atualizarHistoricoMutation = useMutation({
    mutationFn: () => {
      if (!historicoEditando) throw new Error('Nenhum histórico selecionado');
      return atasService.atualizarHistorico(
        id,
        historicoEditando.id,
        formHistorico.acao,
        formHistorico.descricao,
        formHistorico.responsavel,
        formHistorico.data,
      );
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Histórico atualizado com sucesso.',
      });
      setDialogEditarHistoricoOpen(false);
      setHistoricoEditando(null);
      setFormHistorico({
        acao: '',
        descricao: '',
        responsavel: '',
        data: new Date().toISOString().split('T')[0],
      });
      refetchHistorico();
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao atualizar histórico',
      });
    },
  });

  const atualizarPrazoMutation = useMutation({
    mutationFn: () => {
      if (!prazoEditando) throw new Error('Nenhum prazo selecionado');
      return atasService.atualizarPrazo(prazoEditando.id, {
        titulo: formPrazo.titulo,
        descricao: formPrazo.descricao,
        dataPrazo: formPrazo.dataPrazo,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Prazo atualizado com sucesso.',
      });
      setDialogEditarPrazoOpen(false);
      setPrazoEditando(null);
      setFormPrazo({
        titulo: '',
        descricao: '',
        dataPrazo: '',
      });
      refetchPrazos();
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao atualizar prazo',
      });
    },
  });

  const removerHistoricoMutation = useMutation({
    mutationFn: (historicoId: string) => atasService.removerHistorico(id, historicoId),
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Histórico removido com sucesso.',
      });
      refetchHistorico();
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao remover histórico',
      });
    },
  });

  const removerPrazoMutation = useMutation({
    mutationFn: (prazoId: string) => atasService.removerPrazo(id, prazoId),
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Prazo removido com sucesso.',
      });
      refetchPrazos();
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao remover prazo',
      });
    },
  });

  const handleConcluirPrazo = (prazoId: string) => {
    concluirPrazoMutation.mutate(prazoId);
  };

  const handleEditarHistorico = (item: HistoricoItem) => {
    setHistoricoEditando(item);
    setFormHistorico({
      acao: item.acao,
      descricao: item.descricao || '',
      responsavel: item.responsavel || '',
      data: new Date(item.data).toISOString().split('T')[0],
    });
    setDialogEditarHistoricoOpen(true);
  };

  const handleEditarPrazo = (item: PrazoItem) => {
    setPrazoEditando(item);
    setFormPrazo({
      titulo: item.titulo,
      descricao: item.descricao || '',
      dataPrazo: new Date(item.dataPrazo).toISOString().split('T')[0],
    });
    setDialogEditarPrazoOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!ata) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Ata não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ata.status !== 'EM_PROCESSO') {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Esta ata não está em processo. Status atual: {ata.status}
            </p>
            <Link href={`/admin/atas/${id}`}>
              <Button className="mt-4">Ver Ata</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const prazosVencidos = prazos?.filter((p) => {
    const dataPrazo = new Date(p.dataPrazo);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return dataPrazo < hoje && !p.concluido;
  });

  const prazosProximos = prazos?.filter((p) => {
    const dataPrazo = new Date(p.dataPrazo);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const tresDias = new Date(hoje);
    tresDias.setDate(tresDias.getDate() + 3);
    return dataPrazo >= hoje && dataPrazo <= tresDias && !p.concluido;
  });

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/admin/atas">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Processo</h1>
            <p className="text-muted-foreground mt-2">
              {ata.numero} - {ata.titulo}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Em Processo
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - Timeline e Prazos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline de Histórico */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Histórico de Andamento
                  </CardTitle>
                  <CardDescription>
                    Acompanhe todas as ações realizadas nesta ata
                  </CardDescription>
                </div>
                <Dialog open={dialogHistoricoOpen} onOpenChange={setDialogHistoricoOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar ao Histórico</DialogTitle>
                      <DialogDescription>
                        Registre uma nova ação no histórico de andamento
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="acao">Ação *</Label>
                        <Input
                          id="acao"
                          value={formHistorico.acao}
                          onChange={(e) =>
                            setFormHistorico({ ...formHistorico, acao: e.target.value })
                          }
                          placeholder="Ex: Enviado para assinatura"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="data">Data *</Label>
                        <Input
                          id="data"
                          type="date"
                          value={formHistorico.data}
                          onChange={(e) =>
                            setFormHistorico({ ...formHistorico, data: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="responsavel">Responsável</Label>
                        <Input
                          id="responsavel"
                          value={formHistorico.responsavel}
                          onChange={(e) =>
                            setFormHistorico({ ...formHistorico, responsavel: e.target.value })
                          }
                          placeholder="Nome do responsável"
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={formHistorico.descricao}
                          onChange={(e) =>
                            setFormHistorico({ ...formHistorico, descricao: e.target.value })
                          }
                          placeholder="Detalhes adicionais..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogHistoricoOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => historicoMutation.mutate()}
                        disabled={historicoMutation.isPending || !formHistorico.acao}
                      >
                        {historicoMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Adicionar'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {historico && historico.length > 0 ? (
                <div className="space-y-4">
                  {historico.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-b-0"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                        {index < historico.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{item.acao}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.data).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditarHistorico(item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar histórico</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja remover este histórico?')) {
                                      removerHistoricoMutation.mutate(item.id);
                                    }
                                  }}
                                  disabled={removerHistoricoMutation.isPending}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover histórico</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        {item.responsavel && (
                          <p className="text-sm flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.responsavel}
                          </p>
                        )}
                        {item.descricao && (
                          <p className="text-sm text-muted-foreground">{item.descricao}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Registrado por: {item.criador.nome}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum histórico registrado ainda
                </p>
              )}
            </CardContent>
          </Card>

          {/* Prazos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Prazos
                  </CardTitle>
                  <CardDescription>
                    Gerencie os prazos e ações pendentes
                  </CardDescription>
                </div>
                <Dialog open={dialogPrazoOpen} onOpenChange={setDialogPrazoOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Prazo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Prazo</DialogTitle>
                      <DialogDescription>
                        Defina um prazo para uma ação relacionada a esta ata
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="titulo">Título *</Label>
                        <Input
                          id="titulo"
                          value={formPrazo.titulo}
                          onChange={(e) =>
                            setFormPrazo({ ...formPrazo, titulo: e.target.value })
                          }
                          placeholder="Ex: Prazo para assinatura"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataPrazo">Data do Prazo *</Label>
                        <Input
                          id="dataPrazo"
                          type="date"
                          value={formPrazo.dataPrazo}
                          onChange={(e) =>
                            setFormPrazo({ ...formPrazo, dataPrazo: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricaoPrazo">Descrição</Label>
                        <Textarea
                          id="descricaoPrazo"
                          value={formPrazo.descricao}
                          onChange={(e) =>
                            setFormPrazo({ ...formPrazo, descricao: e.target.value })
                          }
                          placeholder="Detalhes do prazo..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogPrazoOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => prazoMutation.mutate()}
                        disabled={prazoMutation.isPending || !formPrazo.titulo || !formPrazo.dataPrazo}
                      >
                        {prazoMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          'Criar Prazo'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {prazos && prazos.length > 0 ? (
                <div className="space-y-4">
                  {prazos.map((prazo) => {
                    const dataPrazo = new Date(prazo.dataPrazo);
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const vencido = dataPrazo < hoje && !prazo.concluido;
                    const hojePrazo = dataPrazo.getTime() === hoje.getTime() && !prazo.concluido;

                    return (
                      <div
                        key={prazo.id}
                        className={`p-4 rounded-lg border ${
                          prazo.concluido
                            ? 'bg-muted border-muted-foreground/20'
                            : vencido
                              ? 'bg-destructive/10 border-destructive'
                              : hojePrazo
                                ? 'bg-warning/10 border-warning'
                                : 'bg-background border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{prazo.titulo}</h4>
                              {prazo.concluido ? (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Concluído
                                </Badge>
                              ) : vencido ? (
                                <Badge variant="destructive" className="text-xs">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Vencido
                                </Badge>
                              ) : hojePrazo ? (
                                <Badge variant="default" className="text-xs">
                                  <Clock className="mr-1 h-3 w-3" />
                                  Hoje
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  Pendente
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {dataPrazo.toLocaleDateString('pt-BR')}
                              {prazo.dataConclusao && (
                                <>
                                  {' • '}
                                  Concluído em:{' '}
                                  {new Date(prazo.dataConclusao).toLocaleDateString('pt-BR')}
                                </>
                              )}
                            </p>
                            {prazo.descricao && (
                              <p className="text-sm mt-2">{prazo.descricao}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditarPrazo(prazo)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar prazo</p>
                              </TooltipContent>
                            </Tooltip>
                            {!prazo.concluido && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleConcluirPrazo(prazo.id)}
                                    disabled={concluirPrazoMutation.isPending}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Clique para Concluir!</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja remover este prazo?')) {
                                      removerPrazoMutation.mutate(prazo.id);
                                    }
                                  }}
                                  disabled={removerPrazoMutation.isPending}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover prazo</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum prazo cadastrado ainda
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Resumo e Alertas */}
        <div className="space-y-6">
          {/* Alertas de Prazos */}
          {prazosVencidos && prazosVencidos.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">
                  ⚠️ Prazos Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prazosVencidos.map((prazo) => (
                    <div key={prazo.id} className="p-2 bg-destructive/10 rounded text-sm">
                      <p className="font-medium">{prazo.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        Venceu em {new Date(prazo.dataPrazo).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {prazosProximos && prazosProximos.length > 0 && (
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="text-lg text-warning">
                  ⏰ Prazos Próximos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prazosProximos.map((prazo) => {
                    const dataPrazo = new Date(prazo.dataPrazo);
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const diasRestantes = Math.ceil(
                      (dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
                    );

                    return (
                      <div key={prazo.id} className="p-2 bg-warning/10 rounded text-sm">
                        <p className="font-medium">{prazo.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {diasRestantes === 0
                            ? 'Vence hoje'
                            : `Vence em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações da Ata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Ata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{ata.tipo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data:</span>
                <p className="font-medium">
                  {new Date(ata.dataReuniao).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {ata.local && (
                <div>
                  <span className="text-muted-foreground">Local:</span>
                  <p className="font-medium">{ata.local}</p>
                </div>
              )}
              {ata.dataAssinatura && (
                <div>
                  <span className="text-muted-foreground">Data Assinatura:</span>
                  <p className="font-medium">
                    {new Date(ata.dataAssinatura).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {ata.dataRegistro && (
                <div>
                  <span className="text-muted-foreground">Data Registro:</span>
                  <p className="font-medium">
                    {new Date(ata.dataRegistro).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Ações:</span>
                <span className="font-medium">{historico?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Prazos:</span>
                <span className="font-medium">{prazos?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prazos Concluídos:</span>
                <span className="font-medium">
                  {prazos?.filter((p) => p.concluido).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prazos Pendentes:</span>
                <span className="font-medium">
                  {prazos?.filter((p) => !p.concluido).length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Editar Histórico */}
      <Dialog open={dialogEditarHistoricoOpen} onOpenChange={setDialogEditarHistoricoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Histórico</DialogTitle>
            <DialogDescription>
              Atualize as informações do histórico de andamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-acao">Ação *</Label>
              <Input
                id="edit-acao"
                value={formHistorico.acao}
                onChange={(e) =>
                  setFormHistorico({ ...formHistorico, acao: e.target.value })
                }
                placeholder="Ex: Enviado para assinatura"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-data">Data *</Label>
              <Input
                id="edit-data"
                type="date"
                value={formHistorico.data}
                onChange={(e) =>
                  setFormHistorico({ ...formHistorico, data: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-responsavel">Responsável</Label>
              <Input
                id="edit-responsavel"
                value={formHistorico.responsavel}
                onChange={(e) =>
                  setFormHistorico({ ...formHistorico, responsavel: e.target.value })
                }
                placeholder="Nome do responsável"
              />
            </div>
            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formHistorico.descricao}
                onChange={(e) =>
                  setFormHistorico({ ...formHistorico, descricao: e.target.value })
                }
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogEditarHistoricoOpen(false);
                setHistoricoEditando(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => atualizarHistoricoMutation.mutate()}
              disabled={atualizarHistoricoMutation.isPending || !formHistorico.acao}
            >
              {atualizarHistoricoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Prazo */}
      <Dialog open={dialogEditarPrazoOpen} onOpenChange={setDialogEditarPrazoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Prazo</DialogTitle>
            <DialogDescription>
              Atualize as informações do prazo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-titulo">Título *</Label>
              <Input
                id="edit-titulo"
                value={formPrazo.titulo}
                onChange={(e) =>
                  setFormPrazo({ ...formPrazo, titulo: e.target.value })
                }
                placeholder="Ex: Prazo para assinatura"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-dataPrazo">Data do Prazo *</Label>
              <Input
                id="edit-dataPrazo"
                type="date"
                value={formPrazo.dataPrazo}
                onChange={(e) =>
                  setFormPrazo({ ...formPrazo, dataPrazo: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-descricaoPrazo">Descrição</Label>
              <Textarea
                id="edit-descricaoPrazo"
                value={formPrazo.descricao}
                onChange={(e) =>
                  setFormPrazo({ ...formPrazo, descricao: e.target.value })
                }
                placeholder="Detalhes do prazo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogEditarPrazoOpen(false);
                setPrazoEditando(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => atualizarPrazoMutation.mutate()}
              disabled={atualizarPrazoMutation.isPending || !formPrazo.titulo || !formPrazo.dataPrazo}
            >
              {atualizarPrazoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

