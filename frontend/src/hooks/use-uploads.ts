import { useQuery } from '@tanstack/react-query';
import { uploadsService } from '@/services/uploads.service';
import type { UploadWithRelations } from '@/types/api';

export function useUploads() {
  return useQuery<UploadWithRelations[]>({
    queryKey: ['uploads'],
    queryFn: () => uploadsService.list(),
  });
}

export function useUpload(id: string) {
  return useQuery<UploadWithRelations>({
    queryKey: ['uploads', id],
    queryFn: () => uploadsService.getById(id),
    enabled: !!id,
  });
}

