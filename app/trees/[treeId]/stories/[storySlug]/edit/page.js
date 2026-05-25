'use client';

import { useParams } from 'next/navigation';
import StoryEditorClient from '@/components/stories/StoryEditorClient';

export default function StoryEditPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const storySlug = params?.storySlug;

  if (!treeId || !storySlug) return null;

  return (
    <StoryEditorClient
      key={storySlug}
      treeId={treeId}
      storyId={storySlug}
      backHref={`/trees/${treeId}/stories`}
    />
  );
}
