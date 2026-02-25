'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';

const DUMMY_LINKS = [
  { id: '1', label: 'Ancestry – Smith tree', url: 'https://www.ancestry.com/family-tree/tree/12345678' },
  { id: '2', label: 'FamilySearch – John Smith', url: 'https://www.familysearch.org/tree/person/details/ABC123' },
  { id: '3', label: 'Find A Grave – St. Mary\'s Cemetery', url: 'https://www.findagrave.com/cemetery/12345' },
  { id: '4', label: 'GRO – England & Wales BMD', url: 'https://www.gro.gov.uk/' },
];

export default function ResearchLinksPage() {
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
      setItems(DUMMY_LINKS.slice(start, start + perPage));
      setTotalItems(DUMMY_LINKS.length);
      setLoading(false);
    }, 200);
  }, []);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Research links"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Research links" subtitle={`${totalItems} link(s) (dummy data)`}>
        <DataViewContainer
          items={items}
          loading={loading}
          totalItems={totalItems}
          emptyState={{ title: 'No research links', message: 'No saved links for this tree yet.' }}
          defaultView="list"
          renderCard={(row) => (
            <BaseCard>
              <a href={row.url} target="_blank" rel="noreferrer" className="link link-primary font-medium">
                {row.label}
              </a>
              <p className="text-xs text-base-content/50 mt-1 truncate">{row.url}</p>
            </BaseCard>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4 font-medium">
                <a href={row.url} target="_blank" rel="noreferrer" className="link link-primary">{row.label}</a>
              </td>
              <td className="px-6 py-4 text-sm text-base-content/70 max-w-[300px] truncate">{row.url}</td>
            </>
          )}
          listHeaders={[
            { label: 'Label', key: 'label', sortable: true },
            { label: 'URL', key: 'url', sortable: false },
          ]}
          searchPlaceholder="Search research links..."
          defaultPerPage={10}
          onParamsChange={(p) => loadData(p)}
          addNewComponent={<AddNewPlaceholder message="Add new research link form coming soon." />}
          actions={[
            { key: 'view', label: 'Open', href: (item) => item?.url ?? '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
