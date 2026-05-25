'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTreeSettings(treeId) {
  return useQuery({
    queryKey: queryKeys.trees.settings(treeId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/manage/settings`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load settings');
      return { settings: data.settings, isOwner: data.isOwner ?? false };
    },
    enabled: !!treeId,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateTreeSettings(treeId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch) => {
      const res = await authFetch(`/api/trees/${treeId}/manage/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      return data.settings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.trees.settings(treeId), (prev) =>
        prev ? { ...prev, settings: updated } : { settings: updated, isOwner: false }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.trees.meta(treeId) });
    },
  });
}

export function useDeleteTree(treeId) {
  return useMutation({
    mutationFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete tree');
      return data;
    },
  });
}
