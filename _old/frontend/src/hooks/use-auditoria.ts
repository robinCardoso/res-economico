import { useQuery } from '@tanstack/react-query';
import { auditoriaService, type FilterAuditoriaParams } from '@/services/auditoria.service';
import type { LogAuditoria } from '@/types/api';

export function useAuditoria(filters?: FilterAuditoriaParams) {
  return useQuery<LogAuditoria[]>({
    queryKey: ['auditoria', filters],
    queryFn: () => auditoriaService.list(filters),
  });
}

export function useAuditoriaRecursos() {
  return useQuery<string[]>({
    queryKey: ['auditoria', 'recursos'],
    queryFn: () => auditoriaService.getRecursos(),
  });
}

export function useAuditoriaAcoes() {
  return useQuery<string[]>({
    queryKey: ['auditoria', 'acoes'],
    queryFn: () => auditoriaService.getAcoes(),
  });
}

