'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { GitMerge } from 'lucide-react';
import { DashboardLayout, TreePageHeader } from '@/components';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

function stripSlashes(name) {
  if (!name) return null;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

export default function TreeFamiliesPage() {
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

      const res = await authFetch(`/api/trees/${treeId}/families?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch families');
      setItems(data.data || []);
      setTotalItems(data.pagination?.total ?? data.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load families');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  const husbandName = (f) => stripSlashes(f.husband?.fullName) ?? '\u2014';
  const wifeName = (f) => stripSlashes(f.wife?.fullName) ?? '\u2014';

  if (!treeId) {
    return <DashboardLayout><div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <TreePageHeader treeId={treeId} title="Families" subtitle={`${totalItems} families`} />

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
          emptyState={{ title: 'No families', message: 'No families found in this tree.' }}
          defaultView="list"
          renderCard={(f) => (
            <div className="card bg-base-200 rounded-box p-4">
              <div className="font-medium">{f.xref}</div>
              <div className="text-sm text-base-content/70">Husband: {husbandName(f)}</div>
              <div className="text-sm text-base-content/70">Wife: {wifeName(f)}</div>
              <div className="text-sm text-base-content/70">Children: {f.childrenCount ?? 0}</div>
            </div>
          )}
          renderRow={(f) => (
            <>
              <td className="px-6 py-4 font-mono text-sm">{f.xref}</td>
              <td className="px-6 py-4">{husbandName(f)}</td>
              <td className="px-6 py-4">{wifeName(f)}</td>
              <td className="px-6 py-4">{f.childrenCount ?? 0}</td>
            </>
          )}
          listHeaders={[
            { label: 'ID', key: 'xref', sortable: false },
            { label: 'Husband', key: 'husband', sortable: true },
            { label: 'Wife', key: 'wife', sortable: true },
            { label: 'Children', key: 'children_count', sortable: true },
          ]}
          searchPlaceholder="Search families..."
          searchLabel="Husband / Wife name"
          advancedSearchFields={[
            { key: 'xref', label: 'Family ID' },
            { key: 'husband', label: 'Husband' },
            { key: 'wife', label: 'Wife' },
            { key: 'children_count', label: 'Children count' },
          ]}
          sortOptions={[
            { value: 'husband', label: 'Husband' },
            { value: 'wife', label: 'Wife' },
            { value: 'children_count', label: 'Children' },
          ]}
          defaultSort="husband"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => { retryRef.current = () => fetchData(p); fetchData(p); }}
          addNewComponent={<AddNewPlaceholder message="Add new family form coming soon." />}
          extraTabs={[
            { key: 'merge', label: 'Merge', content: <AddNewPlaceholder message="Merge families form coming soon." />, icon: GitMerge },
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
