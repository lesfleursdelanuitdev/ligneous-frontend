'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';

export function useCreateFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post) => {
      const res = await authFetch('/api/me/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'feed'] });
    },
  });
}

export function useDeleteFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await authFetch(`/api/me/feed/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete post');
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'feed'] });
    },
  });
}
