'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useFollowers() {
  return useQuery({
    queryKey: queryKeys.profile.followers(),
    queryFn: async () => {
      const res = await authFetch('/api/profile/followers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch followers');
      return data.followers || [];
    },
  });
}
