'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { authFetch } from '@/lib/api';

export default function TreeOverviewPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!treeId) return;

    let cancelled = false;

    async function fetchTree() {
      try {
        setLoading(true);
        setError(null);
        const res = await authFetch(`/api/trees/${treeId}/meta`);
        const data = await res.json();

        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || 'Failed to load tree');
          return;
        }
        setTree(data.tree);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load tree');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTree();
    return () => { cancelled = true; };
  }, [treeId]);

  if (!treeId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-base-content/60">Missing tree ID.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-base-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-base-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-base-200 rounded-box animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tree) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="alert alert-error">
            <span>{error || 'Tree not found'}</span>
          </div>
          <Link href="/my-trees" className="link link-primary mt-4 inline-block">
            ← Back to My Trees
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statLinks = [
    { label: 'Individuals', href: `/trees/${treeId}/individuals`, value: tree.individualsCount ?? 0 },
    { label: 'Families', href: `/trees/${treeId}/families`, value: tree.familiesCount ?? 0 },
    { label: 'Places', href: `/trees/${treeId}/places`, value: '—' },
    { label: 'Sources', href: `/trees/${treeId}/sources`, value: '—' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-base-content">
            {tree.name}
          </h1>
          {tree.description && (
            <p className="text-base-content/70 mt-1">{tree.description}</p>
          )}
          {tree.owner && (
            <p className="text-sm text-base-content/50 mt-1">
              Owner: {tree.owner.name || tree.owner.username}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statLinks.map(({ label, href, value }) => (
            <Link
              key={label}
              href={href}
              className="card bg-base-200 rounded-box p-4 hover:bg-base-300 transition-colors"
            >
              <div className="text-2xl font-bold text-base-content">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              <div className="text-sm text-base-content/60">{label}</div>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/trees/${treeId}/individuals`} className="btn btn-primary">
            View individuals
          </Link>
          <Link href={`/trees/${treeId}/families`} className="btn btn-outline">
            View families
          </Link>
          <Link href={`/trees/${treeId}/places`} className="btn btn-ghost">
            Places
          </Link>
          <Link href={`/trees/${treeId}/sources`} className="btn btn-ghost">
            Sources
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
