'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  StoryCreatorClient as PkgStoryCreatorClient,
  StoryEditorPickersProvider,
  StoryEditorMediaProvider,
  StoryEditorTimelineProvider,
} from '@ligneous/story-creator/editor';
import { authFetch } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  LigneousIndividualPickerAdapter,
  LigneousFamilyPickerAdapter,
  LigneousPlacePickerAdapter,
  LigneousMediaPickerButtonAdapter,
  LigneousMediaPickerModalAdapter,
  LigneousEditorPillAdapter,
} from '@/components/stories/story-editor-pickers';
import './story-preview-themes.css';

// ── Storage ───────────────────────────────────────────────────────────────────

async function loadStoryDocument(treeId, storyId) {
  const res = await authFetch(`/api/trees/${treeId}/stories/${storyId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to load story');
  }
  return res.json();
}

async function saveStoryDocument(treeId, doc) {
  const res = await authFetch(`/api/trees/${treeId}/stories/${doc.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to save story');
  }
  const { updatedAt } = await res.json();
  return { ...doc, updatedAt };
}

async function checkSlugAvailability(treeId, storyId, slug) {
  const qs = new URLSearchParams({ slug });
  if (storyId) qs.set('excludeId', storyId);
  const res = await authFetch(`/api/trees/${treeId}/stories/check-slug?${qs}`);
  const body = await res.json().catch(() => ({}));
  return { available: !!body.available };
}

// ── Media hook ────────────────────────────────────────────────────────────────

function makeUseMediaById(treeId) {
  return function useMediaById(mediaId) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['ligneous-story-media', treeId, mediaId],
      queryFn: async () => {
        const res = await authFetch(`/api/trees/${treeId}/media/${mediaId}`);
        if (!res.ok) throw new Error('Media not found');
        return res.json();
      },
      enabled: !!treeId && !!mediaId,
      staleTime: 60_000,
    });
  };
}

// ── StoryEditorClient ─────────────────────────────────────────────────────────

/**
 * Thin adapter that wires the ligneous tree API, picker components, and media
 * hooks into the @ligneous/story-creator/editor shell.
 *
 * @param {{ treeId: string, storyId: string, backHref?: string }} props
 */
export default function StoryEditorClient({ treeId, storyId, backHref }) {
  const router = useRouter();

  // Bind callbacks to treeId
  const onLoad = useCallback((id) => loadStoryDocument(treeId, id), [treeId]);
  const onSave = useCallback((doc) => saveStoryDocument(treeId, doc), [treeId]);
  const onBack = useCallback(() => (backHref ? router.push(backHref) : router.back()), [router, backHref]);
  const onCheckSlugAvailability = useCallback(
    (slug) => checkSlugAvailability(treeId, storyId, slug),
    [treeId, storyId],
  );

  // Memoize picker component types (closed over treeId) so React doesn't remount them each render
  const IndividualSearchPicker = useMemo(
    () =>
      function IndividualPicker(props) {
        return <LigneousIndividualPickerAdapter treeId={treeId} {...props} />;
      },
    [treeId],
  );

  const FamilySearchPicker = useMemo(
    () =>
      function FamilyPicker(props) {
        return <LigneousFamilyPickerAdapter treeId={treeId} {...props} />;
      },
    [treeId],
  );

  const PlaceSearchPicker = useMemo(
    () =>
      function PlacePicker(props) {
        return <LigneousPlacePickerAdapter treeId={treeId} {...props} />;
      },
    [treeId],
  );

  const MediaPickerButton = useMemo(() => LigneousMediaPickerButtonAdapter(treeId), [treeId]);
  const MediaPickerModal = useMemo(() => LigneousMediaPickerModalAdapter(treeId), [treeId]);

  const EditorPill = LigneousEditorPillAdapter;

  // Media hook — bound to treeId
  const useMediaById = useMemo(() => makeUseMediaById(treeId), [treeId]);

  return (
    <StoryEditorPickersProvider
      IndividualSearchPicker={IndividualSearchPicker}
      FamilySearchPicker={FamilySearchPicker}
      PlaceSearchPicker={PlaceSearchPicker}
      MediaPickerButton={MediaPickerButton}
      MediaPickerModal={MediaPickerModal}
      EditorPill={EditorPill}
      // EventPickerModal, TagsPicker, AlbumsManager, NotesPicker: null (not yet wired)
    >
      <StoryEditorMediaProvider useMediaById={useMediaById}>
        {/* No timeline embed data in ligneous yet */}
        <StoryEditorTimelineProvider useTimelineEmbedData={() => ({ status: 'error', errorMessage: 'Timeline embeds not yet supported.' })}>
          <PkgStoryCreatorClient
            storyId={storyId}
            onLoad={onLoad}
            onSave={onSave}
            onBack={onBack}
            onCheckSlugAvailability={onCheckSlugAvailability}
          />
        </StoryEditorTimelineProvider>
      </StoryEditorMediaProvider>
    </StoryEditorPickersProvider>
  );
}
