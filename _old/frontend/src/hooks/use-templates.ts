import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesService, type CreateTemplateDto, type UpdateTemplateDto } from '@/services/templates.service';
import type { TemplateImportacaoWithRelations } from '@/types/api';

export function useTemplates() {
  return useQuery<TemplateImportacaoWithRelations[]>({
    queryKey: ['templates'],
    queryFn: () => templatesService.list(),
  });
}

export function useTemplate(id: string) {
  return useQuery<TemplateImportacaoWithRelations>({
    queryKey: ['templates', id],
    queryFn: () => templatesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTemplateDto) => templatesService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTemplateDto }) =>
      templatesService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates', variables.id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => templatesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

