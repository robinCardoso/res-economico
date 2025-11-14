import { useQuery } from '@tanstack/react-query';
import { uploadsService } from '@/services/uploads.service';
import type { UploadWithRelations } from '@/types/api';

export function useUploads() {
  return useQuery<UploadWithRelations[]>({
    queryKey: ['uploads'],
    queryFn: () => uploadsService.list(),
    // Atualizar automaticamente a cada 5 segundos se houver uploads em processamento
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      
      // Verificar se há algum upload com status PROCESSANDO
      const hasProcessing = data.some(
        (upload) => upload.status === 'PROCESSANDO'
      );
      
      // Se houver uploads processando, atualizar a cada 5 segundos
      return hasProcessing ? 5000 : false;
    },
  });
}

export function useUpload(id: string) {
  return useQuery<UploadWithRelations>({
    queryKey: ['uploads', id],
    queryFn: () => uploadsService.getById(id),
    enabled: !!id,
    // Atualizar automaticamente a cada 3 segundos se o upload estiver processando
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      
      // Se o upload estiver processando, atualizar a cada 3 segundos
      return data.status === 'PROCESSANDO' ? 3000 : false;
    },
  });
}

