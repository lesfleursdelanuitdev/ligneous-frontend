'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useIndividualDetail(treeId, xref) {
  return useQuery({
    queryKey: queryKeys.entities.detail(treeId, 'individuals', xref),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/individuals/${encodeURIComponent(xref)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to fetch individual');
      }
      return json.data;
    },
    enabled: !!treeId && !!xref,
  });
}
