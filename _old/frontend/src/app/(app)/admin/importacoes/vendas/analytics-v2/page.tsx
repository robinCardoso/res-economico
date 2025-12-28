'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsFilters } from '@/components/vendas/analytics/AnalyticsFilters';
import { CrescimentoEmpresaTable } from '@/components/vendas/analytics/CrescimentoEmpresaTable';
import { CrescimentoFilialTable } from '@/components/vendas/analytics/CrescimentoFilialTable';
import { CrescimentoMarcaTable } from '@/components/vendas/analytics/CrescimentoMarcaTable';
import { CrescimentoAssociadoTable } from '@/components/vendas/analytics/CrescimentoAssociadoTable';
import { FilialAssociadoTable } from '@/components/vendas/analytics/FilialAssociadoTable';
import { ExportButton } from '@/components/vendas/analytics/ExportButton';
import { analyticsV2Service } from '@/services/vendas.service';
import type { AnalyticsFilters as AnalyticsFiltersType } from '@/services/vendas.service';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  useVendaAnalyticsFilters,
  useCreateVendaAnalyticsFilter,
  useUpdateVendaAnalyticsFilter,
  useDeleteVendaAnalyticsFilter,
} from '@/hooks/use-vendas';
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
import {
  exportCrescimentoEmpresaExcel,
  exportCrescimentoEmpresaCSV,
  exportCrescimentoFilialExcel,
  exportCrescimentoFilialCSV,
  exportCrescimentoMarcaExcel,
  exportCrescimentoMarcaCSV,
  exportCrescimentoAssociadoExcel,
  exportCrescimentoAssociadoCSV,
  exportFilialAssociadoExcel,
  exportFilialAssociadoCSV,
} from '@/utils/export-analytics';

export default function AnalyticsVendasV2Page() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AnalyticsFiltersType>({});
  const [activeTab, setActiveTab] = useState('empresa');
  const [associadoPage, setAssociadoPage] = useState(1);
  
  // Estados para salvar/carregar filtros
  const [newFilterName, setNewFilterName] = useState('');
  const [selectedFilterId, setSelectedFilterId] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);
  
  // Hooks para filtros salvos
  const { data: savedFilters = [] } = useVendaAnalyticsFilters();
  const createFilterMutation = useCreateVendaAnalyticsFilter();
  const updateFilterMutation = useUpdateVendaAnalyticsFilter();
  const deleteFilterMutation = useDeleteVendaAnalyticsFilter();
  
  // Verifica se está editando um filtro existente
  const isEditing = !!selectedFilterId;
  const selectedFilter = savedFilters.find(f => f.id === selectedFilterId);

  // Função para comparar dois objetos de filtros (comparação profunda)
  const filtersAreEqual = (f1: AnalyticsFiltersType, f2: AnalyticsFiltersType): boolean => {
    const keys = new Set([...Object.keys(f1), ...Object.keys(f2)]);
    for (const key of keys) {
      const val1 = f1[key as keyof AnalyticsFiltersType];
      const val2 = f2[key as keyof AnalyticsFiltersType];
      
      // Se ambos são undefined, são iguais
      if (val1 === undefined && val2 === undefined) continue;
      
      // Se um é undefined e o outro não, são diferentes
      if (val1 === undefined || val2 === undefined) return false;
      
      // Comparar arrays (ordenados)
      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        const sorted1 = [...val1].sort();
        const sorted2 = [...val2].sort();
        if (JSON.stringify(sorted1) !== JSON.stringify(sorted2)) return false;
      } else if (val1 !== val2) {
        return false;
      }
    }
    return true;
  };

  // Verifica se os filtros atuais são diferentes do filtro selecionado
  const filtersChanged = selectedFilter 
    ? !filtersAreEqual(filters, selectedFilter.filters)
    : Object.keys(filters).length > 0;

  const handleSaveFilter = async () => {
    if (!newFilterName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Digite um nome para o filtro',
      });
      return;
    }

    try {
      // Se os filtros foram alterados ou não há filtro selecionado, sempre criar novo
      // Só atualiza se os filtros são iguais e há um filtro selecionado
      const shouldUpdate = isEditing && selectedFilterId && !filtersChanged;
      
      if (shouldUpdate) {
        // Atualizar filtro existente (apenas se os filtros não foram alterados)
        await updateFilterMutation.mutateAsync({
          id: selectedFilterId,
          dto: {
            nome: newFilterName.trim(),
            filters,
          },
        });
        toast({
          title: 'Sucesso',
          description: 'Filtro atualizado com sucesso!',
        });
      } else {
        // Criar novo filtro (sempre que os filtros foram alterados ou não há filtro selecionado)
        await createFilterMutation.mutateAsync({
          nome: newFilterName.trim(),
          filters,
        });
        toast({
          title: 'Sucesso',
          description: 'Filtro salvo com sucesso!',
        });
        // Limpar seleção se estava editando mas salvou como novo
        if (isEditing) {
          setSelectedFilterId('');
        }
      }
      setNewFilterName('');
      setShowSaveDialog(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const action = isEditing && selectedFilterId && !filtersChanged ? 'atualizar' : 'salvar';
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Erro ao ${action} filtro: ${errorMessage}`,
      });
    }
  };

  const handleLoadFilter = (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      setFilters(filter.filters);
      setSelectedFilterId(filterId);
      setNewFilterName(filter.nome); // Preenche o nome para edição
      toast({
        title: 'Filtro carregado',
        description: `Filtro "${filter.nome}" carregado com sucesso. Você pode editá-lo e salvar as alterações.`,
      });
    }
  };

  const handleDeleteFilter = async () => {
    if (!filterToDelete) return;

    try {
      await deleteFilterMutation.mutateAsync(filterToDelete);
      toast({
        title: 'Sucesso',
        description: 'Filtro deletado com sucesso',
      });
      if (selectedFilterId === filterToDelete) {
        setSelectedFilterId('');
        setFilters({});
        setNewFilterName('');
      }
      setFilterToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Erro ao deletar filtro: ${errorMessage}`,
      });
    }
  };

  const { data: dataEmpresa, isLoading: loadingEmpresa, error: errorEmpresa } = useQuery({
    queryKey: ['vendas', 'analytics-v2', 'crescimento-empresa', filters],
    queryFn: () => analyticsV2Service.getCrescimentoEmpresa(filters),
    enabled: activeTab === 'empresa',
  });

  const { data: dataFilial, isLoading: loadingFilial, error: errorFilial } = useQuery({
    queryKey: ['vendas', 'analytics-v2', 'crescimento-filial', filters],
    queryFn: () => analyticsV2Service.getCrescimentoFilial(filters),
    enabled: activeTab === 'filial',
  });

  const { data: dataMarca, isLoading: loadingMarca, error: errorMarca } = useQuery({
    queryKey: ['vendas', 'analytics-v2', 'crescimento-marca', filters],
    queryFn: () => analyticsV2Service.getCrescimentoMarca(filters),
    enabled: activeTab === 'marca',
  });

  const { data: dataAssociado, isLoading: loadingAssociado, error: errorAssociado } = useQuery({
    queryKey: ['vendas', 'analytics-v2', 'crescimento-associado', filters, associadoPage],
    queryFn: () => analyticsV2Service.getCrescimentoAssociado(filters, associadoPage, 50),
    enabled: activeTab === 'associado',
  });

  const { data: dataFilialAssociado, isLoading: loadingFilialAssociado, error: errorFilialAssociado } = useQuery({
    queryKey: ['vendas', 'analytics-v2', 'filial-associado', filters],
    queryFn: () => analyticsV2Service.getFilialAssociadoAnalytics(filters),
    enabled: activeTab === 'filial-associado',
  });

  return (
    <div className="container mx-auto py-2 space-y-2">
      <div>
        <h1 className="text-xl font-bold">Analytics de Vendas (V2)</h1>
        <p className="text-xs text-muted-foreground">
          Análises de crescimento mês a mês, ano a ano, por filial, marca e associado
          <br />
          <strong className="text-green-600">Usa dados diretamente da tabela Venda (valores corretos)</strong>
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Filtros</CardTitle>
              <CardDescription className="text-xs">
                Selecione os filtros desejados. Múltiplos valores no mesmo filtro = OR, filtros diferentes = AND
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedFilterId || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setSelectedFilterId('');
                    setNewFilterName('');
                    setFilters({});
                  } else {
                    handleLoadFilter(value);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Carregar filtro salvo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {isEditing ? 'Limpar seleção' : 'Nenhum filtro'}
                  </SelectItem>
                  {savedFilters.length === 0 ? (
                    <SelectItem value="no-filters" disabled>
                      Nenhum filtro salvo
                    </SelectItem>
                  ) : (
                    savedFilters.map((filter) => (
                      <SelectItem key={filter.id} value={filter.id}>
                        {filter.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedFilterId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterToDelete(selectedFilterId)}
                  disabled={deleteFilterMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Se os filtros foram alterados, não preencher o nome do filtro selecionado
                  // para permitir salvar com nome diferente
                  if (isEditing && selectedFilter && !filtersChanged) {
                    setNewFilterName(selectedFilter.nome);
                  } else {
                    setNewFilterName('');
                  }
                  setShowSaveDialog(true);
                }}
                disabled={createFilterMutation.isPending || updateFilterMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {filtersChanged ? 'Salvar Filtro' : isEditing ? 'Atualizar Filtro' : 'Salvar Filtro'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <AnalyticsFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {/* Dialog para salvar/atualizar filtro */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {filtersChanged ? 'Salvar Novo Filtro' : isEditing ? 'Atualizar Filtro' : 'Salvar Filtro'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {filtersChanged && isEditing
                ? 'Os filtros foram alterados. Digite um nome para salvar como um novo filtro.'
                : isEditing
                  ? 'Altere o nome para atualizar o filtro existente.'
                  : 'Digite um nome para salvar a configuração atual de filtros.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do filtro (ex: Filtro Mensal 2025)"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveFilter();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowSaveDialog(false);
                if (!isEditing) {
                  setNewFilterName('');
                }
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveFilter}
              disabled={
                !newFilterName.trim() ||
                createFilterMutation.isPending ||
                updateFilterMutation.isPending
              }
            >
              {createFilterMutation.isPending || updateFilterMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {filtersChanged ? 'Salvando...' : isEditing ? 'Atualizando...' : 'Salvando...'}
                </>
              ) : (
                filtersChanged ? 'Salvar' : isEditing ? 'Atualizar' : 'Salvar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para confirmar exclusão */}
      <AlertDialog open={!!filterToDelete} onOpenChange={(open) => !open && setFilterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este filtro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFilterToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFilter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFilterMutation.isPending}
            >
              {deleteFilterMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabs com Análises */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="empresa">Crescimento Empresa</TabsTrigger>
          <TabsTrigger value="filial">Por Filial</TabsTrigger>
          <TabsTrigger value="marca">Por Marca</TabsTrigger>
          <TabsTrigger value="associado">Por Associado</TabsTrigger>
          <TabsTrigger value="filial-associado">Filial/Associado</TabsTrigger>
        </TabsList>

        {/* Análise 1: Crescimento Empresa */}
        <TabsContent value="empresa" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">Crescimento Empresa - Mês a Mês e Ano a Ano</CardTitle>
                <CardDescription className="text-xs">
                  Comparação de vendas mensais e evolução percentual ano a ano
                </CardDescription>
              </div>
              {dataEmpresa && (
                <ExportButton
                  onExportExcel={() => exportCrescimentoEmpresaExcel(dataEmpresa)}
                  onExportCSV={() => exportCrescimentoEmpresaCSV(dataEmpresa)}
                />
              )}
            </CardHeader>
            <CardContent className="pt-2">
              {loadingEmpresa ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : errorEmpresa ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Erro ao carregar dados: {errorEmpresa instanceof Error ? errorEmpresa.message : 'Erro desconhecido'}
                  </AlertDescription>
                </Alert>
              ) : dataEmpresa ? (
                <CrescimentoEmpresaTable data={dataEmpresa} />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise 2: Crescimento por Filial */}
        <TabsContent value="filial" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">Crescimento por Filial (UF) - Ano a Ano</CardTitle>
                <CardDescription className="text-xs">
                  Comparação de vendas por filial e evolução percentual ano a ano
                </CardDescription>
              </div>
              {dataFilial && (
                <ExportButton
                  onExportExcel={() => exportCrescimentoFilialExcel(dataFilial)}
                  onExportCSV={() => exportCrescimentoFilialCSV(dataFilial)}
                />
              )}
            </CardHeader>
            <CardContent className="pt-2">
              {loadingFilial ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : errorFilial ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Erro ao carregar dados: {errorFilial instanceof Error ? errorFilial.message : 'Erro desconhecido'}
                  </AlertDescription>
                </Alert>
              ) : dataFilial ? (
                <CrescimentoFilialTable data={dataFilial} />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise 3: Crescimento por Marca */}
        <TabsContent value="marca" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">Crescimento por Marca - Ano a Ano</CardTitle>
                <CardDescription className="text-xs">
                  Comparação de vendas por marca e evolução percentual ano a ano
                </CardDescription>
              </div>
              {dataMarca && (
                <ExportButton
                  onExportExcel={() => exportCrescimentoMarcaExcel(dataMarca)}
                  onExportCSV={() => exportCrescimentoMarcaCSV(dataMarca)}
                />
              )}
            </CardHeader>
            <CardContent className="pt-2">
              {loadingMarca ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : errorMarca ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Erro ao carregar dados: {errorMarca instanceof Error ? errorMarca.message : 'Erro desconhecido'}
                  </AlertDescription>
                </Alert>
              ) : dataMarca ? (
                <CrescimentoMarcaTable data={dataMarca} />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise 4: Crescimento por Associado */}
        <TabsContent value="associado" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">Crescimento por Associado (Nome Fantasia) - Ano a Ano</CardTitle>
                <CardDescription className="text-xs">
                  Comparação de vendas por associado e evolução percentual ano a ano
                </CardDescription>
              </div>
              {dataAssociado && (
                <ExportButton
                  onExportExcel={() => exportCrescimentoAssociadoExcel(dataAssociado)}
                  onExportCSV={() => exportCrescimentoAssociadoCSV(dataAssociado)}
                />
              )}
            </CardHeader>
            <CardContent className="pt-2">
              {loadingAssociado ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : errorAssociado ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Erro ao carregar dados: {errorAssociado instanceof Error ? errorAssociado.message : 'Erro desconhecido'}
                  </AlertDescription>
                </Alert>
              ) : dataAssociado ? (
                <CrescimentoAssociadoTable
                  data={dataAssociado}
                  onPageChange={setAssociadoPage}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise 5: Estatística por Filial e Associado */}
        <TabsContent value="filial-associado" className="space-y-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Estatística por Filial e Associado
                </CardTitle>
                <CardDescription className="text-xs">
                  Vendas agrupadas por UF de Destino e Nome Fantasia (Associado) com detalhamento mensal
                </CardDescription>
              </div>
              {dataFilialAssociado && (
                <ExportButton
                  onExportExcel={() => exportFilialAssociadoExcel(dataFilialAssociado)}
                  onExportCSV={() => exportFilialAssociadoCSV(dataFilialAssociado)}
                />
              )}
            </CardHeader>
            <CardContent className="pt-2">
              {loadingFilialAssociado ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : errorFilialAssociado ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Erro ao carregar dados:{' '}
                    {errorFilialAssociado instanceof Error
                      ? errorFilialAssociado.message
                      : 'Erro desconhecido'}
                  </AlertDescription>
                </Alert>
              ) : dataFilialAssociado ? (
                <FilialAssociadoTable data={dataFilialAssociado} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Selecione os filtros (especialmente o ano) para visualizar os dados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

