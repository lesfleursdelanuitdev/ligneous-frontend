'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTreeStats(treeId) {
  return useQuery({
    queryKey: queryKeys.trees.stats(treeId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/stats`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load stats');
      return data;
    },
    enabled: !!treeId,
    staleTime: 5 * 60_000,
  });
}
