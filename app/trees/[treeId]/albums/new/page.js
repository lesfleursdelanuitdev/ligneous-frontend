'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import { useCreateAlbum } from '@/hooks/mutations/useAlbumMutations';

export default function NewAlbumPage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params?.treeId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  const createAlbum = useCreateAlbum(treeId);

  if (!treeId) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    try {
      const album = await createAlbum.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      router.push(`/trees/${treeId}/albums/${album.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <DashboardMainContentLayout treeId={treeId} title="New album">
      <div className="max-w-lg mx-auto space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New album</h1>
          <p className="mt-1 text-sm text-base-content/60">Give your album a title to get started. You can add media after creating it.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="album-title" className="text-sm font-medium">
              Title <span className="text-error">*</span>
            </label>
            <input
              id="album-title"
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g. Smith Family Photos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="album-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="album-description"
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder="Optional description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <div className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={createAlbum.isPending || !title.trim()}
              className="btn btn-primary"
            >
              {createAlbum.isPending ? 'Creating…' : 'Create album'}
            </button>
            <Link href={`/trees/${treeId}/albums`} className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardMainContentLayout>
  );
}
