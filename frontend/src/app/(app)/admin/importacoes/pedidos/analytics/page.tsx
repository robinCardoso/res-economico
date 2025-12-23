'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePedidosAnalytics, useAnalyticsAnos, useAnalyticsMeses, usePedidoAnalyticsFilters, useCreatePedidoAnalyticsFilter, useUpdatePedidoAnalyticsFilter, useDeletePedidoAnalyticsFilter, useRecalcularAnalytics, useRecalculoStatus } from '@/hooks/use-pedidos';
import type { AnalyticsFilters } from '@/services/pedidos.service';
import { Loader2, RefreshCw, Save, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnalyticsFilters as AnalyticsFiltersComponent } from '@/components/pedidos/analytics/AnalyticsFilters';
import { useQueryClient } from '@tanstack/react-query';
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

export default function AnalyticsPedidosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  
  // Estados para salvar/carregar filtros
  const [newFilterName, setNewFilterName] = useState('');
  const [selectedFilterId, setSelectedFilterId] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(false); // Controla se deve salvar como novo
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);
  
  // Hooks para filtros salvos
  const { data: savedFilters = [] } = usePedidoAnalyticsFilters();
  const createFilterMutation = useCreatePedidoAnalyticsFilter();
  const updateFilterMutation = useUpdatePedidoAnalyticsFilter();
  const deleteFilterMutation = useDeletePedidoAnalyticsFilter();
  const recalcularMutation = useRecalcularAnalytics();
  
  // Estado para diálogo de confirmação de recálculo
  const [showRecalcularDialog, setShowRecalcularDialog] = useState(false);
  
  // Status do recálculo (verifica automaticamente quando em andamento)
  const { data: recalculoStatus } = useRecalculoStatus(true);
  
  // Verifica se está editando um filtro existente
  const isEditing = !!selectedFilterId;
  const selectedFilter = savedFilters.find(f => f.id === selectedFilterId);

  // Função para comparar dois objetos de filtros (comparação profunda)
  const filtersAreEqual = (f1: AnalyticsFilters, f2: AnalyticsFilters): boolean => {
    const keys = new Set([...Object.keys(f1), ...Object.keys(f2)]);
    for (const key of keys) {
      const val1 = f1[key as keyof AnalyticsFilters];
      const val2 = f2[key as keyof AnalyticsFilters];
      
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

  const { data: analyticsData = [], isLoading, error } = usePedidosAnalytics(filters);

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
      // Determinar se deve atualizar ou criar novo
      const shouldUpdate = isEditing && selectedFilterId && !saveAsNew;
      
      if (shouldUpdate) {
        // Atualizar filtro existente
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
        // Criar novo filtro
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
      setSaveAsNew(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const action = isEditing && selectedFilterId && !saveAsNew ? 'atualizar' : 'salvar';
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

  const handleRecalcularAnalytics = async () => {
    try {
      // Limpar cache antes de iniciar o recálculo
      queryClient.removeQueries({ queryKey: ['pedidos', 'analytics'] });
      await recalcularMutation.mutateAsync({});
      setShowRecalcularDialog(false);
      // Forçar atualização imediata do status
      queryClient.invalidateQueries({ queryKey: ['analytics', 'recalculo-status'] });
      // Mostrar feedback imediato de que o recálculo foi iniciado
      toast({
        title: 'Recálculo iniciado',
        description: 'O recálculo foi iniciado com sucesso. Acompanhe o progresso abaixo.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Erro ao iniciar recálculo: ${errorMessage}`,
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics de Pedidos</h1>
          <p className="text-muted-foreground mt-2">
            Análises e estatísticas de pedidos por período, marca, grupo e mais
          </p>
        </div>
      </div>

      {/* Banner de progresso do recálculo */}
      {recalculoStatus?.emAndamento && (
        <Alert className="border-primary bg-primary/10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <AlertDescription className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <strong>Recalculando analytics...</strong>
                <p className="text-sm text-muted-foreground mt-1">
                  Processando pedidos: <strong>{(recalculoStatus.pedidosProcessados || 0).toLocaleString('pt-BR')}</strong> de{' '}
                  <strong>{(recalculoStatus.totalPedidos || 0).toLocaleString('pt-BR')}</strong>
                </p>
              </div>
              <span className="text-sm font-semibold">{(recalculoStatus.progresso || 0)}%</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-2">
          <div className="space-y-4">
            {/* Título e Descrição */}
            <div>
              <CardTitle className="text-sm font-semibold">Filtros</CardTitle>
              <CardDescription className="text-xs">
                Selecione os filtros desejados. Múltiplos valores no mesmo filtro = OR, filtros diferentes = AND
              </CardDescription>
            </div>
            
            {/* Ações - Responsivo */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
              {/* Grupo 1: Carregar/Deletar Filtro */}
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
                  <SelectTrigger className="w-full sm:w-[200px]">
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
                    title="Deletar filtro selecionado"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Grupo 2: Ações de Salvar/Atualizar/Recalcular */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Botão de Atualizar - só aparece quando há filtro selecionado E filtros foram alterados */}
                {isEditing && filtersChanged && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewFilterName(selectedFilter?.nome || '');
                      setSaveAsNew(false);
                      setShowSaveDialog(true);
                    }}
                    disabled={updateFilterMutation.isPending}
                    className="flex-shrink-0"
                  >
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Atualizar Filtro</span>
                  </Button>
                )}
                {/* Botão de Salvar/Salvar como Novo */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Se está editando e os filtros foram alterados, salvar como novo
                    if (isEditing && filtersChanged) {
                      setNewFilterName('');
                      setSaveAsNew(true);
                    } else if (isEditing && !filtersChanged) {
                      // Se está editando mas não alterou, atualizar
                      setNewFilterName(selectedFilter?.nome || '');
                      setSaveAsNew(false);
                    } else {
                      // Não está editando, salvar novo
                      setNewFilterName('');
                      setSaveAsNew(false);
                    }
                    setShowSaveDialog(true);
                  }}
                  disabled={createFilterMutation.isPending || updateFilterMutation.isPending}
                  className="flex-shrink-0"
                >
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {isEditing && filtersChanged ? 'Salvar como Novo' : isEditing && !filtersChanged ? 'Renomear Filtro' : 'Salvar Filtro'}
                  </span>
                  <span className="sm:hidden">
                    {isEditing && filtersChanged ? 'Novo' : 'Salvar'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecalcularDialog(true)}
                  disabled={recalcularMutation.isPending || recalculoStatus?.emAndamento}
                  className="flex-shrink-0"
                >
                  {recalcularMutation.isPending || recalculoStatus?.emAndamento ? (
                    <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">
                    {recalculoStatus?.emAndamento ? 'Recalculando...' : 'Recalcular Analytics'}
                  </span>
                  <span className="sm:hidden">
                    {recalculoStatus?.emAndamento ? 'Recalc...' : 'Recalcular'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <AnalyticsFiltersComponent filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {/* Dialog para salvar/atualizar filtro */}
      <AlertDialog 
        open={showSaveDialog} 
        onOpenChange={(open) => {
          setShowSaveDialog(open);
          if (!open) {
            setSaveAsNew(false);
            if (!isEditing) {
              setNewFilterName('');
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {saveAsNew ? 'Salvar Novo Filtro' : isEditing ? 'Atualizar Filtro' : 'Salvar Filtro'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {saveAsNew
                ? 'Digite um nome para salvar uma nova cópia do filtro com as alterações.'
                : isEditing
                  ? `Você está atualizando o filtro "${selectedFilter?.nome}". As alterações serão salvas no filtro existente.`
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
                setSaveAsNew(false);
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
                  {saveAsNew ? 'Salvando...' : isEditing ? 'Atualizando...' : 'Salvando...'}
                </>
              ) : (
                saveAsNew ? 'Salvar Novo' : isEditing ? 'Atualizar' : 'Salvar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para confirmar recálculo */}
      <AlertDialog open={showRecalcularDialog} onOpenChange={setShowRecalcularDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalcular Analytics</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá recalcular todos os analytics de pedidos.
              <br /><br />
              <strong>Atenção:</strong> Esta operação pode levar alguns minutos dependendo da quantidade de dados.
              O processamento é feito em background e você será notificado quando concluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={recalcularMutation.isPending || recalculoStatus?.emAndamento}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRecalcularAnalytics}
              disabled={recalcularMutation.isPending || recalculoStatus?.emAndamento}
            >
              {recalcularMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                'Confirmar Recálculo'
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

      {/* Tabela de Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            {analyticsData.length > 0 && (
              <span>
                Mostrando {analyticsData.length} resultado(s)
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
                Erro ao carregar analytics. Verifique se o backend está rodando.
              </AlertDescription>
            </Alert>
          ) : analyticsData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum dado de analytics encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead>Mês</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Subgrupo</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Quantidade Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.ano}</TableCell>
                      <TableCell>
                        {new Date(2000, item.mes - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                      </TableCell>
                      <TableCell>{item.nomeFantasia}</TableCell>
                      <TableCell>{item.marca}</TableCell>
                      <TableCell>{item.grupo || '-'}</TableCell>
                      <TableCell>{item.subgrupo || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Number(item.totalValor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(item.totalQuantidade).toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
