'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

function buildSearchParams({ search, advancedConditions, filters, sort, sortDirection, page, perPage }) {
  const qs = new URLSearchParams();
  if (perPage) qs.set('limit', String(perPage));
  if (page && perPage) qs.set('offset', String((page - 1) * perPage));
  if (search) qs.set('search', search);
  if (sort) qs.set('sort', sort);
  if (sortDirection) qs.set('order', sortDirection);
  if (advancedConditions?.length > 0) {
    qs.set('advanced_conditions', JSON.stringify(advancedConditions));
  }
  if (filters && typeof filters === 'object') {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        qs.set(key, String(value));
      }
    }
  }
  return qs;
}

export function useTreeEntityList(treeId, entityType, params = {}) {
  return useQuery({
    queryKey: queryKeys.entities.list(treeId, entityType, params),
    queryFn: async () => {
      const qs = buildSearchParams(params);
      const res = await authFetch(`/api/trees/${treeId}/${entityType}?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === 'string' ? data.error : `Failed to fetch ${entityType}`
        );
      }
      return data;
    },
    enabled: !!treeId,
    placeholderData: keepPreviousData,
  });
}
