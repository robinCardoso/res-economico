import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  pedidosService,
  analyticsService,
  analyticsValuesService,
  type FilterPedidosDto,
  type ImportPedidosDto,
  type Pedido,
  type PedidosListResponse,
  type PedidosStats,
  type PedidoAnalytics,
  type PedidoImportacaoLog,
  type AnalyticsFilters,
  type CrescimentoEmpresaResponse,
  type PedidoColumnMapping,
  type CreatePedidoColumnMappingDto,
  type PedidoAnalyticsFilter,
  type CreatePedidoAnalyticsFilterDto,
} from '@/services/pedidos.service';

export function usePedidos(filters?: FilterPedidosDto) {
  return useQuery<PedidosListResponse>({
    queryKey: ['pedidos', filters],
    queryFn: () => pedidosService.list(filters),
  });
}

export function usePedido(id: string) {
  return useQuery<Pedido>({
    queryKey: ['pedidos', id],
    queryFn: () => pedidosService.getById(id),
    enabled: !!id,
  });
}

export function usePedidosStats(filters?: FilterPedidosDto) {
  return useQuery<PedidosStats>({
    queryKey: ['pedidos', 'stats', filters],
    queryFn: () => pedidosService.getStats(filters),
  });
}

export function useDeletePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pedidosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'stats'] });
    },
  });
}

export function useImportPedidos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, importDto }: { file: File; importDto: ImportPedidosDto }) =>
      pedidosService.import(file, importDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'import-logs'] });
    },
  });
}

export function usePedidosImportLogs() {
  return useQuery<PedidoImportacaoLog[]>({
    queryKey: ['pedidos', 'import-logs'],
    queryFn: () => pedidosService.getImportLogs(),
  });
}

export function usePedidosMappingFields() {
  return useQuery<Array<{ value: string; label: string; dataType: string; required: boolean }>>({
    queryKey: ['pedidos', 'mapping-fields'],
    queryFn: () => pedidosService.getMappingFields(),
    staleTime: 1000 * 60 * 60, // Cache por 1 hora (campos raramente mudam)
  });
}

export function useMarcas() {
  return useQuery<string[]>({
    queryKey: ['pedidos', 'marcas'],
    queryFn: () => pedidosService.getMarcas(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useGrupos() {
  return useQuery<string[]>({
    queryKey: ['pedidos', 'grupos'],
    queryFn: () => pedidosService.getGrupos(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useSubgrupos() {
  return useQuery<string[]>({
    queryKey: ['pedidos', 'subgrupos'],
    queryFn: () => pedidosService.getSubgrupos(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useNomesFantasia() {
  return useQuery<string[]>({
    queryKey: ['pedidos', 'nomes-fantasia'],
    queryFn: () => pedidosService.getNomesFantasia(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

// Hooks para Analytics
export function useCrescimentoEmpresa(filtros?: AnalyticsFilters) {
  return useQuery<CrescimentoEmpresaResponse>({
    queryKey: ['pedidos', 'analytics', 'crescimento-empresa', filtros],
    queryFn: () => analyticsService.getCrescimentoEmpresa(filtros),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useRecalcularAnalytics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: { dataInicio?: string; dataFim?: string }) =>
      analyticsService.recalcularAnalytics(params?.dataInicio, params?.dataFim),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-analytics', 'recalculo-status'] });
    },
  });
}

export function useRecalculoStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: ['pedidos-analytics', 'recalculo-status'],
    queryFn: () => analyticsService.getRecalculoStatus(),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.emAndamento) {
        return 2000;
      }
      return enabled ? 5000 : false;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

// Hooks para valores únicos de PedidoAnalytics
export function useAnalyticsAnos() {
  return useQuery<number[]>({
    queryKey: ['pedidos', 'analytics', 'anos'],
    queryFn: () => analyticsValuesService.getAnos(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useAnalyticsMeses() {
  return useQuery<number[]>({
    queryKey: ['pedidos', 'analytics', 'meses'],
    queryFn: () => analyticsValuesService.getMeses(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function usePedidosAnalytics(filters?: AnalyticsFilters) {
  return useQuery<PedidoAnalytics[]>({
    queryKey: ['pedidos', 'analytics', filters],
    queryFn: () => pedidosService.getAnalytics(filters),
  });
}

export function useDeleteImportLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => pedidosService.deleteImportLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'import-logs'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'analytics'] });
    },
  });
}

export function useImportLogProgress(logId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['pedidos', 'import-logs', logId, 'progresso'],
    queryFn: () => pedidosService.getImportLogProgress(logId),
    enabled: enabled && !!logId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.progresso === 100 || data?.concluido) {
        return false;
      }
      return 2000;
    },
  });
}

// =====================================================
// HOOKS PARA MAPEAMENTO DE COLUNAS
// =====================================================

export function usePedidoColumnMappings() {
  return useQuery<PedidoColumnMapping[]>({
    queryKey: ['pedidos', 'column-mappings'],
    queryFn: () => pedidosService.getColumnMappings(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function usePedidoColumnMapping(id: string) {
  return useQuery<PedidoColumnMapping>({
    queryKey: ['pedidos', 'column-mappings', id],
    queryFn: () => pedidosService.getColumnMapping(id),
    enabled: !!id,
  });
}

export function useCreatePedidoColumnMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePedidoColumnMappingDto) =>
      pedidosService.createColumnMapping(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'column-mappings'] });
    },
  });
}

export function useUpdatePedidoColumnMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreatePedidoColumnMappingDto> }) =>
      pedidosService.updateColumnMapping(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'column-mappings'] });
    },
  });
}

export function useDeletePedidoColumnMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pedidosService.deleteColumnMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'column-mappings'] });
    },
  });
}

// =====================================================
// HOOKS PARA FILTROS DE ANALYTICS
// =====================================================

export function usePedidoAnalyticsFilters() {
  return useQuery<PedidoAnalyticsFilter[]>({
    queryKey: ['pedidos', 'analytics-filters'],
    queryFn: () => pedidosService.getAnalyticsFilters(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function usePedidoAnalyticsFilter(id: string) {
  return useQuery<PedidoAnalyticsFilter>({
    queryKey: ['pedidos', 'analytics-filters', id],
    queryFn: () => pedidosService.getAnalyticsFilter(id),
    enabled: !!id,
  });
}

export function useCreatePedidoAnalyticsFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePedidoAnalyticsFilterDto) =>
      pedidosService.createAnalyticsFilter(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'analytics-filters'] });
    },
  });
}

export function useUpdatePedidoAnalyticsFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreatePedidoAnalyticsFilterDto> }) =>
      pedidosService.updateAnalyticsFilter(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'analytics-filters'] });
    },
  });
}

export function useDeletePedidoAnalyticsFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pedidosService.deleteAnalyticsFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'analytics-filters'] });
    },
  });
}

// =====================================================
// HOOKS PARA BUSCAR VALORES DISPONÍVEIS PARA FILTROS
// =====================================================

export function usePedidosMarcas() {
  return useQuery<string[]>({
    queryKey: ['pedidos', 'marcas'],
    queryFn: () => pedidosService.getMarcas(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function usePedidosGrupos() {
  return useQuery<string[]>({
    queryKey: ['pedidos', 'grupos'],
    queryFn: () => pedidosService.getGrupos(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function usePedidosSubgrupos() {
  return useQuery<string[]>({
    queryKey: ['pedidos', 'subgrupos'],
    queryFn: () => pedidosService.getSubgrupos(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function usePedidosNomesFantasia() {
  return useQuery<string[]>({
    queryKey: ['pedidos', 'nomes-fantasia'],
    queryFn: () => pedidosService.getNomesFantasia(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

