'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardMainContentLayout } from '@/components';
import SourceCard from '@/components/shared/cards/SourceCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

export default function TreeSourcesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'sources', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Sources"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Sources" subtitle={`${totalItems} sources`}>
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No sources', message: 'No sources found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <SourceCard
              treeId={treeId}
              source={{
                id: row.id,
                xref: row.xref,
                title: row.title ?? row.name,
                author: row.author,
                publication: row.publication,
                repository: row.repository,
                citationsCount: row.citationsCount ?? 0,
                media: row.media ?? [],
              }}
            />
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">{row.title ?? row.name ?? '\u2014'}</td>
              <td className="px-6 py-4 font-mono text-sm">{row.xref ?? '\u2014'}</td>
            </>
          )}
          listHeaders={[
            { label: 'Source', key: 'title', sortable: true },
            { label: 'XREF', key: 'xref', sortable: false },
          ]}
          searchPlaceholder="Search sources..."
          searchLabel="Source title"
          advancedSearchFields={[
            { key: 'xref', label: 'XREF' },
            { key: 'title', label: 'Title' },
            { key: 'author', label: 'Author' },
          ]}
          sortOptions={[{ value: 'title', label: 'Title' }]}
          defaultSort="title"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={setQueryParams}
          addNewComponent={<AddNewPlaceholder message="Add new source form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
