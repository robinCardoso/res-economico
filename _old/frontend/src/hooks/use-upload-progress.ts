import { useQuery } from '@tanstack/react-query';
import { uploadsService } from '@/services/uploads.service';
import type { UploadProgress } from '@/types/api';

export function useUploadProgress(uploadId: string, enabled: boolean = true) {
  return useQuery<UploadProgress>({
    queryKey: ['upload-progress', uploadId],
    queryFn: () => uploadsService.getProgress(uploadId),
    enabled: enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Parar de atualizar quando progresso for 100% ou estado for 'completed'
      if (data?.progress === 100) {
        return false;
      }
      // Atualizar a cada 2 segundos enquanto estiver processando
      return 2000;
    },
  });
}

