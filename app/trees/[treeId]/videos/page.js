'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder, TagsCell, AlbumsCell } from '@/components/shared/data-display';

const DUMMY_VIDEOS = [
  { id: '1', title: 'Wedding footage 1982', description: 'Full ceremony and reception', duration: '45 min', date: '1982', linkedTo: [{ type: 'family', husbandName: 'James Smith', wifeName: 'Mary Jones', xref: 'F1' }], tags: ['Wedding', 'Ceremony'], albums: ['Weddings', 'Smith Family Album'] },
  { id: '2', title: '90th birthday celebration', description: 'Family gathering', duration: '12 min', date: '2010', linkedTo: [{ type: 'individual', name: 'Robert Smith', xref: 'I2' }], tags: ['Birthday', 'Family'], albums: ['Smith Family Album'] },
  { id: '3', title: 'Interview with Grandma', description: 'Oral history recording', duration: '1h 20m', date: '2005', linkedTo: [{ type: 'individual', name: 'Margaret Smith', xref: 'I5' }], tags: ['Oral history', 'Interview'], albums: ['Oral Histories'] },
];

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

export default function TreeVideosPage() {
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
      setItems(DUMMY_VIDEOS.slice(start, start + perPage));
      setTotalItems(DUMMY_VIDEOS.length);
      setLoading(false);
    }, 200);
  }, []);

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Videos"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Videos" subtitle={`${totalItems} videos (dummy data)`}>
        <DataViewContainer
          items={items}
          loading={loading}
          emptyState={{ title: 'No videos', message: 'No videos in this tree yet.' }}
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
          searchPlaceholder="Search videos..."
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => loadData(p)}
          addNewComponent={<AddNewPlaceholder message="Add new video form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
