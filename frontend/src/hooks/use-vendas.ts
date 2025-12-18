import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  vendasService,
  analyticsService,
  analyticsValuesService,
  type CreateVendaDto,
  type UpdateVendaDto,
  type FilterVendasDto,
  type ImportVendasDto,
  type Venda,
  type VendasListResponse,
  type VendasStats,
  type VendaAnalytics,
  type VendaImportacaoLog,
  type AnalyticsFilters,
  type CrescimentoEmpresaResponse,
  type CrescimentoFilialResponse,
  type CrescimentoMarcaResponse,
  type CrescimentoAssociadoResponse,
  type FilialAssociadoResponse,
  type VendaColumnMapping,
  type CreateVendaColumnMappingDto,
  type VendaAnalyticsFilter,
  type CreateVendaAnalyticsFilterDto,
} from '@/services/vendas.service';

export function useVendas(filters?: FilterVendasDto) {
  return useQuery<VendasListResponse>({
    queryKey: ['vendas', filters],
    queryFn: () => vendasService.list(filters),
  });
}

export function useVenda(id: string) {
  return useQuery<Venda>({
    queryKey: ['vendas', id],
    queryFn: () => vendasService.getById(id),
    enabled: !!id,
  });
}

export function useVendasStats(filters?: FilterVendasDto) {
  return useQuery<VendasStats>({
    queryKey: ['vendas', 'stats', filters],
    queryFn: () => vendasService.getStats(filters),
  });
}

export function useCreateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateVendaDto) => vendasService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
    },
  });
}

export function useUpdateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVendaDto }) =>
      vendasService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
    },
  });
}

export function useDeleteVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vendasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
    },
  });
}

export function useImportVendas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, importDto }: { file: File; importDto: ImportVendasDto }) =>
      vendasService.import(file, importDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'import-logs'] });
    },
  });
}

export function useVendasImportLogs() {
  return useQuery<VendaImportacaoLog[]>({
    queryKey: ['vendas', 'import-logs'],
    queryFn: () => vendasService.getImportLogs(),
  });
}

export function useVendasMappingFields() {
  return useQuery<Array<{ value: string; label: string; dataType: string; required: boolean }>>({
    queryKey: ['vendas', 'mapping-fields'],
    queryFn: () => vendasService.getMappingFields(),
    staleTime: 1000 * 60 * 60, // Cache por 1 hora (campos raramente mudam)
  });
}

export function useTiposOperacao() {
  return useQuery<string[]>({
    queryKey: ['vendas', 'tipos-operacao'],
    queryFn: () => vendasService.getTiposOperacao(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useMarcas() {
  return useQuery<string[]>({
    queryKey: ['vendas', 'marcas'],
    queryFn: () => vendasService.getMarcas(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useGrupos() {
  return useQuery<string[]>({
    queryKey: ['vendas', 'grupos'],
    queryFn: () => vendasService.getGrupos(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useSubgrupos() {
  return useQuery<string[]>({
    queryKey: ['vendas', 'subgrupos'],
    queryFn: () => vendasService.getSubgrupos(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useNomesFantasia() {
  return useQuery<string[]>({
    queryKey: ['vendas', 'nomes-fantasia'],
    queryFn: () => vendasService.getNomesFantasia(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

// Hooks para Analytics
export function useCrescimentoEmpresa(filtros?: AnalyticsFilters) {
  return useQuery<CrescimentoEmpresaResponse>({
    queryKey: ['vendas', 'analytics', 'crescimento-empresa', filtros],
    queryFn: () => analyticsService.getCrescimentoEmpresa(filtros),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useCrescimentoFilial(filtros?: AnalyticsFilters) {
  return useQuery<CrescimentoFilialResponse>({
    queryKey: ['vendas', 'analytics', 'crescimento-filial', filtros],
    queryFn: () => analyticsService.getCrescimentoFilial(filtros),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useCrescimentoMarca(filtros?: AnalyticsFilters) {
  return useQuery<CrescimentoMarcaResponse>({
    queryKey: ['vendas', 'analytics', 'crescimento-marca', filtros],
    queryFn: () => analyticsService.getCrescimentoMarca(filtros),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useCrescimentoAssociado(
  filtros?: AnalyticsFilters,
  page: number = 1,
  limit: number = 50
) {
  return useQuery<CrescimentoAssociadoResponse>({
    queryKey: ['vendas', 'analytics', 'crescimento-associado', filtros, page, limit],
    queryFn: () => analyticsService.getCrescimentoAssociado(filtros, page, limit),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useFilialAssociadoAnalytics(filtros?: AnalyticsFilters) {
  return useQuery<FilialAssociadoResponse>({
    queryKey: ['vendas', 'analytics', 'filial-associado', filtros],
    queryFn: () => analyticsService.getFilialAssociadoAnalytics(filtros),
    enabled: !!filtros?.ano && filtros.ano.length > 0, // Só busca se tiver ano selecionado
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useRecalcularAnalytics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: { dataInicio?: string; dataFim?: string }) =>
      analyticsService.recalcularAnalytics(params?.dataInicio, params?.dataFim),
    onSuccess: () => {
      // Invalidar todas as queries de analytics para forçar recarregamento
      queryClient.invalidateQueries({ queryKey: ['vendas', 'analytics'] });
    },
  });
}

export function useRecalculoStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'recalculo-status'],
    queryFn: () => analyticsService.getRecalculoStatus(),
    enabled,
    refetchInterval: (query) => {
      // Verificar status a cada 2 segundos enquanto estiver em andamento
      const data = query.state.data;
      return data?.emAndamento ? 2000 : false;
    },
  });
}

// Hooks para valores únicos de VendaAnalytics
export function useAnalyticsUfs() {
  return useQuery<string[]>({
    queryKey: ['vendas', 'analytics', 'ufs'],
    queryFn: () => analyticsValuesService.getUfs(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useAnalyticsAnos() {
  return useQuery<number[]>({
    queryKey: ['vendas', 'analytics', 'anos'],
    queryFn: () => analyticsValuesService.getAnos(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useAnalyticsMeses() {
  return useQuery<number[]>({
    queryKey: ['vendas', 'analytics', 'meses'],
    queryFn: () => analyticsValuesService.getMeses(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useVendasAnalytics(filters?: {
  ano?: number;
  mes?: number;
  nomeFantasia?: string;
  marca?: string;
  grupo?: string;
  subgrupo?: string;
  uf?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  return useQuery<VendaAnalytics[]>({
    queryKey: ['vendas', 'analytics', filters],
    queryFn: () => vendasService.getAnalytics(filters),
  });
}

export function useDeleteImportLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => vendasService.deleteImportLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', 'import-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'analytics'] });
    },
  });
}

export function useImportLogProgress(logId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['vendas', 'import-logs', logId, 'progresso'],
    queryFn: () => vendasService.getImportLogProgress(logId),
    enabled: enabled && !!logId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Parar de atualizar quando progresso for 100% ou concluído
      if (data?.progresso === 100 || data?.concluido) {
        return false;
      }
      // Atualizar a cada 2 segundos enquanto estiver processando
      return 2000;
    },
  });
}

// =====================================================
// HOOKS PARA MAPEAMENTO DE COLUNAS
// =====================================================

export function useVendaColumnMappings() {
  return useQuery<VendaColumnMapping[]>({
    queryKey: ['vendas', 'column-mappings'],
    queryFn: () => vendasService.getColumnMappings(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useVendaColumnMapping(id: string) {
  return useQuery<VendaColumnMapping>({
    queryKey: ['vendas', 'column-mappings', id],
    queryFn: () => vendasService.getColumnMapping(id),
    enabled: !!id,
  });
}

export function useCreateVendaColumnMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateVendaColumnMappingDto) =>
      vendasService.createColumnMapping(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', 'column-mappings'] });
    },
  });
}

export function useUpdateVendaColumnMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateVendaColumnMappingDto> }) =>
      vendasService.updateColumnMapping(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', 'column-mappings'] });
    },
  });
}

export function useDeleteVendaColumnMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vendasService.deleteColumnMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', 'column-mappings'] });
    },
  });
}

// =====================================================
// HOOKS PARA FILTROS DE ANALYTICS
// =====================================================

export function useVendaAnalyticsFilters() {
  return useQuery<VendaAnalyticsFilter[]>({
    queryKey: ['vendas', 'analytics-filters'],
    queryFn: () => vendasService.getAnalyticsFilters(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useVendaAnalyticsFilter(id: string) {
  return useQuery<VendaAnalyticsFilter>({
    queryKey: ['vendas', 'analytics-filters', id],
    queryFn: () => vendasService.getAnalyticsFilter(id),
    enabled: !!id,
  });
}

export function useCreateVendaAnalyticsFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateVendaAnalyticsFilterDto) =>
      vendasService.createAnalyticsFilter(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', 'analytics-filters'] });
    },
  });
}

export function useUpdateVendaAnalyticsFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateVendaAnalyticsFilterDto> }) =>
      vendasService.updateAnalyticsFilter(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', 'analytics-filters'] });
    },
  });
}

export function useDeleteVendaAnalyticsFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vendasService.deleteAnalyticsFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', 'analytics-filters'] });
    },
  });
}
