'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';

/**
 * EventCard Component
 * Card for displaying events
 * 
 * @param {Object} props
 * @param {Object} props.event - Event object
 * @param {string} props.treeId - Tree ID for links
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function EventCard({ 
  event, 
  treeId,
  onClick,
  className = '' 
}) {
  const {
    id,
    eventType,
    date,
    place,
    description,
    individuals = [],
    families = [],
    sources = [],
    media = [],
  } = event;

  const eventTypeLabels = {
    BIRT: 'Birth',
    DEAT: 'Death',
    MARR: 'Marriage',
    DIV: 'Divorce',
    BAPM: 'Baptism',
    BURI: 'Burial',
    CENS: 'Census',
    IMMI: 'Immigration',
    EMIG: 'Emigration',
    NATU: 'Naturalization',
    OCCU: 'Occupation',
    RESI: 'Residence',
    EDUC: 'Education',
    RELI: 'Religion',
  };

  return (
    <BaseCard
      clickable={!!onClick}
      onClick={onClick}
      hoverable
      className={className}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EntityIcon entityType="event" size="sm" />
              <Badge variant="accent" size="sm">
                {eventTypeLabels[eventType] || eventType}
              </Badge>
            </div>
            {date && (
              <div className="text-base font-semibold text-base-content">
                {date}
              </div>
            )}
            {place && (
              <div className="text-sm text-base-content/70 mt-1">
                📍 {place}
              </div>
            )}
            {description && (
              <p className="text-sm text-base-content/70 line-clamp-2 mt-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Participants */}
        {(individuals.length > 0 || families.length > 0) && (
          <div className="pt-2 border-t border-base-content/10">
            <div className="flex flex-wrap gap-2 text-xs text-base-content/60">
              {individuals.length > 0 && (
                <span>
                  {individuals.length} {individuals.length === 1 ? 'person' : 'people'}
                </span>
              )}
              {families.length > 0 && (
                <span>
                  {families.length} {families.length === 1 ? 'family' : 'families'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sources & Media */}
        {(sources.length > 0 || media.length > 0) && (
          <div className="flex items-center gap-4 text-xs text-base-content/60">
            {sources.length > 0 && (
              <span className="flex items-center gap-1">
                <EntityIcon entityType="source" size="sm" />
                {sources.length} {sources.length === 1 ? 'source' : 'sources'}
              </span>
            )}
            {media.length > 0 && (
              <span className="flex items-center gap-1">
                <EntityIcon entityType="media" size="sm" />
                {media.length} {media.length === 1 ? 'media' : 'media'}
              </span>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
}

