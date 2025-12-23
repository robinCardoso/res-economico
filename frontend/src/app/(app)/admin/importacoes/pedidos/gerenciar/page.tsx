'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePedidos, usePedidosStats, useDeletePedido, usePedido, useMarcas, useGrupos, useSubgrupos } from '@/hooks/use-pedidos';
import { useEmpresas } from '@/hooks/use-empresas';
import { useDebounce } from '@/hooks/use-debounce';
import type { FilterPedidosDto } from '@/services/pedidos.service';
import { 
  Calendar, 
  Building2, 
  Package, 
  DollarSign, 
  Filter,
  Download,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function GerenciarPedidosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: empresas } = useEmpresas();
  const { data: marcas = [] } = useMarcas();
  const { data: grupos = [] } = useGrupos();
  const { data: subgrupos = [] } = useSubgrupos();
  const deleteMutation = useDeletePedido();

  // Filtros (valores locais para inputs)
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [numeroPedidoInput, setNumeroPedidoInput] = useState<string>('');
  const [nomeFantasiaInput, setNomeFantasiaInput] = useState<string>('');
  const [referenciaInput, setReferenciaInput] = useState<string>('');
  const [marca, setMarca] = useState<string>('');
  const [grupo, setGrupo] = useState<string>('');
  const [subgrupo, setSubgrupo] = useState<string>('');
  const [empresaId, setEmpresaId] = useState<string>('');

  // Debounce nos filtros de texto (500ms)
  const numeroPedido = useDebounce(numeroPedidoInput, 500);
  const nomeFantasia = useDebounce(nomeFantasiaInput, 500);
  const referencia = useDebounce(referenciaInput, 500);

  // Estado para diálogo de confirmação de exclusão
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<string | null>(null);
  
  // Estado para visualização de detalhes
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);

  // Construir filtros
  const filters = useMemo(() => {
    const f: FilterPedidosDto = {
      page,
      limit,
    };

    if (dataInicio) f.dataInicio = dataInicio;
    if (dataFim) f.dataFim = dataFim;
    if (numeroPedido) f.numeroPedido = numeroPedido;
    if (nomeFantasia) f.nomeFantasia = nomeFantasia;
    if (referencia) f.referencia = referencia;
    if (marca) f.marca = marca;
    if (grupo) f.grupo = grupo;
    if (subgrupo) f.subgrupo = subgrupo;
    if (empresaId) f.empresaId = empresaId;

    return f;
  }, [page, limit, dataInicio, dataFim, numeroPedido, nomeFantasia, referencia, marca, grupo, subgrupo, empresaId]);

  const { data: pedidosData, isLoading, error } = usePedidos(filters);
  const { data: stats } = usePedidosStats(filters);

  // Resetar página quando filtros mudarem
  const handleFilterChange = () => {
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Pedido excluído',
        description: 'O pedido foi excluído com sucesso.',
      });
      setPedidoParaExcluir(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir pedido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    try {
      // Criar CSV com os dados filtrados
      const headers = [
        'Data do Pedido',
        'Número do Pedido',
        'ID do Documento',
        'Nome Fantasia',
        'Referência',
        'Descrição Produto',
        'Marca',
        'Grupo',
        'Subgrupo',
        'Quantidade',
        'Valor Unitário',
        'Valor Total',
      ];

      const rows = pedidos.map((pedido) => [
        new Date(pedido.dataPedido).toLocaleDateString('pt-BR'),
        pedido.numeroPedido || '',
        pedido.idDoc || '',
        pedido.nomeFantasia || '',
        pedido.referencia || pedido.idProd || '',
        pedido.descricaoProduto || '',
        pedido.marca || '',
        pedido.grupo || '',
        pedido.subgrupo || '',
        pedido.quantidade?.toString() || '0',
        pedido.valorUnitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00',
        pedido.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00',
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
      ].join('\n');

      // Criar blob e fazer download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Exportação concluída',
        description: `Arquivo CSV com ${pedidos.length} pedidos foi baixado.`,
      });
    } catch {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados.',
        variant: 'destructive',
      });
    }
  };

  const pedidos = pedidosData?.data || [];
  const pagination = pedidosData?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Pedidos</h1>
          <p className="text-muted-foreground mt-2">
            Visualize, filtre e gerencie todos os pedidos importados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => router.push('/admin/importacoes/pedidos/importar')}>
            Nova Importação
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof stats.totalPedidos === 'number' 
                  ? stats.totalPedidos.toLocaleString('pt-BR') 
                  : '0'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.totalValor !== undefined && stats.totalValor !== null
                  ? Number(stats.totalValor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0,00'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof stats.totalQuantidade === 'number' 
                  ? stats.totalQuantidade.toLocaleString('pt-BR') 
                  : '0'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os pedidos por diferentes critérios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Select 
                value={empresaId || undefined} 
                onValueChange={(value) => { 
                  if (value === 'all') {
                    setEmpresaId('');
                  } else {
                    setEmpresaId(value);
                  }
                  handleFilterChange(); 
                }}
              >
                <SelectTrigger id="empresa">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent className="[&>div]:max-h-[17rem]">
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {empresas?.map((empresa) => {
                    const displayText = empresa.razaoSocial && empresa.filial
                      ? `${empresa.razaoSocial} - ${empresa.filial}`
                      : empresa.razaoSocial || empresa.filial || 'Empresa sem nome';
                    return (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {displayText}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => { setDataFim(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroPedido">Número do Pedido</Label>
              <Input
                id="numeroPedido"
                placeholder="Buscar por número do pedido..."
                value={numeroPedidoInput}
                onChange={(e) => { setNumeroPedidoInput(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
              <Input
                id="nomeFantasia"
                placeholder="Buscar por cliente..."
                value={nomeFantasiaInput}
                onChange={(e) => { setNomeFantasiaInput(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referência do Produto</Label>
              <Input
                id="referencia"
                placeholder="Buscar por referência..."
                value={referenciaInput}
                onChange={(e) => { setReferenciaInput(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Select
                value={marca}
                onValueChange={(value) => {
                  setMarca(value === 'all' ? '' : value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger id="marca">
                  <SelectValue placeholder="Selecione a marca..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {marcas.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo">Grupo</Label>
              <Select
                value={grupo}
                onValueChange={(value) => {
                  setGrupo(value === 'all' ? '' : value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger id="grupo">
                  <SelectValue placeholder="Selecione o grupo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {grupos.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subgrupo">Subgrupo</Label>
              <Select
                value={subgrupo}
                onValueChange={(value) => {
                  setSubgrupo(value === 'all' ? '' : value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger id="subgrupo">
                  <SelectValue placeholder="Selecione o subgrupo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {subgrupos.map((sg) => (
                    <SelectItem key={sg} value={sg}>
                      {sg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>
            {pagination.total > 0 && (
              <span>
                Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, pagination.total)} de {pagination.total} pedidos
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar pedidos. Verifique se o backend está rodando.
              </AlertDescription>
            </Alert>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pedido encontrado com os filtros aplicados.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="w-full" style={{ tableLayout: 'auto' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-4 py-2">Data</TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-2">Número do Pedido</TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-2">Cliente</TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-2">Produto</TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-2">Marca</TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-2">Grupo</TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-2">Quantidade</TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-2">Valor Unit.</TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-2">Valor Total</TableHead>
                      <TableHead className="text-center whitespace-nowrap px-4 py-2">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidos.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="whitespace-normal break-words px-4 py-2 align-top min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-normal break-words px-4 py-2 align-top min-w-[100px]">
                          {pedido.numeroPedido}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words px-4 py-2 align-top min-w-[150px]">
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium break-words">{pedido.nomeFantasia || '-'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words px-4 py-2 align-top min-w-[150px]">
                          <div className="max-w-none">
                            <div className="font-medium break-words">{pedido.referencia || pedido.idProd || '-'}</div>
                            {pedido.descricaoProduto && (
                              <div className="text-sm text-muted-foreground break-words">
                                {pedido.descricaoProduto}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words px-4 py-2 align-top min-w-[100px]">
                          <Badge variant="outline">{pedido.marca || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words px-4 py-2 align-top min-w-[100px]">
                          {pedido.grupo || 'N/A'}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words px-4 py-2 align-top min-w-[100px]">
                          {pedido.quantidade !== undefined && pedido.quantidade !== null
                            ? Number(pedido.quantidade).toLocaleString('pt-BR')
                            : '0'}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words px-4 py-2 align-top min-w-[100px]">
                          R$ {pedido.valorUnitario !== undefined && pedido.valorUnitario !== null
                            ? Number(pedido.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0,00'}
                        </TableCell>
                        <TableCell className="font-medium whitespace-normal break-words px-4 py-2 align-top min-w-[100px]">
                          R$ {pedido.valorTotal !== undefined && pedido.valorTotal !== null
                            ? Number(pedido.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0,00'}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap px-4 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPedidoSelecionado(pedido.id);
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPedidoParaExcluir(pedido.id);
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={!!pedidoParaExcluir} onOpenChange={(open) => !open && setPedidoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pedidoParaExcluir && handleDelete(pedidoParaExcluir)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Detalhes do Pedido */}
      {pedidoSelecionado && (
        <PedidoDetailsModal
          pedidoId={pedidoSelecionado}
          onClose={() => setPedidoSelecionado(null)}
        />
      )}
    </div>
  );
}

// Componente Modal de Detalhes
function PedidoDetailsModal({ pedidoId, onClose }: { pedidoId: string; onClose: () => void }) {
  const { data: pedido, isLoading } = usePedido(pedidoId);

  if (!pedido && !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Detalhes do Pedido</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pedido ? (
          <div className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informações do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Data do Pedido</Label>
                    <p className="font-medium">{new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Número do Pedido</Label>
                    <p className="font-mono font-medium">{pedido.numeroPedido}</p>
                  </div>
                  {pedido.idDoc && (
                    <div>
                      <Label className="text-xs text-muted-foreground">ID do Documento</Label>
                      <p className="font-medium">{pedido.idDoc}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome Fantasia</Label>
                    <p className="font-medium">{pedido.nomeFantasia || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Produto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pedido.referencia && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Referência</Label>
                      <p className="font-medium">{pedido.referencia}</p>
                    </div>
                  )}
                  {pedido.idProd && (
                    <div>
                      <Label className="text-xs text-muted-foreground">ID Produto</Label>
                      <p className="font-medium">{pedido.idProd}</p>
                    </div>
                  )}
                  {pedido.descricaoProduto && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Descrição</Label>
                      <p className="font-medium">{pedido.descricaoProduto}</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    {pedido.marca && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Marca</Label>
                        <Badge variant="outline">{pedido.marca}</Badge>
                      </div>
                    )}
                    {pedido.grupo && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Grupo</Label>
                        <p className="font-medium">{pedido.grupo}</p>
                      </div>
                    )}
                    {pedido.subgrupo && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Subgrupo</Label>
                        <p className="font-medium">{pedido.subgrupo}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Valores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantidade</Label>
                    <p className="text-2xl font-bold">
                      {pedido.quantidade !== undefined && pedido.quantidade !== null
                        ? Number(pedido.quantidade).toLocaleString('pt-BR')
                        : '0'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor Unitário</Label>
                    <p className="text-xl font-semibold">
                      R$ {pedido.valorUnitario !== undefined && pedido.valorUnitario !== null
                        ? Number(pedido.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0,00'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor Total</Label>
                    <p className="text-2xl font-bold text-primary">
                      R$ {pedido.valorTotal !== undefined && pedido.valorTotal !== null
                        ? Number(pedido.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0,00'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {pedido.empresa && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {pedido.empresa.razaoSocial}
                    {pedido.empresa.nomeFantasia && ` - ${pedido.empresa.nomeFantasia}`}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

