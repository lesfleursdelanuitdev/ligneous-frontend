'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useDashboardStats({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const res = await authFetch('/api/me/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
      return {
        treesOwned: data.treesOwned || 0,
        totalIndividuals: data.totalIndividuals || 0,
        collaborators: data.collaborators || 0,
        pendingRequests: data.pendingRequests || 0,
      };
    },
    enabled,
  });
}
