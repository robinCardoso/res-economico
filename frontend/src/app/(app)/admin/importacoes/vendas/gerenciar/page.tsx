'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useVendas, useVendasStats, useDeleteVenda } from '@/hooks/use-vendas';
import { useEmpresas } from '@/hooks/use-empresas';
import type { FilterVendasDto } from '@/services/vendas.service';
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

export default function GerenciarVendasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: empresas } = useEmpresas();
  const deleteMutation = useDeleteVenda();

  // Filtros
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [nfe, setNfe] = useState<string>('');
  const [razaoSocial, setRazaoSocial] = useState<string>('');
  const [referencia, setReferencia] = useState<string>('');
  const [marca, setMarca] = useState<string>('');
  const [grupo, setGrupo] = useState<string>('');
  const [subgrupo, setSubgrupo] = useState<string>('');
  const [empresaId, setEmpresaId] = useState<string>('');

  // Estado para diálogo de confirmação de exclusão
  const [vendaParaExcluir, setVendaParaExcluir] = useState<string | null>(null);

  // Construir filtros
  const filters = useMemo(() => {
    const f: FilterVendasDto = {
      page,
      limit,
    };

    if (dataInicio) f.dataInicio = dataInicio;
    if (dataFim) f.dataFim = dataFim;
    if (nfe) f.nfe = nfe;
    if (razaoSocial) f.razaoSocial = razaoSocial;
    if (referencia) f.referencia = referencia;
    if (marca) f.marca = marca;
    if (grupo) f.grupo = grupo;
    if (subgrupo) f.subgrupo = subgrupo;
    if (empresaId) f.empresaId = empresaId;

    return f;
  }, [page, limit, dataInicio, dataFim, nfe, razaoSocial, referencia, marca, grupo, subgrupo, empresaId]);

  const { data: vendasData, isLoading, error } = useVendas(filters);
  const { data: stats } = useVendasStats(filters);

  // Resetar página quando filtros mudarem
  const handleFilterChange = () => {
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Venda excluída',
        description: 'A venda foi excluída com sucesso.',
      });
      setVendaParaExcluir(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir venda';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    // TODO: Implementar exportação para Excel/CSV
    toast({
      title: 'Exportação',
      description: 'Funcionalidade de exportação em desenvolvimento.',
    });
  };

  const vendas = vendasData?.data || [];
  const pagination = vendasData?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Vendas</h1>
          <p className="text-muted-foreground mt-2">
            Visualize, filtre e gerencie todas as vendas importadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => router.push('/admin/importacoes/vendas/importar')}>
            Nova Importação
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVendas.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {Number(stats.totalValor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuantidade.toLocaleString('pt-BR')}</div>
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
            Filtre as vendas por diferentes critérios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Select 
                value={empresaId || undefined} 
                onValueChange={(value) => { 
                  // Se selecionar "all", limpar o filtro
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
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {empresas?.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nomeFantasia || empresa.razaoSocial}
                    </SelectItem>
                  ))}
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
              <Label htmlFor="nfe">Nota Fiscal (NFE)</Label>
              <Input
                id="nfe"
                placeholder="Buscar por NFE..."
                value={nfe}
                onChange={(e) => { setNfe(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social</Label>
              <Input
                id="razaoSocial"
                placeholder="Buscar por cliente..."
                value={razaoSocial}
                onChange={(e) => { setRazaoSocial(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referência do Produto</Label>
              <Input
                id="referencia"
                placeholder="Buscar por referência..."
                value={referencia}
                onChange={(e) => { setReferencia(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                placeholder="Buscar por marca..."
                value={marca}
                onChange={(e) => { setMarca(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo">Grupo</Label>
              <Input
                id="grupo"
                placeholder="Buscar por grupo..."
                value={grupo}
                onChange={(e) => { setGrupo(e.target.value); handleFilterChange(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subgrupo">Subgrupo</Label>
              <Input
                id="subgrupo"
                placeholder="Buscar por subgrupo..."
                value={subgrupo}
                onChange={(e) => { setSubgrupo(e.target.value); handleFilterChange(); }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas</CardTitle>
          <CardDescription>
            {pagination.total > 0 && (
              <span>
                Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, pagination.total)} de {pagination.total} vendas
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
                Erro ao carregar vendas. Verifique se o backend está rodando.
              </AlertDescription>
            </Alert>
          ) : vendas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma venda encontrada com os filtros aplicados.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>NFE</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(venda.dataVenda).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{venda.nfe}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{venda.razaoSocial}</div>
                              {venda.nomeFantasia && (
                                <div className="text-sm text-muted-foreground">{venda.nomeFantasia}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{venda.referencia || venda.idProd || '-'}</div>
                            {venda.descricaoProduto && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {venda.descricaoProduto}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{venda.marca || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{venda.grupo || 'N/A'}</TableCell>
                        <TableCell>{venda.quantidade.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>
                          R$ {Number(venda.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-medium">
                          R$ {Number(venda.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{venda.ufDestino || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVendaParaExcluir(venda.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
      <AlertDialog open={!!vendaParaExcluir} onOpenChange={(open) => !open && setVendaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => vendaParaExcluir && handleDelete(vendaParaExcluir)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
