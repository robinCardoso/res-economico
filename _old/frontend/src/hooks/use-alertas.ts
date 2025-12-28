import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertasService, type FilterAlertasParams, type ContagemPorTipoConta } from '@/services/alertas.service';
import type { AlertaWithRelations, AlertaStatus, AlertaDetalhesResponse } from '@/types/api';

export function useAlertas(filters?: FilterAlertasParams) {
  return useQuery<AlertaWithRelations[]>({
    queryKey: ['alertas', filters],
    queryFn: () => alertasService.list(filters),
  });
}

export function useContagemPorTipoConta(filters?: FilterAlertasParams) {
  return useQuery<ContagemPorTipoConta[]>({
    queryKey: ['alertas', 'contagem-por-tipo-conta', filters],
    queryFn: () => alertasService.getContagemPorTipoConta(filters),
    enabled: !!filters?.uploadId, // Só executar quando tiver uploadId
    staleTime: 1000 * 30, // Considerar dados válidos por 30 segundos
    refetchOnWindowFocus: true, // Recarregar quando a janela ganhar foco
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

export function useAlerta(id: string) {
  return useQuery<AlertaWithRelations>({
    queryKey: ['alerta', id],
    queryFn: () => alertasService.getById(id),
    enabled: !!id,
  });
}

export function useAlertaDetalhes(id: string) {
  return useQuery<AlertaDetalhesResponse>({
    queryKey: ['alerta', id, 'detalhes'],
    queryFn: () => alertasService.getDetalhes(id),
    enabled: !!id,
  });
}

