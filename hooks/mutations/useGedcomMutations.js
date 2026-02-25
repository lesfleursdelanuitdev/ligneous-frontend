'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useUploadAndValidateGedcom(gedcomFiles) {
  return useMutation({
    mutationFn: async ({ file, treeName }) => {
      if (!gedcomFiles) throw new Error('GEDCOM files facet not available');
      const uploadResult = await gedcomFiles.uploadGedcom(file, treeName || file.name);
      const fileId = uploadResult.fileId;
      const validationData = await gedcomFiles.validateFile(fileId);
      return {
        ...validationData,
        fileId,
        uploadData: uploadResult.metadata,
      };
    },
  });
}

export function useCreateTree() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, name, description, isPublic }) => {
      const res = await authFetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, name, description, isPublic }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create tree');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}
