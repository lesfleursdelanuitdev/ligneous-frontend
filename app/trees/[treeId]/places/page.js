'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { GitMerge, BarChart2, BarChart3 } from 'lucide-react';
import { DashboardMainContentLayout } from '@/components';
import PlaceCard from '@/components/shared/cards/PlaceCard';
import { DataViewContainer, AddNewPlaceholder, ChartsPlaceholder, StatisticsPlaceholder } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

export default function TreePlacesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'places', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Places"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Places" subtitle={`${totalItems} places`}>
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No places', message: 'No places found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <PlaceCard
              treeId={treeId}
              place={{
                id: row.id,
                name: row.name ?? row.place ?? row.value,
                normalizedName: row.normalizedName,
                latitude: row.latitude,
                longitude: row.longitude,
                eventsCount: row.eventsCount ?? 0,
                individualsCount: row.individualsCount ?? 0,
                familiesCount: row.familiesCount ?? 0,
              }}
            />
          )}
          renderRow={(row) => (
            <td className="px-6 py-4">{row.name ?? row.place ?? row.value ?? row.id}</td>
          )}
          listHeaders={[{ label: 'Place', key: 'name', sortable: true }]}
          searchPlaceholder="Search places..."
          searchLabel="Place name"
          advancedSearchFields={[
            { key: 'original', label: 'Full place' },
            { key: 'name', label: 'Name' },
            { key: 'country', label: 'Country' },
            { key: 'county', label: 'County' },
            { key: 'state', label: 'State' },
          ]}
          sortOptions={[{ value: 'name', label: 'Name' }]}
          defaultSort="name"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={setQueryParams}
          addNewComponent={<AddNewPlaceholder message="Add new place form coming soon." />}
          extraTabs={[
            { key: 'charts', label: 'Charts', content: <ChartsPlaceholder message="Charts coming soon." />, icon: BarChart2 },
            { key: 'statistics', label: 'Statistics', content: <StatisticsPlaceholder message="Statistics coming soon." />, icon: BarChart3 },
            { key: 'merge', label: 'Merge', content: <AddNewPlaceholder message="Merge places form coming soon." />, icon: GitMerge },
          ]}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
