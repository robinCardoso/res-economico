'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { atasService } from '@/services/atas.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Search, Calendar, User, CheckCircle2, Clock, XCircle, AlertCircle, ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { format, isPast, parseISO, isToday, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type StatusType = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada' | 'todos';

interface DecisaoAcaoItem {
  id: string;
  tipo: 'decisao' | 'acao';
  descricao: string;
  responsavel?: string;
  prazo?: string;
  status?: StatusType;
  ataId: string;
  ataTitulo: string;
  ataData: string;
  index: number;
}

export default function DecisoesAcoesPage() {
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'decisao' | 'acao'>('todos');
  const [statusFiltro, setStatusFiltro] = useState<StatusType>('todos');
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>('');
  const [prazoFiltro, setPrazoFiltro] = useState<'todos' | 'vencidas' | 'hoje' | 'esta_semana' | 'futuras'>('todos');
  const [busca, setBusca] = useState('');
  const [itemEditando, setItemEditando] = useState<DecisaoAcaoItem | null>(null);
  const [isSalvando, setIsSalvando] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as atas
  const { data: atasData, isLoading } = useQuery({
    queryKey: ['atas', { page: 1, limit: 1000 }],
    queryFn: () => atasService.list({ page: 1, limit: 1000 }),
  });

  // Processar decisões e ações
  const itens = useMemo(() => {
    if (!atasData?.data) return [];

    const itensProcessados: DecisaoAcaoItem[] = [];

    atasData.data.forEach((ata) => {
      // Processar decisões
      if (ata.decisoes && Array.isArray(ata.decisoes)) {
        ata.decisoes.forEach((decisao: { id?: string; descricao?: string; responsavel?: string; prazo?: string; status?: string; concluida?: boolean }, index: number) => {
          const status = decisao.status || decisao.concluida ? 'concluida' : 'pendente';
          itensProcessados.push({
            id: decisao.id || `dec-${ata.id}-${index}`,
            tipo: 'decisao',
            descricao: decisao.descricao || '',
            responsavel: decisao.responsavel,
            prazo: decisao.prazo,
            status: status as StatusType,
            ataId: ata.id,
            ataTitulo: ata.titulo,
            ataData: ata.dataReuniao,
            index,
          });
        });
      }

      // Processar ações
      if (ata.acoes && Array.isArray(ata.acoes)) {
        ata.acoes.forEach((acao: { id?: string; descricao?: string; responsavel?: string; prazo?: string; status?: string; concluida?: boolean }, index: number) => {
          const status = acao.status || (acao.concluida ? 'concluida' : 'pendente');
          itensProcessados.push({
            id: acao.id || `acao-${ata.id}-${index}`,
            tipo: 'acao',
            descricao: acao.descricao || '',
            responsavel: acao.responsavel,
            prazo: acao.prazo,
            status: status as StatusType,
            ataId: ata.id,
            ataTitulo: ata.titulo,
            ataData: ata.dataReuniao,
            index,
          });
        });
      }
    });

    return itensProcessados;
  }, [atasData]);

  // Aplicar filtros
  const itensFiltrados = useMemo(() => {
    let filtrados = [...itens];

    // Filtro por tipo
    if (tipoFiltro !== 'todos') {
      filtrados = filtrados.filter((item) => item.tipo === tipoFiltro);
    }

    // Filtro por status
    if (statusFiltro !== 'todos') {
      filtrados = filtrados.filter((item) => item.status === statusFiltro);
    }

    // Filtro por responsável
    if (responsavelFiltro) {
      filtrados = filtrados.filter(
        (item) =>
          item.responsavel?.toLowerCase().includes(responsavelFiltro.toLowerCase())
      );
    }

    // Filtro por prazo
    if (prazoFiltro !== 'todos') {
      filtrados = filtrados.filter((item) => {
        if (!item.prazo) return false;
        try {
          const dataPrazo = parseISO(item.prazo);
          if (isNaN(dataPrazo.getTime())) return false;

          switch (prazoFiltro) {
            case 'vencidas':
              return isPast(dataPrazo) && !isToday(dataPrazo);
            case 'hoje':
              return isToday(dataPrazo);
            case 'esta_semana':
              return isThisWeek(dataPrazo) && !isToday(dataPrazo);
            case 'futuras':
              return !isPast(dataPrazo) && !isToday(dataPrazo) && !isThisWeek(dataPrazo);
            default:
              return true;
          }
        } catch {
          return false;
        }
      });
    }

    // Filtro por busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      filtrados = filtrados.filter(
        (item) =>
          item.descricao.toLowerCase().includes(buscaLower) ||
          item.ataTitulo.toLowerCase().includes(buscaLower) ||
          item.responsavel?.toLowerCase().includes(buscaLower)
      );
    }

    return filtrados;
  }, [itens, tipoFiltro, statusFiltro, responsavelFiltro, prazoFiltro, busca]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const decisoes = itens.filter((i) => i.tipo === 'decisao');
    const acoes = itens.filter((i) => i.tipo === 'acao');

    return {
      totalDecisoes: decisoes.length,
      decisoesPendentes: decisoes.filter((d) => d.status === 'pendente' || !d.status).length,
      decisoesVencidas: decisoes.filter((d) => {
        if (!d.prazo) return false;
        try {
          return isPast(parseISO(d.prazo)) && (d.status === 'pendente' || !d.status);
        } catch {
          return false;
        }
      }).length,
      totalAcoes: acoes.length,
      acoesPendentes: acoes.filter((a) => a.status === 'pendente' || !a.status).length,
      acoesVencidas: acoes.filter((a) => {
        if (!a.prazo) return false;
        try {
          return isPast(parseISO(a.prazo)) && (a.status === 'pendente' || !a.status);
        } catch {
          return false;
        }
      }).length,
    };
  }, [itens]);

  const getStatusColor = (status?: StatusType) => {
    switch (status) {
      case 'concluida':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status?: StatusType) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'em_andamento':
        return <Clock className="h-3 w-3" />;
      case 'cancelada':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status?: StatusType) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'em_andamento':
        return 'Em Andamento';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Pendente';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <FileText className="h-12 w-12 animate-pulse text-muted-foreground" />
        <span className="ml-3 text-lg text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Decisões e Ações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as decisões e ações de todas as atas
          </p>
        </div>
        <Link href="/admin/atas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Total de Decisões</CardTitle>
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">{estatisticas.totalDecisoes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.decisoesPendentes} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Total de Ações</CardTitle>
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">{estatisticas.totalAcoes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.acoesPendentes} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold text-red-600">
              {estatisticas.decisoesVencidas + estatisticas.acoesVencidas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.decisoesVencidas} decisões, {estatisticas.acoesVencidas} ações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Tipo</label>
              <Select value={tipoFiltro} onValueChange={(v: 'todos' | 'decisao' | 'acao') => setTipoFiltro(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="decisao">Decisões</SelectItem>
                  <SelectItem value="acao">Ações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Status</label>
              <Select value={statusFiltro} onValueChange={(v: StatusType) => setStatusFiltro(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Prazo</label>
              <Select value={prazoFiltro} onValueChange={(v: 'todos' | 'vencidas' | 'hoje' | 'esta_semana' | 'futuras') => setPrazoFiltro(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="vencidas">Vencidas</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="esta_semana">Esta Semana</SelectItem>
                  <SelectItem value="futuras">Futuras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Responsável</label>
              <Input
                placeholder="Filtrar por responsável..."
                value={responsavelFiltro}
                onChange={(e) => setResponsavelFiltro(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, ATA ou responsável..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {tipoFiltro === 'todos' 
              ? `Todos os Itens (${itensFiltrados.length})`
              : tipoFiltro === 'decisao'
              ? `Decisões (${itensFiltrados.length})`
              : `Ações (${itensFiltrados.length})`}
          </h2>
        </div>

        {itensFiltrados.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold mb-1.5">Nenhum item encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros para encontrar o que procura
              </p>
            </CardContent>
          </Card>
        ) : (
          itensFiltrados.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.tipo === 'decisao' ? 'Decisão' : 'Ação'}
                      </Badge>
                      <Badge className={`${getStatusColor(item.status)} text-xs`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">{getStatusLabel(item.status)}</span>
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{item.descricao}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {item.responsavel && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.responsavel}
                        </span>
                      )}
                        {item.prazo && (() => {
                          try {
                            const dataPrazo = parseISO(item.prazo);
                            if (isNaN(dataPrazo.getTime())) return null;
                            const isVencida = item.status !== 'concluida' && isPast(dataPrazo);
                            return (
                              <span className={`flex items-center gap-1 ${isVencida ? 'text-red-600 font-medium' : ''}`}>
                                <Calendar className="h-3 w-3" />
                                {format(dataPrazo, 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            );
                          } catch {
                            return (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {item.prazo}
                              </span>
                            );
                          }
                        })()}
                      <Link
                        href={`/admin/atas/${item.ataId}`}
                        className="flex items-center gap-1 text-sky-600 hover:text-sky-700"
                      >
                        <FileText className="h-3 w-3" />
                        {item.ataTitulo}
                      </Link>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setItemEditando(item)}
                    className="h-8 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Edição */}
      {itemEditando && (
        <Dialog open={!!itemEditando} onOpenChange={(open) => !open && setItemEditando(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Editar {itemEditando.tipo === 'decisao' ? 'Decisão' : 'Ação'}
              </DialogTitle>
              <DialogDescription>
                ATA: {itemEditando.ataTitulo}
              </DialogDescription>
            </DialogHeader>
            <EditarItemForm
              item={itemEditando}
              onSave={async (updates) => {
                setIsSalvando(true);
                try {
                  // Buscar token
                  const authStorage = localStorage.getItem('auth-storage');
                  let token = '';
                  if (authStorage) {
                    try {
                      const auth = JSON.parse(authStorage);
                      token = auth?.state?.token || '';
                    } catch {}
                  }

                  // Buscar ATA atual
                  const ataResponse = await fetch(`/api/admin/atas/${itemEditando.ataId}`, {
                    headers: {
                      'Authorization': token ? `Bearer ${token}` : '',
                      'Content-Type': 'application/json',
                    },
                  });

                  if (!ataResponse.ok) {
                    throw new Error('Erro ao buscar ATA');
                  }

                  const ata = await ataResponse.json();
                  const arrayAtual = itemEditando.tipo === 'decisao' ? ata.decisoes : ata.acoes;
                  const arrayAtualizado = [...(Array.isArray(arrayAtual) ? arrayAtual : [])];
                  
                  // Atualizar item no array
                  arrayAtualizado[itemEditando.index] = {
                    ...arrayAtualizado[itemEditando.index],
                    ...updates,
                  };

                  // Salvar no backend
                  const endpoint = itemEditando.tipo === 'decisao' ? 'decisoes' : 'acoes';
                  const response = await fetch(`/api/admin/atas/${itemEditando.ataId}/${endpoint}`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': token ? `Bearer ${token}` : '',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      [itemEditando.tipo === 'decisao' ? 'decisoes' : 'acoes']: arrayAtualizado,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Erro ao salvar alterações');
                  }

                  // Invalidar queries
                  await queryClient.invalidateQueries({ queryKey: ['atas'] });

                  toast({
                    title: 'Sucesso',
                    description: `${itemEditando.tipo === 'decisao' ? 'Decisão' : 'Ação'} atualizada com sucesso!`,
                  });

                  setItemEditando(null);
                } catch (error) {
                  toast({
                    title: 'Erro',
                    description: error instanceof Error ? error.message : 'Erro ao salvar alterações',
                    variant: 'destructive',
                  });
                } finally {
                  setIsSalvando(false);
                }
              }}
              onCancel={() => setItemEditando(null)}
              isSalvando={isSalvando}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Componente de Formulário de Edição
interface EditarItemFormProps {
  item: DecisaoAcaoItem;
  onSave: (updates: Partial<DecisaoAcaoItem>) => Promise<void>;
  onCancel: () => void;
  isSalvando: boolean;
}

function EditarItemForm({ item, onSave, onCancel, isSalvando }: EditarItemFormProps) {
  const [descricao, setDescricao] = useState(item.descricao);
  const [responsavel, setResponsavel] = useState(item.responsavel || '');
  const [prazo, setPrazo] = useState(() => {
    if (!item.prazo) return '';
    try {
      const data = parseISO(item.prazo);
      if (isNaN(data.getTime())) return '';
      return format(data, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  });
  const [status, setStatus] = useState<StatusType>(item.status || 'pendente');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<DecisaoAcaoItem> = {
      descricao,
      responsavel: responsavel || undefined,
      prazo: prazo ? (() => {
        try {
          const data = parseISO(prazo);
          if (isNaN(data.getTime())) return undefined;
          return data.toISOString();
        } catch {
          return undefined;
        }
      })() : undefined,
      status,
    };

    await onSave(updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          className="min-h-[100px]"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="responsavel">Responsável</Label>
          <Input
            id="responsavel"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            placeholder="Nome do responsável"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prazo">Prazo</Label>
          <Input
            id="prazo"
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v: StatusType) => setStatus(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSalvando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSalvando || !descricao.trim()}>
          {isSalvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
}

