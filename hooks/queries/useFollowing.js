'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useFollowing() {
  return useQuery({
    queryKey: queryKeys.profile.following(),
    queryFn: async () => {
      const res = await authFetch('/api/profile/following');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch following');
      return data.following || [];
    },
  });
}
