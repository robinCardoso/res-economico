import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertasService, type FilterAlertasParams } from '@/services/alertas.service';
import type { AlertaWithRelations, AlertaStatus } from '@/types/api';

export function useAlertas(filters?: FilterAlertasParams) {
  return useQuery<AlertaWithRelations[]>({
    queryKey: ['alertas', filters],
    queryFn: () => alertasService.list(filters),
  });
}

export function useUpdateAlertaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertaStatus }) =>
      alertasService.updateStatus(id, status),
    onSuccess: () => {
      // Invalidar queries de alertas para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
}

