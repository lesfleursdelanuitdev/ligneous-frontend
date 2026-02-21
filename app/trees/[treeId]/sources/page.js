'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout, TreePageHeader } from '@/components';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

export default function TreeSourcesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const retryRef = useRef(null);

  const fetchData = useCallback(async ({ search, advancedConditions, sort, sortDirection, page, perPage }) => {
    if (!treeId) return;
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      qs.set('limit', String(perPage));
      qs.set('offset', String((page - 1) * perPage));
      if (search) qs.set('search', search);
      if (sort) qs.set('sort', sort);
      qs.set('order', sortDirection);
      if (advancedConditions?.length > 0) qs.set('advanced_conditions', JSON.stringify(advancedConditions));

      const res = await authFetch(`/api/trees/${treeId}/sources?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch sources');
      setItems(data.data || []);
      setTotalItems(data.pagination?.total ?? data.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  if (!treeId) return <DashboardLayout><div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <TreePageHeader treeId={treeId} title="Sources" subtitle={`${totalItems} sources`} />

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
          emptyState={{ title: 'No sources', message: 'No sources found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <div className="card bg-base-200 rounded-box p-4">
              <div className="font-medium">{row.title ?? row.name ?? row.xref}</div>
              <div className="text-sm text-base-content/70 font-mono">{row.xref}</div>
            </div>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">{row.title ?? row.name ?? '\u2014'}</td>
              <td className="px-6 py-4 font-mono text-sm">{row.xref ?? '\u2014'}</td>
            </>
          )}
          listHeaders={[
            { label: 'Source', key: 'title', sortable: true },
            { label: 'XREF', key: 'xref', sortable: false },
          ]}
          searchPlaceholder="Search sources..."
          searchLabel="Source title"
          advancedSearchFields={[
            { key: 'xref', label: 'XREF' },
            { key: 'title', label: 'Title' },
            { key: 'author', label: 'Author' },
          ]}
          sortOptions={[{ value: 'title', label: 'Title' }]}
          defaultSort="title"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => { retryRef.current = () => fetchData(p); fetchData(p); }}
          addNewComponent={<AddNewPlaceholder message="Add new source form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
