'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recipe) => {
      const res = await authFetch('/api/me/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create recipe');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'recipes'] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await authFetch(`/api/me/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete recipe');
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'recipes'] });
    },
  });
}
