/**
 * Hooks para API de análise de perfil de cliente
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteAnalyticsService, ClienteAnalyticsFilters } from '@/services/cliente-analytics.service';
import type {
  VisaoGeralClientes,
  RelatorioPerfilCliente,
  AlertaCliente,
} from '@/services/cliente-analytics.service';

// ============================================================
// QUERIES
// ============================================================

/**
 * Hook para buscar visão geral (dashboard) de clientes
 * 
 * OTIMIZAÇÕES:
 * - staleTime: 1 hora (dados agregados, mudam pouco)
 * - gcTime: 24 horas (manter em cache)
 * - Refetch em background a cada 30 min
 */
export function useClienteAnalyticsVisaoGeral(filters?: ClienteAnalyticsFilters) {
  return useQuery({
    queryKey: ['cliente-analytics', 'visao-geral', filters],
    queryFn: () => clienteAnalyticsService.getVisaoGeral(filters),
    staleTime: 1000 * 60 * 60, // ✅ OTIMIZADO: 1 HORA
    gcTime: 1000 * 60 * 60 * 24, // Cache por 24h
    refetchInterval: 1000 * 60 * 30, // Refetch em background a cada 30 min
  });
}

/**
 * Hook para buscar relatórios de múltiplos clientes
 * 
 * OTIMIZAÇÕES:
 * - staleTime: 30 minutos (dados por cliente)
 * - gcTime: 1 hora
 */
export function useClienteAnalyticsRelatorios(filters?: ClienteAnalyticsFilters) {
  return useQuery({
    queryKey: ['cliente-analytics', 'relatorios', filters],
    queryFn: () => clienteAnalyticsService.getRelatorios(filters),
    staleTime: 1000 * 60 * 30, // ✅ OTIMIZADO: 30 MINUTOS
    gcTime: 1000 * 60 * 60, // Cache por 1h
  });
}

/**
 * Hook para buscar relatório de um cliente específico
 * 
 * OTIMIZAÇÕES:
 * - staleTime: 30 minutos
 * - enabled: Apenas executa quando nomeFantasia está disponível
 */
export function useClienteAnalyticsRelatorioCliente(
  nomeFantasia: string,
  filters?: Omit<ClienteAnalyticsFilters, 'nomeFantasia'>,
) {
  return useQuery({
    queryKey: ['cliente-analytics', 'cliente', nomeFantasia, filters],
    queryFn: () => clienteAnalyticsService.getRelatorioCliente(nomeFantasia, filters),
    enabled: !!nomeFantasia,
    staleTime: 1000 * 60 * 30, // ✅ OTIMIZADO: 30 MINUTOS
    gcTime: 1000 * 60 * 60, // Cache por 1h
  });
}

/**
 * Hook para buscar alertas de clientes
 * 
 * OTIMIZAÇÕES:
 * - staleTime: 2 minutos (alertas CRÍTICOS, devem estar frescos)
 * - refetchInterval: Refetch a cada 5 minutos em background
 * - refetchOnWindowFocus: Refetch quando volta para a aba
 */
export function useClienteAnalyticsAlertas(filters?: ClienteAnalyticsFilters) {
  return useQuery({
    queryKey: ['cliente-analytics', 'alertas', filters],
    queryFn: () => clienteAnalyticsService.getAlertas(filters),
    staleTime: 1000 * 60 * 2, // ✅ MANTIDO: 2 MINUTOS (alertas frescos)
    gcTime: 1000 * 60 * 30, // Cache por 30 min
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 min
    refetchOnWindowFocus: true, // Refetch ao voltar para a aba
  });
}

// ============================================================
// EXPORTS DE TIPOS
// ============================================================

export type {
  VisaoGeralClientes,
  RelatorioPerfilCliente,
  AlertaCliente,
  ClienteAnalyticsFilters,
};
