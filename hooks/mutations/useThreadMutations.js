'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useToggleThreadResolved(treeId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, isClosed }) => {
      const res = await authFetch(`/api/trees/${treeId}/research/most-wanted/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    },
    onSuccess: (_data, { threadId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.list(treeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.detail(treeId, threadId) });
    },
  });
}

export function useCreateThread(treeId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description }) => {
      const res = await authFetch(`/api/trees/${treeId}/research/most-wanted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.list(treeId) });
    },
  });
}

export function useCreatePost(treeId, threadId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content }) => {
      const res = await authFetch(`/api/trees/${treeId}/research/most-wanted/${threadId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.posts(treeId, threadId) });
    },
  });
}
