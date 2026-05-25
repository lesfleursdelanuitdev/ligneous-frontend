'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GitMerge, BarChart2, BarChart3 } from 'lucide-react';
import { DashboardMainContentLayout } from '@/components';
import FamilyCard from '@/components/shared/cards/FamilyCard';
import { DataViewContainer, AddNewPlaceholder, ChartsPlaceholder, StatisticsPlaceholder } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

function stripSlashes(name) {
  if (!name) return null;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

export default function TreeFamiliesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'families', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  const husbandName = (f) => stripSlashes(f.husband?.fullName) ?? '\u2014';
  const wifeName = (f) => stripSlashes(f.wife?.fullName) ?? '\u2014';

  if (!treeId) {
    return <DashboardMainContentLayout treeId={treeId} title="Families"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;
  }

  return (
    <DashboardMainContentLayout treeId={treeId} title="Families" subtitle={`${totalItems} families`}>
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No families', message: 'No families found in this tree.' }}
          defaultView="list"
          renderCard={(f) => (
            <FamilyCard
              treeId={treeId}
              family={{
                id: f.id,
                xref: f.xref,
                husband: f.husband,
                wife: f.wife,
                children: f.children,
                childrenCount: f.childrenCount,
                marriageDate: f.marriageDateDisplay,
                marriagePlace: f.marriagePlaceDisplay,
                divorceDate: f.divorceDateDisplay,
                divorcePlace: f.divorcePlaceDisplay,
              }}
            />
          )}
          renderRow={(f) => (
            <>
              <td className="px-6 py-4 font-mono text-sm">
                <Link href={`/trees/${treeId}/families/${f.id}`} className="link link-primary">
                  {f.xref}
                </Link>
              </td>
              <td className="px-6 py-4">
                {f.husband ? (
                  <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(f.husband.xref)}`} className="link link-primary">
                    {husbandName(f)}
                  </Link>
                ) : (
                  husbandName(f)
                )}
              </td>
              <td className="px-6 py-4">
                {f.wife ? (
                  <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(f.wife.xref)}`} className="link link-primary">
                    {wifeName(f)}
                  </Link>
                ) : (
                  wifeName(f)
                )}
              </td>
              <td className="px-6 py-4">{f.childrenCount ?? 0}</td>
            </>
          )}
          listHeaders={[
            { label: 'ID', key: 'xref', sortable: true },
            { label: 'Husband', key: 'husband', sortable: true },
            { label: 'Wife', key: 'wife', sortable: true },
            { label: 'Children', key: 'children_count', sortable: true },
          ]}
          searchPlaceholder="Search families..."
          searchLabel="Husband / Wife name"
          advancedSearchFields={[
            { key: 'xref',           label: 'Family ID' },
            { key: 'husband',        label: 'Husband' },
            { key: 'wife',           label: 'Wife' },
            { key: 'children_count', label: 'Children count', type: 'number' },
          ]}
          sortOptions={[
            { value: 'xref', label: 'ID' },
            { value: 'husband', label: 'Husband' },
            { value: 'wife', label: 'Wife' },
            { value: 'children_count', label: 'Children' },
          ]}
          defaultSort="husband"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={setQueryParams}
          addNewComponent={<AddNewPlaceholder message="Add new family form coming soon." />}
          extraTabs={[
            { key: 'charts', label: 'Charts', content: <ChartsPlaceholder message="Charts coming soon." />, icon: BarChart2 },
            { key: 'statistics', label: 'Statistics', content: <StatisticsPlaceholder message="Statistics coming soon." />, icon: BarChart3 },
            { key: 'merge', label: 'Merge', content: <AddNewPlaceholder message="Merge families form coming soon." />, icon: GitMerge },
          ]}
          actions={[
            { key: 'view', label: 'View', href: (f) => `/trees/${treeId}/families/${f.id}` },
            { key: 'edit', label: 'Edit', href: (f) => `/trees/${treeId}/families/${f.id}/edit` },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
