'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart2, BarChart3 } from 'lucide-react';
import { DashboardMainContentLayout } from '@/components';
import GivenNameCard from '@/components/shared/cards/GivenNameCard';
import { DataViewContainer, GivenNamesCharts, GivenNamesStatistics } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

export default function TreeGivenNamesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'given-names', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Given Names"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Given Names" subtitle={`${totalItems} names`}>
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No given names', message: 'No given names found in this tree.' }}
          defaultView="list"
          renderCard={(row) => {
            const name = row.givenName ?? row.name ?? row.value ?? '';
            return (
              <Link href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(name)}`} className="block">
                <GivenNameCard
                  treeId={treeId}
                  givenName={{
                    name,
                    normalizedName: row.normalizedName,
                    individualsCount: row.frequency ?? row.count ?? 0,
                    malesCount: row.malesCount ?? 0,
                    femalesCount: row.femalesCount ?? 0,
                    unknownCount: row.unknownCount ?? 0,
                  }}
                />
              </Link>
            );
          }}
          renderRow={(row) => {
            const name = row.givenName ?? row.name ?? row.value ?? '';
            return (
              <>
                <td className="px-6 py-4">
                  <Link href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(name)}`} className="link link-primary">
                    {name}
                  </Link>
                </td>
                <td className="px-6 py-4">{row.frequency ?? row.count ?? 0}</td>
              </>
            );
          }}
          listHeaders={[
            { label: 'Given Name', key: 'name', sortable: true },
            { label: 'Count', key: 'frequency', sortable: true },
          ]}
          searchPlaceholder="Search given names..."
          searchLabel="Given name"
          advancedSearchFields={[
            { key: 'name',      label: 'Given name' },
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
            { key: 'charts', label: 'Charts', content: <GivenNamesCharts treeId={treeId} />, icon: BarChart2 },
            { key: 'statistics', label: 'Statistics', content: <GivenNamesStatistics treeId={treeId} />, icon: BarChart3 },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
