'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, TreeCard } from '@/components';
import { DataView } from '@/components/shared/data-display';
import { ViewToggle } from '@/components/shared/navigation';
import { authFetch } from '@/lib/api';

export default function MyTreesPage() {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('card');

  const fetchTrees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch('/api/trees?filter=owned');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trees');
      }

      const transformedTrees = (data.trees || []).map((tree) => {
        const primaryOwner = tree.owners?.find((o) => o.isPrimary)?.user || tree.owners?.[0]?.user;
        return {
          id: tree.id,
          name: tree.name,
          description: tree.description || '',
          isPublic: tree.isPublic,
          individualsCount: tree.individualsCount ?? 0,
          familiesCount: tree.familiesCount ?? 0,
          fileId: tree.fileId,
          owner: primaryOwner
            ? {
                name: primaryOwner.name || primaryOwner.username,
                username: primaryOwner.username,
              }
            : null,
          owners: tree.owners,
          updatedAt: tree.updatedAt,
          createdAt: tree.createdAt,
        };
      });

      setTrees(transformedTrees);
    } catch (err) {
      console.error('Failed to fetch my trees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const listHeaders = [
    { label: 'Name', key: 'name', sortable: true },
    { label: 'People', key: 'individualsCount', sortable: true },
    { label: 'Families', key: 'familiesCount', sortable: true },
    { label: 'Visibility', key: 'isPublic', sortable: false },
    { label: 'Updated', key: 'updatedAt', sortable: true },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">
          My Trees
        </h1>
        <p className="text-base-content/60 mt-1">
          Trees you own or maintain
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => fetchTrees()}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-10 w-48 bg-base-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-base-200 rounded-box animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <p className="text-sm text-base-content/60">
              {trees.length} {trees.length === 1 ? 'tree' : 'trees'}
            </p>
            <ViewToggle view={view} onViewChange={setView} />
          </div>

          {trees.length === 0 ? (
            <div className="card bg-base-100 border border-base-content/10 p-12 text-center rounded-box">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-base-content/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-base-content mb-2">
                No trees yet
              </h3>
              <p className="text-base-content/60 mb-4">
                Upload a GEDCOM file to create your first tree.
              </p>
              <a href="/upload" className="btn btn-primary">
                Upload GEDCOM
              </a>
            </div>
          ) : (
            <DataView
              view={view}
              items={trees}
              renderCard={(tree) => (
                <TreeCard
                  tree={tree}
                  onRequestAccess={null}
                />
              )}
              renderRow={(tree) => (
                <>
                  <td className="px-6 py-4">
                    <a
                      href={`/trees/${tree.id}`}
                      className="link link-primary font-medium"
                    >
                      {tree.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-base-content/70">
                    {tree.individualsCount?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-6 py-4 text-base-content/70">
                    {tree.familiesCount?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge badge-sm ${tree.isPublic ? 'badge-success' : 'badge-ghost'}`}
                    >
                      {tree.isPublic ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-base-content/60">
                    {tree.updatedAt
                      ? new Date(tree.updatedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </>
              )}
              listViewProps={{ headers: listHeaders }}
              className={view === 'list' ? 'overflow-x-auto' : ''}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
