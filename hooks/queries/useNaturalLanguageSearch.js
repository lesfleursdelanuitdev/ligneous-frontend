'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Run a natural-language search against the Python research API via the
 * authenticated /api/research proxy. Tree access is enforced server-side.
 *
 * Returns a TanStack `useMutation` so callers can trigger the request on
 * submit and get cached state back (loading, error, data).
 */
export function useNaturalLanguageSearch(treeId) {
  return useMutation({
    mutationFn: async ({ query, context }) => {
      if (!treeId) throw new Error('treeId is required');
      if (!query || !query.trim()) throw new Error('Query is required');

      const res = await authFetch(
        `/api/research/trees/${encodeURIComponent(treeId)}/nl-search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : `NL search failed (HTTP ${res.status})`
        );
      }
      return data;
    },
  });
}

/**
 * Fetch starter prompts and the supported intent catalog for a tree.
 */
export function useNaturalLanguageSuggestions(treeId) {
  return useQuery({
    queryKey: queryKeys.nlSearch.suggestions(treeId),
    queryFn: async () => {
      const res = await authFetch(
        `/api/research/trees/${encodeURIComponent(treeId)}/nl-search/suggestions`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === 'string' ? data.error : 'Failed to load suggestions'
        );
      }
      return data;
    },
    enabled: !!treeId,
    staleTime: 5 * 60 * 1000,
  });
}
