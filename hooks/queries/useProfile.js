'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: async () => {
      const res = await authFetch('/api/profile');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
      return data;
    },
  });
}
