'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout, TreePageHeader } from '@/components';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

function LinkedTo({ items, treeId }) {
  if (!items || items.length === 0) return <span className="text-base-content/40">{'\u2014'}</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-1.5 gap-y-0.5">
      {items.map((link, i) => {
        if (link.type === 'individual') {
          return (
            <Link key={i} href={`/trees/${treeId}/individuals/${encodeURIComponent(link.xref)}`} className="link link-primary text-sm">
              {link.name || link.xref}
            </Link>
          );
        }
        const parts = [link.husbandName, link.wifeName].filter(Boolean);
        if (parts.length === 0) return <span key={i} className="text-sm text-base-content/60">{link.xref}</span>;
        return (
          <span key={i} className="inline-flex flex-wrap items-center gap-x-1 text-sm">
            {link.husbandXref ? <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(link.husbandXref)}`} className="link link-primary">{link.husbandName}</Link> : link.husbandName ? <span>{link.husbandName}</span> : null}
            {link.husbandName && link.wifeName && <span className="text-base-content/40">&amp;</span>}
            {link.wifeXref ? <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(link.wifeXref)}`} className="link link-primary">{link.wifeName}</Link> : link.wifeName ? <span>{link.wifeName}</span> : null}
          </span>
        );
      })}
    </span>
  );
}

export default function TreeEventsPage() {
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
      if (filters?.event_type) qs.set('event_type', filters.event_type);
      if (advancedConditions?.length > 0) qs.set('advanced_conditions', JSON.stringify(advancedConditions));

      const res = await authFetch(`/api/trees/${treeId}/events?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch events');
      setItems(data.data || []);
      setTotalItems(data.pagination?.total ?? data.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  if (!treeId) return <DashboardLayout><div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <TreePageHeader treeId={treeId} title="Events" subtitle={`${totalItems} events`} />

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
          emptyState={{ title: 'No events', message: 'No events found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <div className="card bg-base-200 rounded-box p-4 space-y-1">
              <div className="font-medium">{row.customType || row.eventType || 'Event'}</div>
              <div className="text-sm text-base-content/70">{row.date?.original ?? '—'}</div>
              {row.place?.original && <div className="text-sm text-base-content/70">{row.place.original}</div>}
              <div className="pt-1"><LinkedTo items={row.linkedTo} treeId={treeId} /></div>
            </div>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">{row.customType || row.eventType || '—'}</td>
              <td className="px-6 py-4">{row.date?.original ?? '—'}</td>
              <td className="px-6 py-4">{row.place?.original ?? '—'}</td>
              <td className="px-6 py-4"><LinkedTo items={row.linkedTo} treeId={treeId} /></td>
            </>
          )}
          listHeaders={[
            { label: 'Type', key: 'event_type', sortable: true },
            { label: 'Date', key: 'date', sortable: true },
            { label: 'Place', key: 'place', sortable: true },
            { label: 'Linked To', key: 'linkedTo', sortable: false },
          ]}
          searchPlaceholder="Search events..."
          searchLabel="Event type, date, or place"
          advancedSearchFields={[
            { key: 'event_type', label: 'Event type' },
            { key: 'custom_type', label: 'Custom type' },
            { key: 'place', label: 'Place' },
            { key: 'year', label: 'Year' },
          ]}
          filters={[
            { key: 'event_type', label: 'Event Type', type: 'select', options: [
              { value: 'BIRT', label: 'Birth' }, { value: 'DEAT', label: 'Death' },
              { value: 'MARR', label: 'Marriage' }, { value: 'DIV', label: 'Divorce' },
              { value: 'BURI', label: 'Burial' }, { value: 'BAPM', label: 'Baptism' },
              { value: 'CHR', label: 'Christening' }, { value: 'CENS', label: 'Census' },
              { value: 'RESI', label: 'Residence' }, { value: 'OCCU', label: 'Occupation' },
            ]},
          ]}
          sortOptions={[
            { value: 'event_type', label: 'Type' },
            { value: 'date', label: 'Date' },
            { value: 'place', label: 'Place' },
          ]}
          defaultSort="event_type"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => { retryRef.current = () => fetchData(p); fetchData(p); }}
          addNewComponent={<AddNewPlaceholder message="Add new event form coming soon." />}
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
