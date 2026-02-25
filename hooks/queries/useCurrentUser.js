'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCurrentUser({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      const res = await authFetch('/api/auth/me');
      if (!res.ok) {
        if (res.status === 401) return null;
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch current user');
      }
      const data = await res.json();
      return data.user || data;
    },
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
