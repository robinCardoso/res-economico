'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Filter, Eye, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/http';

// Schema para filtros
const FiltrosSchema = z.object({
  situacao: z.string().optional(),
  tipo: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  uf: z.string().optional(),
  fabrica: z.string().optional(),
  protocolo: z.string().optional()
});

type FiltrosForm = z.infer<typeof FiltrosSchema>;

// Tipos para Processo
type ProcessoCompleto = {
  id: string;
  numeroControle: string;
  protocolo: string;
  tipo: string;
  situacao: string;
  nomeClienteAssociado: string;
  razaoSocial: string;
  dataSolicitacao: string;
  prazoResolucao?: string;
  entidade?: {
    id: string;
    nomeRazaoSocial: string;
    nomeFantasia?: string;
    uf?: string;
  };
};

type GetProcessosOutput = {
  success: boolean;
  message: string;
  processos: ProcessoCompleto[];
  total: number;
  paginaAtual: number;
  totalPaginas: number;
};

// Função para obter cor do badge baseado na situação
const getSituacaoBadge = (situacao: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Aguardando Análise': 'secondary',
    'Em Análise': 'default',
    'Aprovado': 'default',
    'Rejeitado': 'destructive',
    'Em Processamento': 'default',
    'Concluído': 'default',
    'Cancelado': 'destructive'
  };
  return variants[situacao] || 'outline';
};

// Função para obter ícone baseado na situação
const getSituacaoIcon = (situacao: string) => {
  const icons: Record<string, React.ComponentType<Record<string, unknown>>> = {
    'Aguardando Análise': Clock,
    'Em Análise': Eye,
    'Aprovado': CheckCircle,
    'Rejeitado': XCircle,
    'Em Processamento': Clock,
    'Concluído': CheckCircle,
    'Cancelado': XCircle
  };
  return icons[situacao] || AlertCircle;
};

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<ProcessoCompleto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const { user } = useAuthStore();
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue, reset } = useForm<FiltrosForm>({
    resolver: zodResolver(FiltrosSchema)
  });

  // Carregar processos
  const loadProcessos = useCallback(async (filtros?: Partial<FiltrosForm>, pagina = 1) => {
    if (!user?.email) {
      setError('Usuário não autenticado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userEmail: user.email,
        limite: '20',
        offset: ((pagina - 1) * 20).toString()
      });

      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value) {
            // Converter snake_case para camelCase
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            params.append(camelKey, value);
          }
        });
      }

      const response = await api.get<GetProcessosOutput>(`/processos?${params.toString()}`);

      if (response.data.success) {
        setProcessos(response.data.processos);
        setTotal(response.data.total);
        setPaginaAtual(response.data.paginaAtual);
        setTotalPaginas(response.data.totalPaginas);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar processos:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao carregar processos';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, toast]);

  // Inicializar e carregar dados
  useEffect(() => {
    if (user?.email) {
      loadProcessos();
    }
  }, [user?.email, loadProcessos]);

  // Aplicar filtros
  const onSubmitFiltros = (data: FiltrosForm) => {
    if (user?.email) {
      // Converter "all" para undefined para não filtrar
      const filtrosLimpos = {
        ...data,
        situacao: data.situacao === 'all' ? undefined : data.situacao,
        tipo: data.tipo === 'all' ? undefined : data.tipo
      };
      loadProcessos(filtrosLimpos, 1);
    }
  };

  // Limpar filtros
  const limparFiltros = () => {
    reset();
    if (user?.email) {
      loadProcessos({}, 1);
    }
  };

  // Formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (error && !isLoading && error !== 'TABELAS_NAO_CRIADAS') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Processos</h1>
          <p className="text-muted-foreground">
            Gerencie processos de garantia, devolução e reclamações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{total} processos</Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitFiltros)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="situacao">Situação</Label>
              <Select onValueChange={(value) => setValue('situacao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as situações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situações</SelectItem>
                  <SelectItem value="Aguardando Análise">Aguardando Análise</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="Em Processamento">Em Processamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select onValueChange={(value) => setValue('tipo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Garantia">Garantia</SelectItem>
                  <SelectItem value="Devolução">Devolução</SelectItem>
                  <SelectItem value="Reclamação">Reclamação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                placeholder="Ex: SP, RJ, MG"
                {...register('uf')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabrica">Fábrica</Label>
              <Input
                id="fabrica"
                placeholder="Nome da fábrica"
                {...register('fabrica')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protocolo">Protocolo</Label>
              <Input
                id="protocolo"
                placeholder="Ex: SC-000001-2025"
                {...register('protocolo')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                {...register('data_inicio')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                {...register('data_fim')}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Filtrar
              </Button>
              <Button type="button" variant="outline" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Processos */}
      <Card>
        <CardHeader>
          <CardTitle>Processos</CardTitle>
          <CardDescription>
            Lista de todos os processos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : processos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum processo encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {/* Vista compacta para mobile */}
              <div className="block lg:hidden space-y-3">
                {processos.map((processo) => {
                  const SituacaoIcon = getSituacaoIcon(processo.situacao);
                  return (
                    <Card key={processo.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-medium text-primary">
                                {processo.protocolo || '—'}
                              </span>
                              {processo.numeroControle && (
                                <span className="text-[10px] text-muted-foreground">
                                  Nº controle: {processo.numeroControle}
                                </span>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {processo.tipo}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <SituacaoIcon className="h-3 w-3" />
                              <span>{processo.situacao}</span>
                            </div>
                            <div className="truncate">{processo.nomeClienteAssociado}</div>
                            <div>{formatarData(processo.dataSolicitacao)}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Vista detalhada para desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-40 text-xs font-medium">Protocolo</TableHead>
                      <TableHead className="w-20 text-xs font-medium">Tipo</TableHead>
                      <TableHead className="w-28 text-xs font-medium">Situação</TableHead>
                      <TableHead className="w-40 text-xs font-medium hidden md:table-cell">Cliente</TableHead>
                      <TableHead className="w-32 text-xs font-medium hidden lg:table-cell">Empresa</TableHead>
                      <TableHead className="w-24 text-xs font-medium">Data</TableHead>
                      <TableHead className="w-24 text-xs font-medium hidden lg:table-cell">Prazo</TableHead>
                      <TableHead className="w-16 text-xs font-medium">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processos.map((processo) => {
                      const SituacaoIcon = getSituacaoIcon(processo.situacao);
                      return (
                        <TableRow key={processo.id} className="text-xs hover:bg-muted/50">
                          <TableCell className="font-mono text-xs py-2">
                            <div className="truncate" title={processo.protocolo || processo.numeroControle || ''}>
                              {processo.protocolo || '—'}
                            </div>
                            {processo.numeroControle && (
                              <div className="text-[10px] text-muted-foreground mt-0.5 truncate" title={processo.numeroControle}>
                                Nº controle: {processo.numeroControle}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {processo.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant={getSituacaoBadge(processo.situacao)} className="flex items-center gap-1 text-xs px-2 py-0.5 w-fit">
                              <SituacaoIcon className="h-3 w-3" />
                              <span className="hidden sm:inline">{processo.situacao}</span>
                              <span className="sm:hidden">
                                {processo.situacao.length > 10 ? processo.situacao.substring(0, 10) + '...' : processo.situacao}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 hidden md:table-cell">
                            <div className="truncate max-w-[160px]" title={processo.nomeClienteAssociado}>
                              {processo.nomeClienteAssociado}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 hidden lg:table-cell">
                            <div className="truncate max-w-[120px]" title={processo.entidade?.nomeRazaoSocial || processo.razaoSocial || 'N/A'}>
                              {processo.entidade?.nomeRazaoSocial || processo.razaoSocial || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-xs">
                              {formatarData(processo.dataSolicitacao)}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 hidden lg:table-cell">
                            <div className="text-xs">
                              {processo.prazoResolucao ? formatarData(processo.prazoResolucao) : '-'}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual === 1}
                    onClick={() => loadProcessos(watch(), paginaAtual - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual === totalPaginas}
                    onClick={() => loadProcessos(watch(), paginaAtual + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

