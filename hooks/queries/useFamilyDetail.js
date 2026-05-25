'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useFamilyDetail(treeId, familyId) {
  return useQuery({
    queryKey: queryKeys.entities.detail(treeId, 'families', familyId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/families/${encodeURIComponent(familyId)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to fetch family');
      }
      return json.data;
    },
    enabled: !!treeId && !!familyId,
  });
}
