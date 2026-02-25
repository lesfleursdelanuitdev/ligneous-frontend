'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

function buildParams(params) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.perPage) qs.set('perPage', String(params.perPage));
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  if (params.sortDirection) qs.set('sortDirection', params.sortDirection);
  return qs;
}

export function useMyMedia(params = {}) {
  return useQuery({
    queryKey: queryKeys.me.media(params),
    queryFn: async () => {
      const qs = buildParams(params);
      const res = await authFetch(`/api/me/media?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch media');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
