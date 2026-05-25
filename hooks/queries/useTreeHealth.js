'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTreeHealth(treeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.trees.health(treeId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/manage/health`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load health');
      return data;
    },
    enabled: !!treeId && enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
