'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCreateComment(treeId, threadId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }) => {
      const res = await authFetch(
        `/api/trees/${treeId}/research/most-wanted/${threadId}/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, parentId: parentId || undefined }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.threads.comments(treeId, threadId, postId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.threads.posts(treeId, threadId),
      });
    },
  });
}
