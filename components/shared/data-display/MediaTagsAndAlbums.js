'use client';

/**
 * Renders tags as badges and albums as a comma-separated list (or badges).
 * Used on media pages (pictures, videos, audio, documents).
 */
export function TagsCell({ tags }) {
  if (!tags || tags.length === 0) return <span className="text-base-content/40">—</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={typeof tag === 'string' ? tag : tag.name} className="badge badge-ghost badge-sm">
          {typeof tag === 'string' ? tag : tag.name}
        </span>
      ))}
    </span>
  );
}

export function AlbumsCell({ albums }) {
  if (!albums || albums.length === 0) return <span className="text-base-content/40">—</span>;
  const names = albums.map((a) => (typeof a === 'string' ? a : a.name));
  return <span className="text-sm text-base-content/70">{names.join(', ')}</span>;
}
