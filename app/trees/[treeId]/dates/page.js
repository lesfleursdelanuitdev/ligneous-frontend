'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GitMerge } from 'lucide-react';
import { DashboardLayout, TreePageHeader } from '@/components';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

const MONTH_ABBR = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const TYPE_LABELS = {
  birth: 'Birth', death: 'Death', marriage: 'Marriage',
  divorce: 'Divorce', event: 'Other',
};
const TYPE_BADGE_COLORS = {
  birth: 'badge-success', death: 'badge-error',
  marriage: 'badge-info', divorce: 'badge-warning', event: 'badge-neutral',
};

function contextBadges(context) {
  if (!context || !Array.isArray(context) || context.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {context.map((c) => (
        <span key={c.type} className={`badge badge-sm ${TYPE_BADGE_COLORS[c.type] || 'badge-neutral'}`}>
          {TYPE_LABELS[c.type] || c.type}({c.count})
        </span>
      ))}
    </span>
  );
}

export default function TreeDatesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const retryRef = useRef(null);

  const fetchData = useCallback(async ({ search, advancedConditions, filters, sort, sortDirection, page, perPage }) => {
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
      if (filters?.context) qs.set('context', filters.context);
      if (advancedConditions?.length > 0) qs.set('advanced_conditions', JSON.stringify(advancedConditions));

      const res = await authFetch(`/api/trees/${treeId}/dates?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch dates');
      setItems(data.data || []);
      setTotalItems(data.pagination?.total ?? data.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load dates');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  if (!treeId) return <DashboardLayout><div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <TreePageHeader treeId={treeId} title="Dates" subtitle={`${totalItems} date entries`} />

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
          emptyState={{ title: 'No dates', message: 'No dates found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <Link href={`/trees/${treeId}/dates/${row.id}`} className="card bg-base-200 rounded-box p-4 hover:bg-base-300 transition-colors block">
              <div className="font-medium">{row.original || '\u2014'}</div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {row.year && <span className="text-sm text-base-content/70">{row.year}</span>}
                {row.month && <span className="text-xs text-base-content/50">{MONTH_ABBR[row.month]}</span>}
                {row.day && <span className="text-xs text-base-content/50">Day {row.day}</span>}
              </div>
              {row.context && <div className="mt-2">{contextBadges(row.context)}</div>}
            </Link>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">
                <Link href={`/trees/${treeId}/dates/${row.id}`} className="link link-primary font-medium">{row.original || '\u2014'}</Link>
              </td>
              <td className="px-6 py-4 text-sm text-base-content/70">{row.year ?? '\u2014'}</td>
              <td className="px-6 py-4 text-sm text-base-content/70">{row.month ? MONTH_ABBR[row.month] : '\u2014'}</td>
              <td className="px-6 py-4 text-sm text-base-content/70">{row.day ?? '\u2014'}</td>
              <td className="px-6 py-4">{contextBadges(row.context) || <span className="text-base-content/40">{'\u2014'}</span>}</td>
            </>
          )}
          listHeaders={[
            { label: 'Date', key: 'original', sortable: false },
            { label: 'Year', key: 'year', sortable: true },
            { label: 'Month', key: 'month', sortable: true },
            { label: 'Day', key: 'day', sortable: true },
            { label: 'Context', key: 'context', sortable: false },
          ]}
          searchPlaceholder="Search dates..."
          searchLabel="Date text"
          filters={[
            { key: 'context', label: 'Context', type: 'select', options: [
              { value: 'birth', label: 'Birth' },
              { value: 'death', label: 'Death' },
              { value: 'marriage', label: 'Marriage' },
              { value: 'divorce', label: 'Divorce' },
              { value: 'event', label: 'Other events' },
            ]},
          ]}
          advancedSearchFields={[
            { key: 'original', label: 'Date text' },
            { key: 'year', label: 'Year' },
            { key: 'month', label: 'Month' },
            { key: 'day', label: 'Day' },
            { key: 'date_type', label: 'Date type' },
          ]}
          sortOptions={[
            { value: 'year', label: 'Year' },
            { value: 'month', label: 'Month' },
            { value: 'day', label: 'Day' },
          ]}
          defaultSort="year"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => { retryRef.current = () => fetchData(p); fetchData(p); }}
          addNewComponent={<AddNewPlaceholder message="Add new date form coming soon." />}
          extraTabs={[
            { key: 'merge', label: 'Merge', content: <AddNewPlaceholder message="Merge dates form coming soon." />, icon: GitMerge },
          ]}
          actions={[
            { key: 'view', label: 'View', href: (item) => `/trees/${treeId}/dates/${item.id}` },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
