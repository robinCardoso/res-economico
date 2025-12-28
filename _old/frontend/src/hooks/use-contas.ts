import { useQuery } from '@tanstack/react-query';
import { contasService, type FilterContasParams } from '@/services/contas.service';
import type { ContaCatalogoWithRelations } from '@/types/api';

export function useContas(filters?: FilterContasParams) {
  return useQuery<ContaCatalogoWithRelations[]>({
    queryKey: ['contas', filters],
    queryFn: () => contasService.list(filters),
  });
}

