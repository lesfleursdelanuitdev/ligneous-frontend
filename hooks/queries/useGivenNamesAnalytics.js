'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Fetch given names analytics from Python API via research proxy.
 * Requires tree read access (enforced by proxy).
 */
export function useGivenNamesAnalytics(treeId, opts = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.givenNames(treeId),
    queryFn: async () => {
      const limit = opts.limit ?? 50;
      const res = await authFetch(
        `/api/research/trees/${treeId}/analytics/given-names?limit=${limit}`
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
