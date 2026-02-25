'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';

const DUMMY_RESEARCH_NOTES = [
  { id: '1', title: 'Smith line – Yorkshire', content: 'Need to verify birth parish for John Smith (b. ~1790). Check BMD and parish registers for Hull area.', notebook: { name: 'Smith family' }, updatedAt: '2024-02-10' },
  { id: '2', title: 'Immigration timeline', content: 'William Smith arrived New York 1909. Ship manifest lists last residence as Liverpool. Cross-ref with UK outbound passenger lists.', notebook: { name: 'Immigration' }, updatedAt: '2024-02-08' },
  { id: '3', title: 'Mary Jones – maiden name?', content: 'Marriage record says Mary Jones. Need to find parents to confirm; possible connection to Jones family in Cardiff.', notebook: null, updatedAt: '2024-02-05' },
];

export default function ResearchNotesPage() {
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
      setItems(DUMMY_RESEARCH_NOTES.slice(start, start + perPage));
      setTotalItems(DUMMY_RESEARCH_NOTES.length);
      setLoading(false);
    }, 200);
  }, []);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Research notes"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Research notes" subtitle={`${totalItems} note(s) (dummy data)`}>
        <DataViewContainer
          items={items}
          loading={loading}
          emptyState={{ title: 'No research notes', message: 'No research notes for this tree yet.' }}
          defaultView="card"
          renderCard={(row) => (
            <BaseCard>
              <div className="space-y-2">
                <div className="font-medium text-base-content">{row.title || 'Untitled'}</div>
                {row.notebook?.name && <p className="text-sm text-base-content/50">Notebook: {row.notebook.name}</p>}
                <p className="text-sm text-base-content/80 whitespace-pre-wrap line-clamp-3">{row.content}</p>
                <p className="text-xs text-base-content/40">Updated {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</p>
              </div>
            </BaseCard>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4 font-medium">{row.title || 'Untitled'}</td>
              <td className="px-6 py-4 text-sm text-base-content/70 max-w-[200px] truncate">{row.content ?? '—'}</td>
              <td className="px-6 py-4 text-sm">{row.notebook?.name ?? '—'}</td>
              <td className="px-6 py-4 text-sm">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</td>
            </>
          )}
          listHeaders={[
            { label: 'Title', key: 'title', sortable: true },
            { label: 'Content', key: 'content', sortable: false },
            { label: 'Notebook', key: 'notebook', sortable: false },
            { label: 'Updated', key: 'updatedAt', sortable: true },
          ]}
          searchPlaceholder="Search research notes..."
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => loadData(p)}
          addNewComponent={<AddNewPlaceholder message="Add new research note form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
