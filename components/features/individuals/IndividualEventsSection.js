'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, List, Clock, Map, Rows2, Columns2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import IndividualSection from './IndividualSection';
import IndividualSectionTabs from './IndividualSectionTabs';
import IndividualSectionTabsContent from './IndividualSectionTabsContent';
import { stripSlashes, formatEventType } from '@/lib/individual-utils';

function EventCard({ evt, idx, treeId }) {
  const isBirthOfChild = evt.eventType === 'BIRTH_OF_CHILD';
  const childLabel = stripSlashes(evt._childName) || evt._childXref;
  const typeLabel = isBirthOfChild
    ? null
    : evt.customType
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
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-base-content">
            {isBirthOfChild ? (
              <>
                Birth of{' '}
                <Link
                  href={`/trees/${treeId}/individuals/${encodeURIComponent(evt._childXref)}`}
                  className="link link-primary"
                >
                  {childLabel}
                </Link>
              </>
            ) : (
              typeLabel
            )}
          </p>
          {evt._source === 'family' && (
            <span className="badge badge-sm badge-ghost">Family event</span>
          )}
          {isBirthOfChild && (
            <span className="badge badge-sm badge-ghost">Derived</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {dateStr && (
            <span className="flex items-center gap-1.5 text-base-content/70">
              <Calendar size={14} />
              {dateStr}
            </span>
          )}
          {placeStr && (
            <span className="flex items-center gap-1.5 text-base-content/70">
              <MapPin size={14} />
              {placeStr}
            </span>
          )}
        </div>
        {evt._spouseName && (
          <p className="text-xs text-base-content/50">
            With: {stripSlashes(evt._spouseName)}
          </p>
        )}
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
          <Map size={48} className="mx-auto mb-2 opacity-50" />
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
            const typeLabel = evt.eventType === 'BIRTH_OF_CHILD'
              ? `Birth of ${stripSlashes(evt._childName) || evt._childXref}`
              : evt.customType
                ? `${formatEventType(evt.eventType)} (${evt.customType})`
                : formatEventType(evt.eventType);
            return (
              <div
                key={evt.id || idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200/50 border border-base-content/10 text-sm"
              >
                <MapPin size={14} className="text-base-content/50 shrink-0" />
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

function TimelineEventContent({ evt, treeId }) {
  const isBirthOfChild = evt.eventType === 'BIRTH_OF_CHILD';
  const childLabel = stripSlashes(evt._childName) || evt._childXref;
  const typeLabel = isBirthOfChild
    ? null
    : evt.customType
      ? `${formatEventType(evt.eventType)} (${evt.customType})`
      : formatEventType(evt.eventType);

  return (
    <div className="space-y-0.5">
      <p className="font-semibold text-sm text-base-content">
        {isBirthOfChild ? (
          <>
            Birth of{' '}
            <Link
              href={`/trees/${treeId}/individuals/${encodeURIComponent(evt._childXref)}`}
              className="link link-primary"
            >
              {childLabel}
            </Link>
          </>
        ) : (
          typeLabel
        )}
      </p>
      {(evt.place?.original || evt.place?.name) && (
        <p className="text-xs text-base-content/70 flex items-center gap-1">
          <MapPin size={12} />
          {evt.place?.original || evt.place?.name}
        </p>
      )}
      {evt._spouseName && (
        <p className="text-xs text-base-content/50">
          With: {stripSlashes(evt._spouseName)}
        </p>
      )}
    </div>
  );
}

const EVENTS_PER_PAGE_OPTIONS = [1, 2, 3, 4, 5, 6];
const slideTransition = { type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] };

function EventsTimeline({ events, treeId, orientation, onOrientationChange }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev
  const [eventsPerPage, setEventsPerPage] = useState(4);

  const isVertical = orientation === 'vertical';

  useEffect(() => {
    setPageIndex(0);
  }, [orientation, eventsPerPage]);
  const totalPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
  const clampedPage = Math.min(pageIndex, totalPages - 1);
  const pagedEvents = events.slice(clampedPage * eventsPerPage, clampedPage * eventsPerPage + eventsPerPage);

  const goPrev = () => {
    if (clampedPage <= 0) return;
    setDirection(-1);
    setPageIndex(clampedPage - 1);
  };
  const goNext = () => {
    if (clampedPage >= totalPages - 1) return;
    setDirection(1);
    setPageIndex(clampedPage + 1);
  };

  const timelineClass = orientation === 'horizontal'
    ? 'timeline timeline-horizontal'
    : 'timeline timeline-vertical';

  const slideVariants = {
    enter: (dir) => ({
      opacity: 0,
      ...(isVertical
        ? { y: dir > 0 ? 24 : -24 }
        : { x: dir > 0 ? 48 : -48 }),
    }),
    center: { opacity: 1, x: 0, y: 0 },
    exit: (dir) => ({
      opacity: 0,
      ...(isVertical
        ? { y: dir > 0 ? -24 : 24 }
        : { x: dir > 0 ? -48 : 48 }),
    }),
  };

  const showArrows = events.length > eventsPerPage;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-base-content/50">Layout:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onOrientationChange('vertical')}
              className={`flex items-center justify-center w-8 h-8 rounded gap-1 border-0 transition-colors cursor-pointer ${
                orientation === 'vertical'
                  ? 'bg-base-300/80 text-base-content hover:bg-primary/40'
                  : 'bg-transparent text-base-content/70 hover:bg-primary/30'
              }`}
              title="Vertical timeline"
            >
              <Rows2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => onOrientationChange('horizontal')}
              className={`flex items-center justify-center w-8 h-8 rounded gap-1 border-0 transition-colors cursor-pointer ${
                orientation === 'horizontal'
                  ? 'bg-base-300/80 text-base-content hover:bg-primary/40'
                  : 'bg-transparent text-base-content/70 hover:bg-primary/30'
              }`}
              title="Horizontal timeline"
            >
              <Columns2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-base-content/50">Per page:</span>
          <div className="flex gap-0.5">
            {EVENTS_PER_PAGE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEventsPerPage(n)}
                className={`flex items-center justify-center w-7 h-7 rounded text-xs font-medium border-0 transition-colors cursor-pointer ${
                  eventsPerPage === n
                    ? 'bg-base-300/80 text-base-content hover:bg-primary/40'
                    : 'bg-transparent text-base-content/70 hover:bg-primary/30 hover:text-base-content'
                }`}
                title={`Show ${n} event${n === 1 ? '' : 's'} at a time`}
                aria-label={`Show ${n} events`}
                aria-pressed={eventsPerPage === n}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className={
          isVertical
            ? 'flex flex-col items-center gap-1'
            : 'flex flex-row items-stretch gap-1'
        }
      >
        {showArrows && (
          <button
            type="button"
            onClick={goPrev}
            disabled={clampedPage <= 0}
            className="flex items-center justify-center w-9 h-9 rounded border-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent text-base-content/70 hover:bg-primary/30 hover:text-base-content disabled:hover:bg-transparent disabled:hover:text-base-content/70 shrink-0"
            title="Previous events"
            aria-label="Previous events"
          >
            {isVertical ? <ChevronUp size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
        <div className="relative overflow-hidden min-h-[120px] flex-1 min-w-0">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.ul
              key={clampedPage}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className={timelineClass}
            >
              {pagedEvents.map((evt, idx) => {
                const globalIdx = clampedPage * eventsPerPage + idx;
                const dateStr = evt.date?.original || 'Undated';
                const isLast = idx === pagedEvents.length - 1;

                return (
                  <li key={evt.id || globalIdx} className="group">
                    {idx > 0 && <hr />}
                    <div className="timeline-start text-sm font-medium text-base-content/70 transition-colors group-hover:text-base-content">
                      {dateStr}
                    </div>
                    <div className="timeline-middle">
                      <div className="w-3 h-3 rounded-full bg-base-content/30 transition-colors group-hover:bg-base-content/50" />
                    </div>
                    <div className="timeline-end timeline-box transition-colors group-hover:bg-base-300/80 group-hover:[&_p]:!text-base-content">
                      <TimelineEventContent evt={evt} treeId={treeId} />
                    </div>
                    {!isLast && <hr />}
                  </li>
                );
              })}
            </motion.ul>
          </AnimatePresence>
        </div>
        {showArrows && (
          <button
            type="button"
            onClick={goNext}
            disabled={clampedPage >= totalPages - 1}
            className="flex items-center justify-center w-9 h-9 rounded border-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent text-base-content/70 hover:bg-primary/30 hover:text-base-content disabled:hover:bg-transparent disabled:hover:text-base-content/70 shrink-0"
            title="Next events"
            aria-label="Next events"
          >
            {isVertical ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function IndividualEventsSection({ individual, treeId }) {
  const [eventsTab, setEventsTab] = useState('list');
  const [timelineOrientation, setTimelineOrientation] = useState('vertical');

  if (!individual) return null;

  const events =
    individual.allEvents ||
    (individual.individualEvents || []).map((ie) => ie.event).filter(Boolean);

  const eventsWithPlaces = events.filter((evt) => evt.place?.original || evt.place?.name);
  const eventTabs = [
    { id: 'list', label: 'List', icon: List, count: events.length },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: events.length },
    { id: 'map', label: 'Map', icon: Map, count: eventsWithPlaces.length },
  ];

  return (
    <IndividualSection title="Events" count={events.length} showBackToTop>
      <IndividualSectionTabs tabs={eventTabs} activeId={eventsTab} onChange={setEventsTab} />
      <IndividualSectionTabsContent>
        {events.length === 0 ? (
          <p className="text-sm text-base-content/50">No events found.</p>
        ) : eventsTab === 'list' ? (
          <div className="space-y-3">
            {events.map((evt, idx) => (
              <EventCard key={evt.id || idx} evt={evt} idx={idx} treeId={treeId} />
            ))}
          </div>
        ) : eventsTab === 'timeline' ? (
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
    </IndividualSection>
  );
}
