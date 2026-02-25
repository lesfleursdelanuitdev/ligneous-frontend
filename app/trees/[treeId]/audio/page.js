'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder, TagsCell, AlbumsCell } from '@/components/shared/data-display';

const DUMMY_AUDIO = [
  { id: '1', title: 'Voice memo – Grandpa stories', description: 'Recorded at family reunion', duration: '18 min', date: '1998', linkedTo: [{ type: 'individual', name: 'William Smith', xref: 'I4' }], tags: ['Oral history', 'Family'], albums: ['Oral Histories'] },
  { id: '2', title: 'Church service recording', description: 'Easter Sunday', duration: '52 min', date: '2002', linkedTo: [], tags: ['Church'], albums: [] },
  { id: '3', title: 'Interview – Aunt Mary', description: 'Life in the 1940s', duration: '1h 05m', date: '2015', linkedTo: [{ type: 'individual', name: 'Mary Jones', xref: 'I6' }], tags: ['Interview', 'Oral history'], albums: ['Oral Histories'] },
  { id: '4', title: 'Wedding toasts', description: 'Reception speeches', duration: '22 min', date: '1982', linkedTo: [{ type: 'family', husbandName: 'James Smith', wifeName: 'Mary Jones', xref: 'F1' }], tags: ['Wedding'], albums: ['Weddings'] },
];

function LinkedTo({ items, treeId }) {
  if (!items || items.length === 0) return <span className="text-base-content/40">—</span>;
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
          return (
            <span key={i} className="text-sm">
              {link.husbandName} &amp; {link.wifeName}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}

export default function TreeAudioPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const retryRef = useRef(null);

  const loadData = useCallback(({ page, perPage }) => {
    setLoading(true);
    retryRef.current = () => loadData({ page, perPage });
    setTimeout(() => {
      const start = (page - 1) * perPage;
      setItems(DUMMY_AUDIO.slice(start, start + perPage));
      setTotalItems(DUMMY_AUDIO.length);
      setLoading(false);
    }, 200);
  }, []);

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Audio"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Audio" subtitle={`${totalItems} audio files (dummy data)`}>
        <DataViewContainer
          items={items}
          loading={loading}
          emptyState={{ title: 'No audio', message: 'No audio in this tree yet.' }}
          defaultView="card"
          renderCard={(row) => (
            <BaseCard>
              <div className="space-y-3">
                <div className="font-medium text-base-content">{row.title}</div>
                <div className="text-sm text-base-content/70">{row.description ?? '—'}</div>
                <div className="flex gap-3 text-sm text-base-content/50">
                  <span>{row.duration ?? '—'}</span>
                  <span>{row.date ?? '—'}</span>
                </div>
                <div className="pt-2 border-t border-base-content/10 space-y-1.5">
                  <div><span className="text-xs text-base-content/50">Linked to:</span> <LinkedTo items={row.linkedTo} treeId={treeId} /></div>
                  <div><span className="text-xs text-base-content/50">Tags:</span> <TagsCell tags={row.tags} /></div>
                  <div><span className="text-xs text-base-content/50">Albums:</span> <AlbumsCell albums={row.albums} /></div>
                </div>
              </div>
            </BaseCard>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4 font-medium">{row.title}</td>
              <td className="px-6 py-4 text-sm text-base-content/70">{row.description ?? '—'}</td>
              <td className="px-6 py-4 text-sm">{row.duration ?? '—'}</td>
              <td className="px-6 py-4 text-sm">{row.date ?? '—'}</td>
              <td className="px-6 py-4"><LinkedTo items={row.linkedTo} treeId={treeId} /></td>
              <td className="px-6 py-4"><TagsCell tags={row.tags} /></td>
              <td className="px-6 py-4"><AlbumsCell albums={row.albums} /></td>
            </>
          )}
          listHeaders={[
            { label: 'Title', key: 'title', sortable: true },
            { label: 'Description', key: 'description', sortable: false },
            { label: 'Duration', key: 'duration', sortable: false },
            { label: 'Date', key: 'date', sortable: true },
            { label: 'Linked to', key: 'linkedTo', sortable: false },
            { label: 'Tags', key: 'tags', sortable: false },
            { label: 'Albums', key: 'albums', sortable: false },
          ]}
          searchPlaceholder="Search audio..."
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => loadData(p)}
          addNewComponent={<AddNewPlaceholder message="Add new audio form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
