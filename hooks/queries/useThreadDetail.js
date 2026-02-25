'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useThreadDetail(treeId, threadId) {
  return useQuery({
    queryKey: queryKeys.threads.detail(treeId, threadId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/research/most-wanted/${threadId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load thread');
      return data;
    },
    enabled: !!treeId && !!threadId,
  });
}

export function useThreadPosts(treeId, threadId) {
  return useQuery({
    queryKey: queryKeys.threads.posts(treeId, threadId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/research/most-wanted/${threadId}/posts`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load posts');
      return data;
    },
    enabled: !!treeId && !!threadId,
  });
}
