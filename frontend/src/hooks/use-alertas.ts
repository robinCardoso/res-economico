import { useQuery } from '@tanstack/react-query';
import { alertasService } from '@/services/alertas.service';
import type { AlertaWithRelations } from '@/types/api';

export function useAlertas() {
  return useQuery<AlertaWithRelations[]>({
    queryKey: ['alertas'],
    queryFn: () => alertasService.list(),
  });
}

