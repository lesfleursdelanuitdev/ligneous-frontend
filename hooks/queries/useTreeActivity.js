'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTreeActivity(treeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.trees.activity(treeId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/activity`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load activity');
      return data;
    },
    enabled: !!treeId && enabled,
    staleTime: 2 * 60_000,
  });
}
