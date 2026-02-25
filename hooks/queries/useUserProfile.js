'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useUserProfile(userId) {
  return useQuery({
    queryKey: queryKeys.profile.user(userId),
    queryFn: async () => {
      const res = await authFetch(`/api/users/${userId}/profile`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');
      return data;
    },
    enabled: !!userId,
  });
}
