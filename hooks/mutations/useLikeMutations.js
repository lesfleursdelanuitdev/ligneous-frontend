'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTogglePostLike(treeId, threadId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, liked }) => {
      const url = `/api/trees/${treeId}/research/most-wanted/${threadId}/posts/${postId}/like`;
      const res = await authFetch(url, { method: liked ? 'DELETE' : 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to toggle like');
      return { ...data, newLiked: !liked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.posts(treeId, threadId) });
    },
  });
}

export function useToggleCommentLike(treeId, threadId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, commentId, liked }) => {
      const url = `/api/trees/${treeId}/research/most-wanted/${threadId}/posts/${postId}/comments/${commentId}/like`;
      const res = await authFetch(url, { method: liked ? 'DELETE' : 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to toggle like');
      return data;
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.threads.comments(treeId, threadId, postId),
      });
    },
  });
}
