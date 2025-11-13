import { useQuery } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import type { TemplateImportacaoWithRelations } from '@/types/api';

export function useTemplates() {
  return useQuery<TemplateImportacaoWithRelations[]>({
    queryKey: ['templates'],
    queryFn: () => templatesService.list(),
  });
}

