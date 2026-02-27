'use client';

/**
 * Reusable place form with City and Country fields.
 * Neither field is required.
 * @param {Object} props
 * @param {Object} props.place - { name?, country? } from API (GedcomPlace)
 * @param {string} props.placeDisplay - Fallback display string when no structured place
 * @param {string} props.label - Label for the section (e.g. "Birth place", "Place")
 * @param {string} props.id - Base id for input elements
 */
export default function PlaceInput({ place, placeDisplay = '', label = 'Place', id }) {
  const city = place?.name ?? place?.original ?? placeDisplay ?? '';
  const country = place?.country ?? '';
  const baseId = id || `place-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50 block">
        {label}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-base-content/60" htmlFor={`${baseId}-city`}>
            City
          </label>
          <input
            id={`${baseId}-city`}
            type="text"
            className="input input-bordered w-full"
            defaultValue={city}
            placeholder="City"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-base-content/60" htmlFor={`${baseId}-country`}>
            Country
          </label>
          <input
            id={`${baseId}-country`}
            type="text"
            className="input input-bordered w-full"
            defaultValue={country}
            placeholder="Country"
          />
        </div>
      </div>
    </div>
  );
}
