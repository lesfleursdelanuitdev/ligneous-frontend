'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { GitMerge } from 'lucide-react';
import { DashboardLayout, TreePageHeader } from '@/components';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

export default function TreePlacesPage() {
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

      const res = await authFetch(`/api/trees/${treeId}/places?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch places');
      setItems(data.data || []);
      setTotalItems(data.pagination?.total ?? data.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load places');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  if (!treeId) return <DashboardLayout><div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <TreePageHeader treeId={treeId} title="Places" subtitle={`${totalItems} places`} />

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
          emptyState={{ title: 'No places', message: 'No places found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <div className="card bg-base-200 rounded-box p-4">
              <div className="font-medium">{row.name ?? row.place ?? row.value ?? row.id}</div>
            </div>
          )}
          renderRow={(row) => (
            <td className="px-6 py-4">{row.name ?? row.place ?? row.value ?? row.id}</td>
          )}
          listHeaders={[{ label: 'Place', key: 'name', sortable: true }]}
          searchPlaceholder="Search places..."
          searchLabel="Place name"
          advancedSearchFields={[
            { key: 'original', label: 'Full place' },
            { key: 'name', label: 'Name' },
            { key: 'country', label: 'Country' },
            { key: 'county', label: 'County' },
            { key: 'state', label: 'State' },
          ]}
          sortOptions={[{ value: 'name', label: 'Name' }]}
          defaultSort="name"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => { retryRef.current = () => fetchData(p); fetchData(p); }}
          addNewComponent={<AddNewPlaceholder message="Add new place form coming soon." />}
          extraTabs={[
            { key: 'merge', label: 'Merge', content: <AddNewPlaceholder message="Merge places form coming soon." />, icon: GitMerge },
          ]}
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
