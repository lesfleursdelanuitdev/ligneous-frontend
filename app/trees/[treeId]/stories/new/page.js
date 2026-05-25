'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import { authFetch } from '@/lib/api';

const KIND_OPTIONS = [
  { value: 'story', label: 'Story', description: 'A narrative story about people or events in the tree.' },
  { value: 'article', label: 'Article', description: 'A reference article or research note.' },
  { value: 'folklore', label: 'Folklore', description: 'Family folklore, legend, or tradition.' },
  { value: 'post', label: 'Post', description: 'A short update or announcement.' },
];

export default function NewStoryPage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params?.treeId;

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('story');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!treeId) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch(`/api/trees/${treeId}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), kind }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to create story');
      }
      const { slug, id } = body;
      router.push(`/trees/${treeId}/stories/${slug ?? id}/edit`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <DashboardMainContentLayout treeId={treeId} title="New story">
      <div className="max-w-lg mx-auto space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New story</h1>
          <p className="mt-1 text-sm text-base-content/60">Give your story a title and choose a type to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="story-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="story-title"
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g. How Grandpa came to America"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Type</p>
            <div className="grid grid-cols-2 gap-2">
              {KIND_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${kind === opt.value ? 'border-primary bg-primary/5' : 'border-base-content/10 hover:border-base-content/25'}`}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={opt.value}
                    checked={kind === opt.value}
                    onChange={() => setKind(opt.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold text-base-content">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-base-content/60 leading-snug">{opt.description}</p>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={submitting || !title.trim()} className="btn btn-primary">
              {submitting ? 'Creating…' : 'Create & open editor'}
            </button>
            <Link href={`/trees/${treeId}/stories`} className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardMainContentLayout>
  );
}
