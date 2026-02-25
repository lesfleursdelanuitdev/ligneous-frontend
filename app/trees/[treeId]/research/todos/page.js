'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';

const DUMMY_TODOS = [
  { id: '1', title: 'Find birth record for John Smith (b. ~1790)', status: 'pending' },
  { id: '2', title: 'Verify marriage date for James & Mary – St. Mary\'s', status: 'done' },
  { id: '3', title: 'Add source for William Smith immigration (1909)', status: 'pending' },
  { id: '4', title: 'Confirm Mary Jones maiden name – check marriage cert', status: 'pending' },
];

export default function ResearchTodosPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const retryRef = useRef(null);
  const loadDataRef = useRef(null);

  const loadData = useCallback(({ page, perPage }) => {
    setLoading(true);
    retryRef.current = () => loadDataRef.current?.({ page, perPage });
    setTimeout(() => {
      const start = (page - 1) * perPage;
      setItems(DUMMY_TODOS.slice(start, start + perPage));
      setTotalItems(DUMMY_TODOS.length);
      setLoading(false);
    }, 200);
  }, []);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Todo lists"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Todo lists" subtitle={`${totalItems} item(s) (dummy data)`}>
        <DataViewContainer
          items={items}
          loading={loading}
          totalItems={totalItems}
          emptyState={{ title: 'No todo items', message: 'No research tasks for this tree yet.' }}
          defaultView="list"
          renderCard={(row) => (
            <BaseCard>
              <div className="flex items-center gap-3">
                <span className={`flex-1 ${row.status === 'done' ? 'line-through text-base-content/50' : ''}`}>{row.title}</span>
                <span className="badge badge-sm badge-ghost">{row.status}</span>
              </div>
            </BaseCard>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4 font-medium">{row.title}</td>
              <td className="px-6 py-4 text-sm">{row.status}</td>
            </>
          )}
          listHeaders={[
            { label: 'Task', key: 'title', sortable: true },
            { label: 'Status', key: 'status', sortable: true },
          ]}
          searchPlaceholder="Search todo items..."
          defaultPerPage={10}
          onParamsChange={(p) => loadData(p)}
          addNewComponent={<AddNewPlaceholder message="Add new todo item form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
