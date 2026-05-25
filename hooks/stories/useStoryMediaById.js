'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';

async function fetchStoryMedia(treeId, mediaId) {
  const res = await authFetch(`/api/trees/${treeId}/media/${mediaId}`);
  if (!res.ok) throw new Error('Media not found');
  return res.json();
}

/**
 * Fetches a single media item by ID for the story editor inspector.
 * Returns { data, isLoading } matching the package's StoryEditorMediaContextValue shape.
 */
export function useStoryMediaById(treeId) {
  return function useBoundMediaById(mediaId) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['ligneous-story-media', treeId, mediaId],
      queryFn: () => fetchStoryMedia(treeId, mediaId),
      enabled: !!treeId && !!mediaId,
      staleTime: 60_000,
    });
  };
}
