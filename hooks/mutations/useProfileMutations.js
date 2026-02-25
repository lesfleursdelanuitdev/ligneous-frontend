'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileData) => {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.current() });
    },
  });
}

export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const res = await authFetch('/api/profile/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to follow user');
      return data;
    },
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.following() });
      qc.invalidateQueries({ queryKey: queryKeys.profile.user(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.profile.current() });
    },
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const res = await authFetch(`/api/profile/follow?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unfollow user');
      return data;
    },
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.following() });
      qc.invalidateQueries({ queryKey: queryKeys.profile.user(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.profile.current() });
    },
  });
}
