'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: queryKeys.messages.unread(),
    queryFn: async () => {
      const res = await authFetch('/api/messages/unread');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch unread count');
      return data.count || 0;
    },
    refetchInterval: 30000,
  });
}
