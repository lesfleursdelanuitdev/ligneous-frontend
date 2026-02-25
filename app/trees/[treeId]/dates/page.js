'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GitMerge, BarChart2, BarChart3 } from 'lucide-react';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder, ChartsPlaceholder, StatisticsPlaceholder } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

const MONTH_ABBR = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const TYPE_LABELS = {
  birth: 'Birth', death: 'Death', marriage: 'Marriage',
  divorce: 'Divorce', event: 'Other',
};
const TYPE_BADGE_COLORS = {
  birth: 'badge-success', death: 'badge-error',
  marriage: 'badge-info', divorce: 'badge-warning', event: 'badge-neutral',
};

function contextBadges(context) {
  if (!context || !Array.isArray(context) || context.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {context.map((c) => (
        <span key={c.type} className={`badge badge-sm ${TYPE_BADGE_COLORS[c.type] || 'badge-neutral'}`}>
          {TYPE_LABELS[c.type] || c.type}({c.count})
        </span>
      ))}
    </span>
  );
}

export default function TreeDatesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'dates', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Dates"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Dates" subtitle={`${totalItems} date entries`}>
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No dates', message: 'No dates found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <Link href={`/trees/${treeId}/dates/${row.id}`} className="block h-full">
              <BaseCard hoverable className="h-full transition-colors hover:bg-base-200/50">
                <div className="space-y-3">
                  <div className="font-medium text-base-content">{row.original || '\u2014'}</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-base-content/70">
                    {row.year && <span>{row.year}</span>}
                    {row.month && <span className="text-base-content/50">{MONTH_ABBR[row.month]}</span>}
                    {row.day && <span className="text-base-content/50">Day {row.day}</span>}
                  </div>
                  {row.context && <div className="pt-2 border-t border-base-content/10">{contextBadges(row.context)}</div>}
                </div>
              </BaseCard>
            </Link>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">
                <Link href={`/trees/${treeId}/dates/${row.id}`} className="link link-primary font-medium">{row.original || '\u2014'}</Link>
              </td>
              <td className="px-6 py-4 text-sm text-base-content/70">{row.year ?? '\u2014'}</td>
              <td className="px-6 py-4 text-sm text-base-content/70">{row.month ? MONTH_ABBR[row.month] : '\u2014'}</td>
              <td className="px-6 py-4 text-sm text-base-content/70">{row.day ?? '\u2014'}</td>
              <td className="px-6 py-4">{contextBadges(row.context) || <span className="text-base-content/40">{'\u2014'}</span>}</td>
            </>
          )}
          listHeaders={[
            { label: 'Date', key: 'original', sortable: false },
            { label: 'Year', key: 'year', sortable: true },
            { label: 'Month', key: 'month', sortable: true },
            { label: 'Day', key: 'day', sortable: true },
            { label: 'Context', key: 'context', sortable: false },
          ]}
          searchPlaceholder="Search dates..."
          searchLabel="Date text"
          filters={[
            { key: 'context', label: 'Context', type: 'select', options: [
              { value: 'birth', label: 'Birth' },
              { value: 'death', label: 'Death' },
              { value: 'marriage', label: 'Marriage' },
              { value: 'divorce', label: 'Divorce' },
              { value: 'event', label: 'Other events' },
            ]},
          ]}
          advancedSearchFields={[
            { key: 'original',  label: 'Date text' },
            { key: 'year',      label: 'Year',  type: 'number' },
            { key: 'month',     label: 'Month', type: 'select', options: [
              { value: '1',  label: 'January' },
              { value: '2',  label: 'February' },
              { value: '3',  label: 'March' },
              { value: '4',  label: 'April' },
              { value: '5',  label: 'May' },
              { value: '6',  label: 'June' },
              { value: '7',  label: 'July' },
              { value: '8',  label: 'August' },
              { value: '9',  label: 'September' },
              { value: '10', label: 'October' },
              { value: '11', label: 'November' },
              { value: '12', label: 'December' },
            ]},
            { key: 'day',       label: 'Day',  type: 'number' },
            { key: 'date_type', label: 'Date type', type: 'select', options: [
              { value: 'birth',    label: 'Birth' },
              { value: 'death',    label: 'Death' },
              { value: 'marriage', label: 'Marriage' },
              { value: 'divorce',  label: 'Divorce' },
              { value: 'event',    label: 'Other event' },
            ]},
          ]}
          sortOptions={[
            { value: 'year', label: 'Year' },
            { value: 'month', label: 'Month' },
            { value: 'day', label: 'Day' },
          ]}
          defaultSort="year"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={setQueryParams}
          addNewComponent={<AddNewPlaceholder message="Add new date form coming soon." />}
          extraTabs={[
            { key: 'charts', label: 'Charts', content: <ChartsPlaceholder message="Charts coming soon." />, icon: BarChart2 },
            { key: 'statistics', label: 'Statistics', content: <StatisticsPlaceholder message="Statistics coming soon." />, icon: BarChart3 },
            { key: 'merge', label: 'Merge', content: <AddNewPlaceholder message="Merge dates form coming soon." />, icon: GitMerge },
          ]}
          actions={[
            { key: 'view', label: 'View', href: (item) => `/trees/${treeId}/dates/${item.id}` },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
