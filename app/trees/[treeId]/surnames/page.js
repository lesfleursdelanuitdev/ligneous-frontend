'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart2, BarChart3 } from 'lucide-react';
import { DashboardMainContentLayout } from '@/components';
import SurnameCard from '@/components/shared/cards/SurnameCard';
import { DataViewContainer } from '@/components/shared/data-display';
import SurnamesCharts from '@/components/shared/data-display/SurnamesCharts';
import SurnamesStatistics from '@/components/shared/data-display/SurnamesStatistics';
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
          renderCard={(row) => {
            const name = row.name ?? row.surname ?? row.value ?? '';
            return (
              <Link href={`/trees/${treeId}/individuals?surname=${encodeURIComponent(name)}`} className="block">
                <SurnameCard
                  treeId={treeId}
                  surname={{
                    name,
                    normalizedName: row.normalizedName,
                    individualsCount: row.frequency ?? row.count ?? 0,
                    familiesCount: row.familiesCount ?? 0,
                  }}
                />
              </Link>
            );
          }}
          renderRow={(row) => {
            const name = row.name ?? row.surname ?? row.value ?? '';
            return (
              <>
                <td className="px-6 py-4">
                  <Link href={`/trees/${treeId}/individuals?surname=${encodeURIComponent(name)}`} className="link link-primary">
                    {name}
                  </Link>
                </td>
                <td className="px-6 py-4">{row.frequency ?? row.count ?? 0}</td>
              </>
            );
          }}
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
            { key: 'charts', label: 'Charts', content: <SurnamesCharts treeId={treeId} />, icon: BarChart2 },
            { key: 'statistics', label: 'Statistics', content: <SurnamesStatistics treeId={treeId} />, icon: BarChart3 },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
