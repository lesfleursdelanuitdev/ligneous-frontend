'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/api';

/**
 * TreePageHeader — Shows tree context at top of tree-scoped pages.
 * Fetches tree name from meta API and displays back link + tree name + page title.
 */
export default function TreePageHeader({ treeId, title, subtitle, className = '' }) {
  const [treeName, setTreeName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!treeId) return;
    let cancelled = false;
    async function fetchTree() {
      try {
        const res = await authFetch(`/api/trees/${treeId}/meta`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setTreeName(data.tree?.name ?? null);
      } catch {
        if (!cancelled) setTreeName(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTree();
    return () => { cancelled = true; };
  }, [treeId]);

  if (!treeId) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <Link href={`/trees/${treeId}`} className="text-sm link link-primary inline-block">
        &larr; Tree overview
      </Link>
      {treeName && (
        <p className="uppercase text-sm text-secondary tracking-wide">
          {treeName}
        </p>
      )}
      {loading && !treeName && (
        <div className="h-4 w-32 bg-base-200 rounded animate-pulse" />
      )}
      <h1 className="text-2xl font-bold text-base-content">{title}</h1>
      {subtitle && <p className="text-base-content/60">{subtitle}</p>}
    </div>
  );
}
