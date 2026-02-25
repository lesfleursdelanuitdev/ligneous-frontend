'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';

const DUMMY_ALBUMS = [
  { id: '1', name: 'Smith Family Album', description: 'Photos and documents from the Smith family', itemCount: 24, isPublic: false, createdAt: '2024-01-10' },
  { id: '2', name: 'Weddings', description: 'Wedding photos and videos', itemCount: 12, isPublic: true, createdAt: '2024-02-01' },
  { id: '3', name: 'Documents', description: 'Vital records and certificates', itemCount: 8, isPublic: false, createdAt: '2024-02-15' },
  { id: '4', name: 'Oral Histories', description: 'Audio and video interviews', itemCount: 5, isPublic: false, createdAt: '2024-03-01' },
  { id: '5', name: 'Military Service', description: 'Photos and records from WWII', itemCount: 6, isPublic: true, createdAt: '2024-03-20' },
];

export default function TreeAlbumsPage() {
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
      setItems(DUMMY_ALBUMS.slice(start, start + perPage));
      setTotalItems(DUMMY_ALBUMS.length);
      setLoading(false);
    }, 200);
  }, []);

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Albums"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Albums" subtitle={`${totalItems} albums (dummy data)`}>
        <DataViewContainer
          items={items}
          loading={loading}
          emptyState={{ title: 'No albums', message: 'No albums in this tree yet.' }}
          defaultView="card"
          renderCard={(row) => (
            <BaseCard>
              <div className="space-y-3">
                <div className="font-medium text-base-content">{row.name}</div>
                <div className="text-sm text-base-content/70">{row.description ?? '—'}</div>
                <div className="flex flex-wrap gap-2 items-center text-sm text-base-content/50">
                  <span>{row.itemCount ?? 0} items</span>
                  <span className="badge badge-ghost badge-sm">{row.isPublic ? 'Public' : 'Private'}</span>
                </div>
                {row.createdAt && (
                  <div className="text-xs text-base-content/40 pt-1 border-t border-base-content/10">
                    Created {row.createdAt}
                  </div>
                )}
              </div>
            </BaseCard>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4 font-medium">{row.name}</td>
              <td className="px-6 py-4 text-sm text-base-content/70 max-w-[200px] truncate">{row.description ?? '—'}</td>
              <td className="px-6 py-4 text-sm">{(row.itemCount ?? 0).toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className="badge badge-ghost badge-sm">{row.isPublic ? 'Public' : 'Private'}</span>
              </td>
              <td className="px-6 py-4 text-sm text-base-content/50">{row.createdAt ?? '—'}</td>
            </>
          )}
          listHeaders={[
            { label: 'Name', key: 'name', sortable: true },
            { label: 'Description', key: 'description', sortable: false },
            { label: 'Items', key: 'itemCount', sortable: true },
            { label: 'Visibility', key: 'isPublic', sortable: true },
            { label: 'Created', key: 'createdAt', sortable: true },
          ]}
          searchPlaceholder="Search albums..."
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => loadData(p)}
          addNewComponent={<AddNewPlaceholder message="Add new album form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
