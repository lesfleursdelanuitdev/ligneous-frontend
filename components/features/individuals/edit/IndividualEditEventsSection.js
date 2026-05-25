'use client';

import { useState } from 'react';
import IndividualSection from '../view/IndividualSection';
import DateInput from '@/components/shared/forms/DateInput';
import PlaceInput from '@/components/shared/forms/PlaceInput';
import { formatEventType } from '@/lib/individual-utils';
import { Plus, Trash2 } from 'lucide-react';

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Select type…' },
  { value: 'BIRT', label: 'Birth' },
  { value: 'DEAT', label: 'Death' },
  { value: 'MARR', label: 'Marriage' },
  { value: 'DIV', label: 'Divorce' },
  { value: 'BURI', label: 'Burial' },
  { value: 'BAPM', label: 'Baptism' },
  { value: 'CHR', label: 'Christening' },
  { value: 'CENS', label: 'Census' },
  { value: 'RESI', label: 'Residence' },
  { value: 'OCCU', label: 'Occupation' },
];

function EventEditCard({ evt, idx, treeId, isNew, onRemove }) {
  const isDerived = evt.eventType === 'BIRTH_OF_CHILD' || evt._source === 'family';
  const typeLabel = evt.eventType === 'BIRTH_OF_CHILD'
    ? null
    : evt.customType
      ? `${formatEventType(evt.eventType)} (${evt.customType})`
      : formatEventType(evt.eventType);
  const dateStr = evt.date?.original;
  const placeStr = evt.place?.original || evt.place?.name;

  if (isDerived) {
    return (
      <div className="card bg-base-200/50 border border-base-content/10 rounded-box opacity-75">
        <div className="card-body p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-sm badge-ghost">Read-only (derived)</span>
          </div>
          <p className="font-semibold text-sm text-base-content/80">
            {evt.eventType === 'BIRTH_OF_CHILD'
              ? `Birth of child`
              : typeLabel}
          </p>
          <p className="text-sm text-base-content/60">
            {dateStr && <span>{dateStr}</span>}
            {placeStr && <span> — {placeStr}</span>}
          </p>
          <p className="text-xs text-base-content/50">
            Edit the related individual or family to change this event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-base-content/10 rounded-box bg-base-100">
      <div className="card-body p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <label className="text-xs text-base-content/60 block" htmlFor={isNew ? `event-type-${evt.id || idx}` : undefined}>
              Event type
            </label>
            {isNew ? (
              <select
                id={`event-type-${evt.id || idx}`}
                className="dropdown-field w-full max-w-xs"
                defaultValue={evt.eventType ?? ''}
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <p className="font-semibold text-sm text-base-content pt-0.5">{typeLabel || 'Event'}</p>
            )}
          </div>
          {isNew && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="btn btn-ghost btn-sm text-error bg-base-200/70 hover:bg-error/10 shrink-0 gap-1.5"
              title="Remove event"
              aria-label="Remove event"
            >
              <span className="shrink-0 flex items-center justify-center"><Trash2 size={18} /></span>
              Remove
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateInput
            date={evt.date}
            label="Date"
            id={`event-date-${evt.id || idx}`}
            required={false}
          />
          <PlaceInput
            place={evt.place}
            placeDisplay={evt.place?.original ?? evt.place?.name ?? ''}
            label="Place"
            id={`event-place-${evt.id || idx}`}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Value / description
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            defaultValue={evt.value ?? ''}
            placeholder="Value or description"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Cause
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              defaultValue={evt.cause ?? ''}
              placeholder="Cause"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Agency
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              defaultValue={evt.agency ?? ''}
              placeholder="Agency"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IndividualEditEventsSection({ individual, treeId }) {
  if (!individual) return null;

  const initialEvents =
    individual.allEvents ||
    (individual.individualEvents || []).map((ie) => ie.event).filter(Boolean);

  const [events, setEvents] = useState(initialEvents);
  const [newEvents, setNewEvents] = useState([]);

  const handleAddEvent = () => {
    setNewEvents((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        eventType: '',
        date: null,
        place: null,
        value: '',
        cause: '',
        agency: '',
      },
    ]);
  };

  const handleRemoveNewEvent = (id) => {
    setNewEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const allEvents = [...events, ...newEvents];

  return (
    <IndividualSection title="Events" count={allEvents.length} showBackToTop>
      {allEvents.length === 0 ? (
        <p className="text-sm text-base-content/50">No events found. Add an event below.</p>
      ) : null}
      <div className="space-y-4">
        {events.map((evt, idx) => (
          <EventEditCard
            key={evt.id || idx}
            evt={evt}
            idx={idx}
            treeId={treeId}
            isNew={false}
          />
        ))}
        {newEvents.map((evt) => (
          <EventEditCard
            key={evt.id}
            evt={evt}
            idx={-1}
            treeId={treeId}
            isNew
            onRemove={() => handleRemoveNewEvent(evt.id)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={handleAddEvent}
        className="btn btn-ghost btn-sm gap-1.5 text-primary mt-4"
      >
        <span className="shrink-0 flex items-center justify-center"><Plus size={20} /></span>
        Add event
      </button>
    </IndividualSection>
  );
}
