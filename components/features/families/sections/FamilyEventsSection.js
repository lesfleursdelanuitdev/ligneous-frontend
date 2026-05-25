'use client';

import { useState } from 'react';
import { Calendar, MapPin, List, Clock, Map } from 'lucide-react';
import FamilySection from '../view/FamilySection';
import IndividualSectionTabs from '../../individuals/view/IndividualSectionTabs';
import IndividualSectionTabsContent from '../../individuals/view/IndividualSectionTabsContent';
import { EventsTimeline } from '@/components/shared/events';
import { formatEventType } from '@/lib/individual-utils';

function FamilyEventCard({ evt, idx }) {
  const typeLabel = evt.customType
    ? `${formatEventType(evt.eventType)} (${evt.customType})`
    : formatEventType(evt.eventType);
  const dateStr = evt.date?.original;
  const placeStr = evt.place?.original || evt.place?.name;

  return (
    <div
      key={evt.id || idx}
      className="card bg-base-200/50 border border-base-content/10 rounded-box"
    >
      <div className="card-body p-4 space-y-1">
        <p className="font-semibold text-sm text-base-content">{typeLabel}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {dateStr && (
            <span className="flex items-center gap-1.5 text-base-content/70">
              <Calendar size={16} />
              {dateStr}
            </span>
          )}
          {placeStr && (
            <span className="flex items-center gap-1.5 text-base-content/70">
              <MapPin size={16} />
              {placeStr}
            </span>
          )}
        </div>
        {(evt.value || evt.cause || evt.agency) && (
          <div className="text-sm text-base-content/70 pt-1">
            {evt.value && <p>{evt.value}</p>}
            {evt.cause && <p className="text-xs text-base-content/50">Cause: {evt.cause}</p>}
            {evt.agency && <p className="text-xs text-base-content/50">Agency: {evt.agency}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function EventsMap({ events }) {
  const eventsWithPlaces = events.filter((evt) => evt.place?.original || evt.place?.name);
  if (eventsWithPlaces.length === 0) {
    return <p className="text-sm text-base-content/50">No events with places to show on map.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-lg bg-base-300/50 border border-base-content/10 flex items-center justify-center">
        <div className="text-center text-base-content/50">
          <span className="mx-auto mb-2 block shrink-0"><Map size={48} /></span>
          <p className="text-sm">Map view</p>
          <p className="text-xs mt-1">
            {eventsWithPlaces.length} event{eventsWithPlaces.length !== 1 ? 's' : ''} with places
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Places ({eventsWithPlaces.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {eventsWithPlaces.map((evt, idx) => {
            const placeStr = evt.place?.original || evt.place?.name;
            const typeLabel = evt.customType
              ? `${formatEventType(evt.eventType)} (${evt.customType})`
              : formatEventType(evt.eventType);
            return (
              <div
                key={evt.id || idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200/50 border border-base-content/10 text-sm"
              >
                <span className="text-base-content/50 shrink-0 inline-flex"><MapPin size={16} /></span>
                <span className="font-medium">{placeStr}</span>
                <span className="text-base-content/50">—</span>
                <span className="text-base-content/70">{typeLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FamilyEventsSection({ family, treeId }) {
  const [timelineOrientation, setTimelineOrientation] = useState('vertical');

  if (!family) return null;

  const events = family.allEvents || [];
  const eventsWithPlaces = events.filter((evt) => evt.place?.original || evt.place?.name);
  const eventTabs = [
    { id: 'list', label: 'List', icon: List, count: events.length },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: events.length },
    { id: 'map', label: 'Map', icon: Map, count: eventsWithPlaces.length },
  ];

  const [activeTab, setActiveTab] = useState('list');

  return (
    <FamilySection title="Events" count={events.length} showBackToTop>
      <IndividualSectionTabs tabs={eventTabs} activeId={activeTab} onChange={setActiveTab} />
      <IndividualSectionTabsContent>
        {events.length === 0 ? (
          <p className="text-sm text-base-content/50">No events found.</p>
        ) : activeTab === 'list' ? (
          <div className="space-y-3">
            {events.map((evt, idx) => (
              <FamilyEventCard key={evt.id || idx} evt={evt} idx={idx} />
            ))}
          </div>
        ) : activeTab === 'timeline' ? (
          <EventsTimeline
            events={events}
            treeId={treeId}
            orientation={timelineOrientation}
            onOrientationChange={setTimelineOrientation}
          />
        ) : (
          <EventsMap events={events} />
        )}
      </IndividualSectionTabsContent>
    </FamilySection>
  );
}
