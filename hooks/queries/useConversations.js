'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.messages.conversations(),
    queryFn: async () => {
      const res = await authFetch('/api/messages');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch conversations');
      return data.conversations || [];
    },
  });
}
