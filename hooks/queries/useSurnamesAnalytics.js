'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Fetch surname analytics from Python API via research proxy.
 * Requires tree read access (enforced by proxy).
 */
export function useSurnamesAnalytics(treeId, opts = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.surnames(treeId),
    queryFn: async () => {
      const limit = opts.limit ?? 50;
      const res = await authFetch(
        `/api/research/trees/${treeId}/analytics/surnames?limit=${limit}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === 'string' ? data.error : 'Failed to fetch analytics'
        );
      }
      return data;
    },
    enabled: !!treeId,
  });
}
