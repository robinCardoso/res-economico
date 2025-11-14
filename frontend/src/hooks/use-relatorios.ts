import { useQuery } from '@tanstack/react-query';
import { relatoriosService, type GerarRelatorioParams } from '@/services/relatorios.service';
import type { RelatorioResultado } from '@/types/api';

export function useRelatorioResultado(params: GerarRelatorioParams) {
  // Validar se pode buscar: precisa de ano e, se for FILIAL, precisa de empresaId
  const canFetch = 
    !!params.ano && 
    (params.tipo === 'CONSOLIDADO' || (params.tipo === 'FILIAL' && !!params.empresaId));

  return useQuery<RelatorioResultado>({
    queryKey: ['relatorio-resultado', params],
    queryFn: () => relatoriosService.gerarResultado(params),
    enabled: canFetch, // Só buscar se tiver todos os parâmetros necessários
  });
}

