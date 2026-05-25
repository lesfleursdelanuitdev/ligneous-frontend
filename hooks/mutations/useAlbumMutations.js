'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCreateAlbum(treeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, description, coverId }) => {
      const res = await authFetch(`/api/trees/${treeId}/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, coverId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create album');
      return data.album;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['albums', treeId] });
    },
  });
}

export function useUpdateAlbum(treeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ albumId, ...fields }) => {
      const res = await authFetch(`/api/trees/${treeId}/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update album');
      return data.album;
    },
    onSuccess: (_data, { albumId }) => {
      qc.invalidateQueries({ queryKey: ['albums', treeId] });
      qc.invalidateQueries({ queryKey: queryKeys.albums.detail(treeId, albumId) });
    },
  });
}

export function useDeleteAlbum(treeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (albumId) => {
      const res = await authFetch(`/api/trees/${treeId}/albums/${albumId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete album');
      }
    },
    onSuccess: (_data, albumId) => {
      qc.invalidateQueries({ queryKey: ['albums', treeId] });
      qc.removeQueries({ queryKey: queryKeys.albums.detail(treeId, albumId) });
      qc.removeQueries({ queryKey: queryKeys.albums.media(treeId, albumId) });
    },
  });
}

export function useAddAlbumMedia(treeId, albumId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items) => {
      const res = await authFetch(`/api/trees/${treeId}/albums/${albumId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add media');
      return data.media;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.albums.media(treeId, albumId) });
      qc.invalidateQueries({ queryKey: queryKeys.albums.detail(treeId, albumId) });
    },
  });
}

export function useRemoveAlbumMedia(treeId, albumId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId) => {
      const res = await authFetch(`/api/trees/${treeId}/albums/${albumId}/media/${mediaId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove media');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.albums.media(treeId, albumId) });
      qc.invalidateQueries({ queryKey: queryKeys.albums.detail(treeId, albumId) });
    },
  });
}

export function useReorderAlbumMedia(treeId, albumId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId, sortOrder, caption }) => {
      const res = await authFetch(`/api/trees/${treeId}/albums/${albumId}/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder, caption }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update media item');
      return data.item;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.albums.media(treeId, albumId) });
      qc.invalidateQueries({ queryKey: queryKeys.albums.detail(treeId, albumId) });
    },
  });
}
