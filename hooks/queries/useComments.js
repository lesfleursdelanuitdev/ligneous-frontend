'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useComments(entityType, entityId, treeId) {
  return useQuery({
    queryKey: queryKeys.comments.list(entityType, entityId),
    queryFn: async () => {
      const qs = new URLSearchParams({ entityType, entityId, treeId });
      const res = await authFetch(`/api/comments?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load comments');
      return data.comments || data;
    },
    enabled: !!entityType && !!entityId && !!treeId,
  });
}
