'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { DashboardMainContentLayout } from '@/components';
import { StoryViewer } from '@/components/stories/StoryViewer';

export default function StoryViewerPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const storySlug = params?.storySlug;

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ['story', treeId, storySlug],
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/stories/${storySlug}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to load story');
      }
      return res.json();
    },
    enabled: !!treeId && !!storySlug,
  });

  if (!treeId || !storySlug) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Story">
        <p className="text-base-content/60">Missing parameters.</p>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout treeId={treeId} title={doc?.title ?? 'Story'}>
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-base-content/40">Loading…</div>
      )}
      {error && (
        <div className="alert alert-error max-w-xl mx-auto mt-8">
          <span>{error.message}</span>
        </div>
      )}
      {doc && <StoryViewer doc={doc} />}
    </DashboardMainContentLayout>
  );
}
