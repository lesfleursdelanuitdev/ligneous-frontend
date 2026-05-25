'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart2, BarChart3, Clock } from 'lucide-react';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { EventsTimeline } from '@/components/shared/events';
import { DataViewContainer, AddNewPlaceholder, ChartsPlaceholder, StatisticsPlaceholder } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

function EventsTimelineTab({ items, treeId, loading }) {
  const [orientation, setOrientation] = useState('vertical');
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm text-base-content/60">Loading events...</p>
      </div>
    );
  }
  if (!items?.length) {
    return <p className="text-sm text-base-content/50 py-8">No events to display. Use filters or search to find events.</p>;
  }
  return (
    <EventsTimeline
      events={items}
      treeId={treeId}
      orientation={orientation}
      onOrientationChange={setOrientation}
    />
  );
}

function LinkedTo({ items, treeId }) {
  if (!items || items.length === 0) return <span className="text-base-content/40">{'\u2014'}</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-1.5 gap-y-0.5">
      {items.map((link, i) => {
        if (link.type === 'individual') {
          return (
            <Link key={i} href={`/trees/${treeId}/individuals/${encodeURIComponent(link.xref)}`} className="link link-primary text-sm">
              {link.name || link.xref}
            </Link>
          );
        }
        const parts = [link.husbandName, link.wifeName].filter(Boolean);
        if (parts.length === 0) return <span key={i} className="text-sm text-base-content/60">{link.xref}</span>;
        return (
          <span key={i} className="inline-flex flex-wrap items-center gap-x-1 text-sm">
            {link.husbandXref ? <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(link.husbandXref)}`} className="link link-primary">{link.husbandName}</Link> : link.husbandName ? <span>{link.husbandName}</span> : null}
            {link.husbandName && link.wifeName && <span className="text-base-content/40">&amp;</span>}
            {link.wifeXref ? <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(link.wifeXref)}`} className="link link-primary">{link.wifeName}</Link> : link.wifeName ? <span>{link.wifeName}</span> : null}
          </span>
        );
      })}
    </span>
  );
}

export default function TreeEventsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const treeId = params?.treeId;
  const placeIdFromUrl = searchParams?.get('place_id');
  const placeNameFromUrl = searchParams?.get('place');
  const dateIdFromUrl = searchParams?.get('date_id');
  const dateLabelFromUrl = searchParams?.get('date');
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'events', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  // Fetch all events for timeline (same filters, no pagination limit)
  const timelineParams = {
    ...queryParams,
    perPage: 10000,
    page: 1,
  };
  const { data: timelineData } = useTreeEntityList(treeId, 'events', timelineParams);
  const timelineItems = timelineData?.data || [];

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Events"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Events" subtitle={`${totalItems} events`}>
        {((placeIdFromUrl) || (dateIdFromUrl)) && (
          <p className="text-sm text-base-content/70 mb-4">
            {placeIdFromUrl && (
              <>Showing events at <span className="font-medium text-base-content">{placeNameFromUrl || 'this place'}</span></>
            )}
            {placeIdFromUrl && dateIdFromUrl && ' · '}
            {dateIdFromUrl && (
              <>Showing events on <span className="font-medium text-base-content">{dateLabelFromUrl || 'this date'}</span></>
            )}
            {' · '}
            <a href={`/trees/${treeId}/events`} className="link link-primary text-sm">Show all events</a>
          </p>
        )}
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No events', message: 'No events found in this tree.' }}
          defaultView="list"
          renderCard={(row) => (
            <BaseCard>
              <div className="space-y-3">
                <div className="font-medium text-base-content">{row.customType || row.eventType || 'Event'}</div>
                <div className="text-sm text-base-content/70">{row.date?.original ?? '—'}</div>
                {row.place?.original && <div className="text-sm text-base-content/70">{row.place.original}</div>}
                <div className="pt-1 border-t border-base-content/10"><LinkedTo items={row.linkedTo} treeId={treeId} /></div>
              </div>
            </BaseCard>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4">{row.customType || row.eventType || '—'}</td>
              <td className="px-6 py-4">{row.date?.original ?? '—'}</td>
              <td className="px-6 py-4">{row.place?.original ?? '—'}</td>
              <td className="px-6 py-4"><LinkedTo items={row.linkedTo} treeId={treeId} /></td>
            </>
          )}
          listHeaders={[
            { label: 'Type', key: 'event_type', sortable: true },
            { label: 'Date', key: 'date', sortable: true },
            { label: 'Place', key: 'place', sortable: true },
            { label: 'Linked To', key: 'linkedTo', sortable: false },
          ]}
          searchPlaceholder="Search events..."
          searchLabel="Event type, date, or place"
          advancedSearchFields={[
            { key: 'event_type', label: 'Event type', type: 'select', options: [
              { value: 'BIRT', label: 'Birth' },
              { value: 'DEAT', label: 'Death' },
              { value: 'MARR', label: 'Marriage' },
              { value: 'DIV',  label: 'Divorce' },
              { value: 'BURI', label: 'Burial' },
              { value: 'BAPM', label: 'Baptism' },
              { value: 'CHR',  label: 'Christening' },
              { value: 'CENS', label: 'Census' },
              { value: 'RESI', label: 'Residence' },
              { value: 'OCCU', label: 'Occupation' },
              { value: 'EMIG', label: 'Emigration' },
              { value: 'IMMI', label: 'Immigration' },
              { value: 'NATU', label: 'Naturalization' },
              { value: 'GRAD', label: 'Graduation' },
              { value: 'RETI', label: 'Retirement' },
            ]},
            { key: 'custom_type', label: 'Custom type' },
            { key: 'place',       label: 'Place' },
            { key: 'year',        label: 'Year', type: 'number' },
          ]}
          filters={[
            { key: 'event_type', label: 'Event Type', type: 'select', options: [
              { value: 'BIRT', label: 'Birth' }, { value: 'DEAT', label: 'Death' },
              { value: 'MARR', label: 'Marriage' }, { value: 'DIV', label: 'Divorce' },
              { value: 'BURI', label: 'Burial' }, { value: 'BAPM', label: 'Baptism' },
              { value: 'CHR', label: 'Christening' }, { value: 'CENS', label: 'Census' },
              { value: 'RESI', label: 'Residence' }, { value: 'OCCU', label: 'Occupation' },
            ]},
          ]}
          sortOptions={[
            { value: 'event_type', label: 'Type' },
            { value: 'date', label: 'Date' },
            { value: 'place', label: 'Place' },
          ]}
          defaultSort="date"
          defaultSortDirection="asc"
          totalItems={totalItems}
          defaultPerPage={25}
          defaultFilterValues={{
            ...(placeIdFromUrl ? { place_id: placeIdFromUrl } : {}),
            ...(dateIdFromUrl ? { date_id: dateIdFromUrl } : {}),
          }}
          onParamsChange={setQueryParams}
          addNewComponent={<AddNewPlaceholder message="Add new event form coming soon." />}
          extraTabs={[
            { key: 'timeline', label: 'Timeline', content: <EventsTimelineTab items={timelineItems} treeId={treeId} loading={isLoading} />, icon: Clock },
            { key: 'charts', label: 'Charts', content: <ChartsPlaceholder message="Charts coming soon." />, icon: BarChart2 },
            { key: 'statistics', label: 'Statistics', content: <StatisticsPlaceholder message="Statistics coming soon." />, icon: BarChart3 },
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
