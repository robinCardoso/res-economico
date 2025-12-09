import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  vendasService,
  type CreateVendaDto,
  type UpdateVendaDto,
  type FilterVendasDto,
  type ImportVendasDto,
  type Venda,
  type VendasListResponse,
  type VendasStats,
  type VendaAnalytics,
  type VendaImportacaoLog,
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
