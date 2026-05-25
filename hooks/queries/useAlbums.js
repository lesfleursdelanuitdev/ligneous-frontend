'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTreeAlbums(treeId, params = {}) {
  return useQuery({
    queryKey: queryKeys.albums.list(treeId, params),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      if (params.search) qs.set('search', params.search);
      const res = await authFetch(`/api/trees/${treeId}/albums?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to fetch albums');
      return data;
    },
    enabled: !!treeId,
    placeholderData: keepPreviousData,
  });
}

export function useAlbumDetail(treeId, albumId) {
  return useQuery({
    queryKey: queryKeys.albums.detail(treeId, albumId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/albums/${albumId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to fetch album');
      return data.album;
    },
    enabled: !!treeId && !!albumId,
  });
}

export function useAlbumMedia(treeId, albumId) {
  return useQuery({
    queryKey: queryKeys.albums.media(treeId, albumId),
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/albums/${albumId}/media`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to fetch album media');
      return data.media;
    },
    enabled: !!treeId && !!albumId,
  });
}
