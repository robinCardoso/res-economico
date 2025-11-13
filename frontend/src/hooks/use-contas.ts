import { useQuery } from '@tanstack/react-query';
import { contasService } from '@/services/contas.service';
import type { ContaCatalogoWithRelations } from '@/types/api';

export function useContas() {
  return useQuery<ContaCatalogoWithRelations[]>({
    queryKey: ['contas'],
    queryFn: () => contasService.list(),
  });
}

