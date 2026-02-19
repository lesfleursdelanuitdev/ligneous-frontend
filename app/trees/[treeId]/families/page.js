'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFacet, useListener } from 'mycelia-kernel-plugin/react';
import { DashboardLayout } from '@/components';
import { DataView } from '@/components/shared/data-display';
import { ViewToggle } from '@/components/shared/navigation';

export default function TreeFamiliesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const gedcomFamilies = useFacet('gedcomFamilies');

  const [state, setState] = useState(() =>
    gedcomFamilies?.getState?.() ?? { loading: false, error: null, families: [] }
  );
  const [view, setView] = useState('list');

  useListener('gedcomFamilies:stateChanged', (ev) => {
    const next = ev?.body ?? gedcomFamilies?.getState?.();
    if (next) setState(next);
  });

  const fetchFamilies = useCallback(() => {
    if (treeId && gedcomFamilies?.getFamiliesByTreeId) {
      gedcomFamilies.getFamiliesByTreeId(treeId, { limit: 500 }).catch(() => {});
    }
  }, [treeId, gedcomFamilies]);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  const { loading, error, families } = state;
  const listHeaders = [
    { label: 'ID', key: 'xref', sortable: false },
    { label: 'Husband', key: 'husband', sortable: false },
    { label: 'Wife', key: 'wife', sortable: false },
    { label: 'Children', key: 'children_count', sortable: false },
  ];

  if (!treeId) {
    return (
      <DashboardLayout>
        <div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div>
      </DashboardLayout>
    );
  }

  const husbandName = (f) => f.husband_name ?? f.husband?.name ?? '—';
  const wifeName = (f) => f.wife_name ?? f.wife?.name ?? '—';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/trees/${treeId}`} className="text-sm link link-primary mb-1 inline-block">← Tree overview</Link>
            <h1 className="text-2xl font-bold text-base-content">Families</h1>
            <p className="text-base-content/60 mt-1">{families?.length ?? 0} families</p>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
        {error && (
          <div className="alert alert-error flex items-center justify-between gap-4">
            <span>{typeof error === 'string' ? error : error?.message ?? 'Something went wrong'}</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={fetchFamilies}>
              Try again
            </button>
          </div>
        )}
        {loading ? (
          <div className="rounded-box border border-base-content/10 bg-base-200/50 p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm text-base-content/60">Loading families…</p>
          </div>
        ) : error ? null : !families?.length ? (
          <div className="card bg-base-100 border border-base-content/10 p-12 text-center rounded-box">
            <p className="text-base-content/60">No families in this tree.</p>
          </div>
        ) : (
          <DataView
            view={view}
            items={families}
            renderCard={(f) => (
              <div className="card bg-base-200 rounded-box p-4">
                <div className="font-medium">{f.xref}</div>
                <div className="text-sm text-base-content/70">Husband: {husbandName(f)}</div>
                <div className="text-sm text-base-content/70">Wife: {wifeName(f)}</div>
              </div>
            )}
            renderRow={(f) => (
              <>
                <td className="px-6 py-4 font-mono text-sm">{f.xref}</td>
                <td className="px-6 py-4">{husbandName(f)}</td>
                <td className="px-6 py-4">{wifeName(f)}</td>
                <td className="px-6 py-4">{f.children_count ?? 0}</td>
              </>
            )}
            listViewProps={{ headers: listHeaders }}
            className={view === 'list' ? 'overflow-x-auto' : ''}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
