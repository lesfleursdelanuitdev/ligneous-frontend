'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';

export function useDateDetail(treeId, dateId) {
  return useQuery({
    queryKey: ['trees', treeId, 'dates', dateId],
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/dates/${dateId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to fetch date details');
      return data;
    },
    enabled: !!treeId && !!dateId,
  });
}
