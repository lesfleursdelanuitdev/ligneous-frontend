'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { DataView } from '@/components/shared/data-display';
import { ViewToggle } from '@/components/shared/navigation';
import { authFetch } from '@/lib/api';

export default function TreeGivenNamesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list');

  const fetchData = useCallback(async () => {
    if (!treeId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(`/api/trees/${treeId}/given-names?limit=500`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === 'string' ? data.error : (data?.error?.message ?? data?.message ?? 'Failed to fetch');
        throw new Error(msg);
      }
      setItems(data.given_names || data.items || []);
    } catch (err) {
      setError(err?.message && typeof err.message === 'string' ? err.message : String(err) || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!treeId) return (<DashboardLayout><div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div></DashboardLayout>);

  const headers = [{ label: 'Given name', key: 'name', sortable: false }, { label: 'Count', key: 'frequency', sortable: false }];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/trees/${treeId}`} className="text-sm link link-primary mb-1 inline-block">← Tree overview</Link>
            <h1 className="text-2xl font-bold text-base-content">Given names</h1>
            <p className="text-base-content/60 mt-1">{items.length} names</p>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
        {error && (
          <div className="alert alert-error flex items-center justify-between gap-4">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => fetchData()}>Try again</button>
          </div>
        )}
        {loading ? (
          <div className="rounded-box border border-base-content/10 bg-base-200/50 p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm text-base-content/60">Loading…</p>
          </div>
        ) : error ? null : items.length === 0 ? (
          <div className="card bg-base-100 border border-base-content/10 p-12 text-center rounded-box"><p className="text-base-content/60">No given names in this tree.</p></div>
        ) : (
          <DataView
            view={view}
            items={items}
            renderCard={(row) => (
              <div className="card bg-base-200 rounded-box p-4">
                <div className="font-medium">{row.name ?? row.given_name ?? row.value}</div>
                <div className="text-sm text-base-content/70">Count: {row.frequency ?? row.count ?? 0}</div>
              </div>
            )}
            renderRow={(row) => (
              <>
                <td className="px-6 py-4">{row.name ?? row.given_name ?? row.value}</td>
                <td className="px-6 py-4">{row.frequency ?? row.count ?? 0}</td>
              </>
            )}
            listViewProps={{ headers }}
            className={view === 'list' ? 'overflow-x-auto' : ''}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
