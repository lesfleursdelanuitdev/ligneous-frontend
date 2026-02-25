'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTreeMeta(treeId) {
  return useQuery({
    queryKey: queryKeys.trees.meta(treeId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/meta`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tree');
      return data;
    },
    enabled: !!treeId,
  });
}
