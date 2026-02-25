'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useMostWantedThreads(treeId) {
  return useQuery({
    queryKey: queryKeys.threads.list(treeId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/research/most-wanted`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    },
    enabled: !!treeId,
  });
}
