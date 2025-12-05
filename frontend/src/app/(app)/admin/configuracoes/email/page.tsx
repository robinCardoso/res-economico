'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configuracoesService, type CreateConfiguracaoEmailDto, type UpdateConfiguracaoEmailDto, type TestarEmailDto } from '@/services/configuracoes.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit, Send, TestTube } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ConfiguracaoEmailPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [hostValue, setHostValue] = useState<string>('');

  const { data: configuracoes, isLoading } = useQuery({
    queryKey: ['configuracoes-email'],
    queryFn: () => configuracoesService.listar(),
  });

  const createMutation = useMutation({
    mutationFn: configuracoesService.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-email'] });
      toast({
        title: 'Sucesso',
        description: 'Configuração criada com sucesso!',
      });
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar configuração',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateConfiguracaoEmailDto }) =>
      configuracoesService.atualizar(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-email'] });
      toast({
        title: 'Sucesso',
        description: 'Configuração atualizada com sucesso!',
      });
      setEditingId(null);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erro ao atualizar configuração';
      
      // Se a configuração não foi encontrada, pode ter sido removida
      if (errorMessage.includes('não encontrada') || errorMessage.includes('not found')) {
        toast({
          title: 'Configuração não encontrada',
          description: 'A configuração pode ter sido removida. Recarregando lista...',
          variant: 'destructive',
        });
        queryClient.invalidateQueries({ queryKey: ['configuracoes-email'] });
        setEditingId(null);
      } else {
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: configuracoesService.remover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-email'] });
      toast({
        title: 'Sucesso',
        description: 'Configuração removida com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover configuração',
        variant: 'destructive',
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => configuracoesService.testarConexao(id),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Conexão SMTP testada com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao testar conexão',
        variant: 'destructive',
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: TestarEmailDto }) =>
      configuracoesService.testarEmail(id, dto),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'E-mail de teste enviado com sucesso!',
      });
      setTestDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar e-mail de teste',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get('nome') as string,
      host: formData.get('host') as string,
      porta: parseInt(formData.get('porta') as string),
      autenticar: formData.get('autenticar') === 'true',
      usuario: formData.get('usuario') as string,
      senha: formData.get('senha') as string,
      copiasPara: formData.get('copiasPara') as string || undefined,
      ativo: formData.get('ativo') === 'true',
    };

    // Se editingId for 'new' ou não existir, criar nova configuração
    if (editingId && editingId !== 'new') {
      // Verificar se a configuração existe na lista atual
      const configExiste = configuracoes?.some((c) => c.id === editingId);
      
      if (!configExiste) {
        toast({
          title: 'Aviso',
          description: 'Configuração não encontrada na lista. Recarregando...',
          variant: 'default',
        });
        // Recarregar lista e criar nova configuração
        queryClient.invalidateQueries({ queryKey: ['configuracoes-email'] });
        createMutation.mutate(data);
        setEditingId(null);
        return;
      }

      // Se não tem senha preenchida, remover do DTO para não atualizar
      const dtoParaEnviar = !data.senha || data.senha.trim() === ''
        ? (() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { senha, ...dataSemSenha } = data;
            return dataSemSenha;
          })()
        : data;

      updateMutation.mutate({ id: editingId, dto: dtoParaEnviar });
    } else {
      createMutation.mutate(data);
    }
  };

  const configuracaoEditando = editingId
    ? configuracoes?.find((c) => c.id === editingId)
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configurações de E-mail</CardTitle>
              <CardDescription>
                Configure o envio de e-mails do sistema via SMTP
              </CardDescription>
            </div>
            <Button
              onClick={() => setEditingId('new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Configuração
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : configuracoes && configuracoes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Porta</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configuracoes.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.nome}</TableCell>
                    <TableCell>{config.host}</TableCell>
                    <TableCell>{config.porta}</TableCell>
                    <TableCell>{config.usuario}</TableCell>
                    <TableCell>
                      {config.ativo ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedConfigId(config.id);
                            setTestDialogOpen(true);
                          }}
                          title="Testar envio"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            testConnectionMutation.mutate(config.id)
                          }
                          disabled={testConnectionMutation.isPending}
                          title="Testar conexão"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(config.id)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                'Tem certeza que deseja remover esta configuração?',
                              )
                            ) {
                              deleteMutation.mutate(config.id);
                            }
                          }}
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma configuração cadastrada. Clique em &quot;Nova Configuração&quot; para
              começar.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição/Criação */}
      {(editingId === 'new' || editingId) && (
        <Dialog
          open={!!editingId}
          onOpenChange={(open) => {
            if (!open) {
              setEditingId(null);
              setHostValue('');
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId === 'new'
                  ? 'Nova Configuração de E-mail'
                  : 'Editar Configuração de E-mail'}
              </DialogTitle>
              <DialogDescription>
                Configure os parâmetros SMTP para envio de e-mails
              </DialogDescription>
              {(hostValue === 'smtp.gmail.com' || configuracaoEditando?.host === 'smtp.gmail.com') && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                  <strong>⚠️ Gmail com 2FA:</strong> Use senha de aplicativo, não sua senha normal.{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    Gerar senha de aplicativo
                  </a>
                </div>
              )}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Configuração</Label>
                  <Input
                    id="nome"
                    name="nome"
                    defaultValue={configuracaoEditando?.nome}
                    required
                    placeholder="Ex: Principal, Backup"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="host">Host SMTP</Label>
                  <Input
                    id="host"
                    name="host"
                    defaultValue={configuracaoEditando?.host}
                    required
                    placeholder="smtp.gmail.com"
                    onChange={(e) => setHostValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="porta">Porta</Label>
                  <select
                    id="porta"
                    name="porta"
                    defaultValue={configuracaoEditando?.porta.toString() || '587'}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="25">25</option>
                    <option value="587">587 (TLS)</option>
                    <option value="465">465 (SSL)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autenticar">Autenticar por SMTP</Label>
                  <select
                    id="autenticar"
                    name="autenticar"
                    defaultValue={
                      configuracaoEditando?.autenticar !== false ? 'true' : 'false'
                    }
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário (E-mail)</Label>
                <Input
                  id="usuario"
                  name="usuario"
                  type="email"
                  defaultValue={configuracaoEditando?.usuario}
                  required
                  placeholder="contato@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">
                  {editingId === 'new' ? 'Senha' : 'Nova Senha (deixe em branco para manter)'}
                </Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  required={editingId === 'new' || editingId === null}
                  placeholder="••••••••"
                />
                {(hostValue === 'smtp.gmail.com' || configuracaoEditando?.host === 'smtp.gmail.com') && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Para Gmail com 2FA, use{' '}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      senha de aplicativo
                    </a>
                    , não sua senha normal.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="copiasPara">
                  Enviar cópias para (opcional)
                </Label>
                <Input
                  id="copiasPara"
                  name="copiasPara"
                  type="text"
                  defaultValue={configuracaoEditando?.copiasPara}
                  placeholder="email1@servidor.com; email2@servidor.com"
                />
                <p className="text-xs text-muted-foreground">
                  Separe múltiplos e-mails com ponto e vírgula (;)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="hidden"
                  name="ativo"
                  value={
                    configuracaoEditando?.ativo !== false ? 'true' : 'false'
                  }
                />
                <Switch
                  id="ativo"
                  defaultChecked={configuracaoEditando?.ativo !== false}
                  onCheckedChange={(checked) => {
                    const input = document.querySelector(
                      'input[name="ativo"]',
                    ) as HTMLInputElement;
                    if (input) input.value = checked ? 'true' : 'false';
                  }}
                />
                <Label htmlFor="ativo">Ativar esta configuração</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Teste de E-mail */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar E-mail de Teste</DialogTitle>
            <DialogDescription>
              Envie um e-mail de teste para verificar se a configuração está
              funcionando
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (selectedConfigId) {
                testEmailMutation.mutate({
                  id: selectedConfigId,
                  dto: {
                    destinatario: formData.get('destinatario') as string,
                    assunto: formData.get('assunto') as string || undefined,
                    corpo: formData.get('corpo') as string || undefined,
                  },
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="destinatario">Destinatário</Label>
              <Input
                id="destinatario"
                name="destinatario"
                type="email"
                required
                placeholder="Ex: email1@servidor.com; email2@servidor.com"
              />
              <p className="text-xs text-muted-foreground">
                Separe múltiplos e-mails com ponto e vírgula (;)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto (opcional)</Label>
              <Input
                id="assunto"
                name="assunto"
                placeholder="Teste de E-mail - Sistema"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTestDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={testEmailMutation.isPending}
              >
                {testEmailMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

