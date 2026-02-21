'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout, TreePageHeader } from '@/components';
import { DataViewContainer } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

export default function TreeGivenNamesPage() {
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

      const res = await authFetch(`/api/trees/${treeId}/given-names?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch given names');
      setItems(data.data || []);
      setTotalItems(data.pagination?.total ?? data.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load given names');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  if (!treeId) return <DashboardLayout><div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <TreePageHeader treeId={treeId} title="Given Names" subtitle={`${totalItems} names`} />

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
          emptyState={{ title: 'No given names', message: 'No given names found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <div className="card bg-base-200 rounded-box p-4">
              <div className="font-medium">{row.givenName ?? row.name ?? row.value}</div>
              <div className="text-sm text-base-content/70">Count: {row.frequency ?? row.count ?? 0}</div>
            </div>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">{row.givenName ?? row.name ?? row.value}</td>
              <td className="px-6 py-4">{row.frequency ?? row.count ?? 0}</td>
            </>
          )}
          listHeaders={[
            { label: 'Given Name', key: 'name', sortable: true },
            { label: 'Count', key: 'frequency', sortable: true },
          ]}
          searchPlaceholder="Search given names..."
          searchLabel="Given name"
          advancedSearchFields={[
            { key: 'name', label: 'Given name' },
            { key: 'frequency', label: 'Count' },
          ]}
          sortOptions={[
            { value: 'name', label: 'Name' },
            { value: 'frequency', label: 'Count' },
          ]}
          defaultSort="name"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => { retryRef.current = () => fetchData(p); fetchData(p); }}
        />
      </div>
    </DashboardLayout>
  );
}
