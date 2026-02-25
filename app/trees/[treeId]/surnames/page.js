'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { BarChart2, BarChart3 } from 'lucide-react';
import { DashboardMainContentLayout } from '@/components';
import SurnameCard from '@/components/shared/cards/SurnameCard';
import { DataViewContainer, ChartsPlaceholder, StatisticsPlaceholder } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

export default function TreeSurnamesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'surnames', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Surnames"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Surnames" subtitle={`${totalItems} surnames`}>
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No surnames', message: 'No surnames found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <SurnameCard
              treeId={treeId}
              surname={{
                name: row.name ?? row.surname ?? row.value,
                normalizedName: row.normalizedName,
                individualsCount: row.frequency ?? row.count ?? 0,
                familiesCount: row.familiesCount ?? 0,
              }}
            />
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">{row.name ?? row.surname ?? row.value}</td>
              <td className="px-6 py-4">{row.frequency ?? row.count ?? 0}</td>
            </>
          )}
          listHeaders={[
            { label: 'Surname', key: 'name', sortable: true },
            { label: 'Count', key: 'frequency', sortable: true },
          ]}
          searchPlaceholder="Search surnames..."
          searchLabel="Surname"
          advancedSearchFields={[
            { key: 'name',      label: 'Surname' },
            { key: 'frequency', label: 'Count', type: 'number' },
          ]}
          sortOptions={[
            { value: 'name', label: 'Name' },
            { value: 'frequency', label: 'Count' },
          ]}
          defaultSort="name"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={setQueryParams}
          extraTabs={[
            { key: 'charts', label: 'Charts', content: <ChartsPlaceholder message="Charts coming soon." />, icon: BarChart2 },
            { key: 'statistics', label: 'Statistics', content: <StatisticsPlaceholder message="Statistics coming soon." />, icon: BarChart3 },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
