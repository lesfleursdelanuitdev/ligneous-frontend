'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useConversation(id) {
  return useQuery({
    queryKey: queryKeys.messages.conversation(id),
    queryFn: async () => {
      const res = await authFetch(`/api/messages/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch conversation');
      return data;
    },
    enabled: !!id,
  });
}
