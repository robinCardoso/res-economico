import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasService, type CreateEmpresaDto, type UpdateEmpresaDto } from '@/services/empresas.service';
import type { Empresa } from '@/types/api';

export function useEmpresas() {
  return useQuery<Empresa[]>({
    queryKey: ['empresas'],
    queryFn: () => empresasService.list(),
  });
}

export function useEmpresa(id: string) {
  return useQuery<Empresa>({
    queryKey: ['empresas', id],
    queryFn: () => empresasService.getById(id),
    enabled: !!id,
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateEmpresaDto) => empresasService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEmpresaDto }) =>
      empresasService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => empresasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}
