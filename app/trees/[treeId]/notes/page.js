'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout, TreePageHeader } from '@/components';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

const EVENT_LABELS = {
  BIRT: 'Birth', DEAT: 'Death', MARR: 'Marriage', DIV: 'Divorce',
  BURI: 'Burial', BAPM: 'Baptism', CHR: 'Christening', CENS: 'Census',
  EMIG: 'Emigration', IMMI: 'Immigration', NATU: 'Naturalization',
  RESI: 'Residence', RETI: 'Retirement', PROB: 'Probate', WILL: 'Will',
  GRAD: 'Graduation', EVEN: 'Event', OCCU: 'Occupation',
};

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
        if (link.type === 'family') {
          const parts = [link.husbandName, link.wifeName].filter(Boolean);
          if (parts.length === 0) return <span key={i} className="text-sm text-base-content/60">{link.xref}</span>;
          return (
            <span key={i} className="inline-flex flex-wrap items-center gap-x-1 text-sm">
              {link.husbandXref ? <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(link.husbandXref)}`} className="link link-primary">{link.husbandName}</Link> : link.husbandName ? <span>{link.husbandName}</span> : null}
              {link.husbandName && link.wifeName && <span className="text-base-content/40">&amp;</span>}
              {link.wifeXref ? <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(link.wifeXref)}`} className="link link-primary">{link.wifeName}</Link> : link.wifeName ? <span>{link.wifeName}</span> : null}
            </span>
          );
        }
        if (link.type === 'event') {
          const label = link.customType || EVENT_LABELS[link.eventType] || link.eventType || 'Event';
          return <span key={i} className="badge badge-sm badge-ghost text-xs">{label}</span>;
        }
        if (link.type === 'source') {
          return <span key={i} className="text-sm text-base-content/60 italic">{link.title || link.xref}</span>;
        }
        return null;
      })}
    </span>
  );
}

export default function TreeNotesPage() {
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

      const res = await authFetch(`/api/trees/${treeId}/notes?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch notes');
      setItems(data.data || []);
      setTotalItems(data.pagination?.total ?? data.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  if (!treeId) return <DashboardLayout><div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <TreePageHeader treeId={treeId} title="Notes" subtitle={`${totalItems} notes`} />

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
          emptyState={{ title: 'No notes', message: 'No notes found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <div className="card bg-base-200 rounded-box p-4 space-y-1">
              <div className="font-mono text-sm text-base-content/70 mb-1">{row.xref}</div>
              <div className="text-sm line-clamp-2">{row.content ?? '—'}</div>
              <div className="pt-1"><LinkedTo items={row.linkedTo} treeId={treeId} /></div>
            </div>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4 font-mono text-sm">{row.xref ?? '—'}</td>
              <td className="px-6 py-4 text-sm max-w-md truncate">{row.content ?? '—'}</td>
              <td className="px-6 py-4"><LinkedTo items={row.linkedTo} treeId={treeId} /></td>
            </>
          )}
          listHeaders={[
            { label: 'XREF', key: 'xref', sortable: false },
            { label: 'Preview', key: 'text', sortable: false },
            { label: 'Linked To', key: 'linkedTo', sortable: false },
          ]}
          searchPlaceholder="Search notes..."
          searchLabel="Note content"
          advancedSearchFields={[
            { key: 'xref', label: 'XREF' },
            { key: 'content', label: 'Content' },
          ]}
          sortOptions={[
            { value: 'xref', label: 'XREF' },
          ]}
          defaultSort="xref"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => { retryRef.current = () => fetchData(p); fetchData(p); }}
          addNewComponent={<AddNewPlaceholder message="Add new note form coming soon." />}
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
