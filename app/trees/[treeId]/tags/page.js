'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';

const DUMMY_TAGS = [
  { id: '1', name: 'Family', color: '#3b82f6', itemCount: 45, isGlobal: true, description: 'Family-related items' },
  { id: '2', name: 'Wedding', color: '#ec4899', itemCount: 12, isGlobal: false, description: 'Wedding photos and events' },
  { id: '3', name: 'Vintage', color: '#8b5cf6', itemCount: 28, isGlobal: false, description: 'Historical and vintage media' },
  { id: '4', name: 'Military', color: '#64748b', itemCount: 8, isGlobal: false, description: 'Military service records' },
  { id: '5', name: 'Vital records', color: '#059669', itemCount: 15, isGlobal: false, description: 'Birth, marriage, death records' },
  { id: '6', name: 'Oral history', color: '#d97706', itemCount: 5, isGlobal: false, description: 'Interviews and recordings' },
];

export default function TreeTagsPage() {
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
      setItems(DUMMY_TAGS.slice(start, start + perPage));
      setTotalItems(DUMMY_TAGS.length);
      setLoading(false);
    }, 200);
  }, []);

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Tags"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Tags" subtitle={`${totalItems} tags (dummy data)`}>
        <DataViewContainer
          items={items}
          loading={loading}
          emptyState={{ title: 'No tags', message: 'No tags in this tree yet.' }}
          defaultView="card"
          renderCard={(row) => (
            <BaseCard>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="badge badge-ghost badge-sm border"
                    style={row.color ? { borderColor: row.color, color: row.color } : {}}
                  >
                    {row.name}
                  </span>
                  {row.isGlobal && <span className="text-xs text-base-content/40">Global</span>}
                </div>
                <div className="text-sm text-base-content/70">{row.description ?? '—'}</div>
                <div className="text-sm text-base-content/50">
                  {(row.itemCount ?? 0).toLocaleString()} items tagged
                </div>
              </div>
            </BaseCard>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">
                <span
                  className="badge badge-ghost badge-sm border"
                  style={row.color ? { borderColor: row.color, color: row.color } : {}}
                >
                  {row.name}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-base-content/70 max-w-[200px] truncate">{row.description ?? '—'}</td>
              <td className="px-6 py-4 text-sm">{(row.itemCount ?? 0).toLocaleString()}</td>
              <td className="px-6 py-4">
                {row.isGlobal ? <span className="badge badge-ghost badge-xs">Global</span> : <span className="text-base-content/40">—</span>}
              </td>
            </>
          )}
          listHeaders={[
            { label: 'Name', key: 'name', sortable: true },
            { label: 'Description', key: 'description', sortable: false },
            { label: 'Items tagged', key: 'itemCount', sortable: true },
            { label: 'Scope', key: 'isGlobal', sortable: true },
          ]}
          searchPlaceholder="Search tags..."
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => loadData(p)}
          addNewComponent={<AddNewPlaceholder message="Add new tag form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
