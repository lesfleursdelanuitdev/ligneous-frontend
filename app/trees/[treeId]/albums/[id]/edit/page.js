'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import { useAlbumDetail } from '@/hooks/queries/useAlbums';
import { useUpdateAlbum, useDeleteAlbum, useRemoveAlbumMedia, useReorderAlbumMedia } from '@/hooks/mutations/useAlbumMutations';

function MediaKindBadge({ kind }) {
  const colors = { gedcom: 'badge-info', site: 'badge-success', user: 'badge-warning' };
  return <span className={`badge badge-xs ${colors[kind] ?? 'badge-ghost'}`}>{kind}</span>;
}

function MediaRow({ item, index, total, onMoveUp, onMoveDown, onRemove, onCaptionSave }) {
  const [caption, setCaption] = useState(item.caption ?? '');
  const [captionDirty, setCaptionDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCaption(item.caption ?? '');
    setCaptionDirty(false);
  }, [item.caption]);

  async function handleCaptionSave() {
    setSaving(true);
    try {
      await onCaptionSave(item.id, caption);
      setCaptionDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
        <button
          type="button"
          className="btn btn-ghost btn-xs px-1"
          disabled={index === 0}
          onClick={() => onMoveUp(item, index)}
          aria-label="Move up"
        >
          ▲
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-xs px-1"
          disabled={index === total - 1}
          onClick={() => onMoveDown(item, index)}
          aria-label="Move down"
        >
          ▼
        </button>
      </div>

      {/* Placeholder thumbnail */}
      <div className="w-12 h-12 bg-base-300 rounded flex items-center justify-center shrink-0 text-base-content/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Caption + kind */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-base-content/50 truncate font-mono">{item.mediaId.slice(0, 8)}…</span>
          <MediaKindBadge kind={item.mediaKind} />
          <span className="text-xs text-base-content/40">#{index + 1}</span>
        </div>
        {item.mediaKind !== 'gedcom' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="input input-bordered input-xs flex-1"
              placeholder="Caption…"
              value={caption}
              onChange={(e) => { setCaption(e.target.value); setCaptionDirty(true); }}
            />
            {captionDirty && (
              <button
                type="button"
                className="btn btn-xs btn-primary"
                disabled={saving}
                onClick={handleCaptionSave}
              >
                {saving ? '…' : 'Save'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Remove */}
      <button
        type="button"
        className="btn btn-ghost btn-xs text-error shrink-0"
        onClick={() => onRemove(item.id)}
        aria-label="Remove"
      >
        ✕
      </button>
    </div>
  );
}

export default function AlbumEditPage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params?.treeId;
  const albumId = params?.id;

  const { data: album, isLoading, error } = useAlbumDetail(treeId, albumId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaError, setMetaError] = useState(null);
  const [metaSaved, setMetaSaved] = useState(false);

  useEffect(() => {
    if (album) {
      setTitle(album.title ?? '');
      setDescription(album.description ?? '');
    }
  }, [album]);

  const updateAlbum = useUpdateAlbum(treeId);
  const deleteAlbum = useDeleteAlbum(treeId);
  const removeMedia = useRemoveAlbumMedia(treeId, albumId);
  const reorderMedia = useReorderAlbumMedia(treeId, albumId);

  if (!treeId || !albumId) return null;

  if (isLoading) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Edit album">
        <div className="flex items-center justify-center py-16 text-base-content/40">Loading…</div>
      </DashboardMainContentLayout>
    );
  }

  if (error) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Edit album">
        <div className="alert alert-error max-w-xl mx-auto mt-8">
          <span>{error.message}</span>
        </div>
      </DashboardMainContentLayout>
    );
  }

  if (!album) return null;

  const media = [...(album.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleMetaSave(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setMetaSaving(true);
    setMetaError(null);
    setMetaSaved(false);
    try {
      await updateAlbum.mutateAsync({ albumId, title: title.trim(), description: description.trim() || null });
      setMetaSaved(true);
      setTimeout(() => setMetaSaved(false), 2000);
    } catch (err) {
      setMetaError(err.message);
    } finally {
      setMetaSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete album "${album.title}"? This cannot be undone.`)) return;
    await deleteAlbum.mutateAsync(albumId);
    router.push(`/trees/${treeId}/albums`);
  }

  async function handleMoveUp(item, index) {
    if (index === 0) return;
    const prev = media[index - 1];
    await Promise.all([
      reorderMedia.mutateAsync({ mediaId: item.id, sortOrder: prev.sortOrder }),
      reorderMedia.mutateAsync({ mediaId: prev.id, sortOrder: item.sortOrder }),
    ]);
  }

  async function handleMoveDown(item, index) {
    if (index === media.length - 1) return;
    const next = media[index + 1];
    await Promise.all([
      reorderMedia.mutateAsync({ mediaId: item.id, sortOrder: next.sortOrder }),
      reorderMedia.mutateAsync({ mediaId: next.id, sortOrder: item.sortOrder }),
    ]);
  }

  async function handleRemove(mediaId) {
    if (!confirm('Remove this item from the album?')) return;
    await removeMedia.mutateAsync(mediaId);
  }

  async function handleCaptionSave(mediaId, caption) {
    await reorderMedia.mutateAsync({ mediaId, caption });
  }

  return (
    <DashboardMainContentLayout treeId={treeId} title="Edit album">
      <div className="max-w-2xl mx-auto space-y-8 py-4">

        {/* Back link */}
        <Link href={`/trees/${treeId}/albums/${albumId}`} className="link link-hover text-sm text-base-content/50">
          ← Back to album
        </Link>

        {/* Metadata section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Album details</h2>
          <form onSubmit={handleMetaSave} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Title <span className="text-error">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                className="input input-bordered w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
              <textarea
                id="edit-description"
                className="textarea textarea-bordered w-full"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {metaError && (
              <div className="alert alert-error text-sm"><span>{metaError}</span></div>
            )}
            {metaSaved && (
              <div className="alert alert-success text-sm"><span>Saved.</span></div>
            )}

            <button
              type="submit"
              disabled={metaSaving || !title.trim()}
              className="btn btn-primary btn-sm"
            >
              {metaSaving ? 'Saving…' : 'Save details'}
            </button>
          </form>
        </section>

        {/* Media section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Media ({media.length})</h2>
          </div>

          {media.length === 0 ? (
            <div className="border-2 border-dashed border-base-content/10 rounded-xl py-10 text-center">
              <p className="text-sm text-base-content/40">No media in this album yet.</p>
              <p className="text-xs text-base-content/30 mt-1">Use the tree media pages to add items to this album.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {media.map((item, i) => (
                <MediaRow
                  key={item.id}
                  item={item}
                  index={i}
                  total={media.length}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onRemove={handleRemove}
                  onCaptionSave={handleCaptionSave}
                />
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="space-y-3 border-t border-base-content/10 pt-6">
          <h2 className="text-lg font-semibold text-error">Danger zone</h2>
          <p className="text-sm text-base-content/60">Deleting this album is permanent and cannot be undone. Media items are not deleted.</p>
          <button
            type="button"
            className="btn btn-error btn-sm btn-outline"
            onClick={handleDelete}
            disabled={deleteAlbum.isPending}
          >
            {deleteAlbum.isPending ? 'Deleting…' : 'Delete album'}
          </button>
        </section>
      </div>
    </DashboardMainContentLayout>
  );
}
