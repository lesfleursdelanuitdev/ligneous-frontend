'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

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
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'notes', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Notes"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Notes" subtitle={`${totalItems} notes`}>
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No notes', message: 'No notes found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <BaseCard>
              <div className="space-y-3">
                <div className="font-mono text-sm text-base-content/70">{row.xref}</div>
                <div className="text-sm line-clamp-2 text-base-content">{row.content ?? '—'}</div>
                <div className="pt-2 border-t border-base-content/10"><LinkedTo items={row.linkedTo} treeId={treeId} /></div>
              </div>
            </BaseCard>
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
          onParamsChange={setQueryParams}
          addNewComponent={<AddNewPlaceholder message="Add new note form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
