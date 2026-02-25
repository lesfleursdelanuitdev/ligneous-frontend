'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

function buildSearchParams(params, fixedFilter) {
  const qs = new URLSearchParams();
  if (fixedFilter) qs.set('filter', fixedFilter);
  if (params.perPage) qs.set('limit', String(params.perPage));
  if (params.page && params.perPage) qs.set('offset', String((params.page - 1) * params.perPage));
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  if (params.sortDirection) qs.set('order', params.sortDirection);
  if (params.advancedConditions?.length > 0) {
    qs.set('advanced_conditions', JSON.stringify(params.advancedConditions));
  }
  if (params.filters && typeof params.filters === 'object') {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value && value !== 'all') qs.set(key, String(value));
    }
  }
  return qs;
}

export function useMyTrees(params = {}) {
  return useQuery({
    queryKey: queryKeys.trees.mine().concat([params]),
    queryFn: async () => {
      const qs = buildSearchParams(params, 'owned');
      const res = await authFetch(`/api/trees?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch trees');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useExploreTrees(params = {}) {
  return useQuery({
    queryKey: queryKeys.trees.explore().concat([params]),
    queryFn: async () => {
      const qs = buildSearchParams(params);
      const res = await authFetch(`/api/trees?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch trees');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
