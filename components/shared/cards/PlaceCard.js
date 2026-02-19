'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';

/**
 * PlaceCard Component
 * Card for displaying places/locations
 * 
 * @param {Object} props
 * @param {Object} props.place - Place object
 * @param {string} props.treeId - Tree ID for links
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function PlaceCard({ 
  place, 
  treeId,
  onClick,
  className = '' 
}) {
  const {
    id,
    name,
    normalizedName,
    latitude,
    longitude,
    eventsCount = 0,
    individualsCount = 0,
    familiesCount = 0,
  } = place;

  const hasCoordinates = latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined;

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
              <EntityIcon entityType="place" size="sm" />
            </div>
            <h3 className="text-lg font-semibold text-base-content truncate">
              {name}
            </h3>
            {normalizedName && normalizedName !== name && (
              <p className="text-sm text-base-content/70 truncate mt-1">
                {normalizedName}
              </p>
            )}
          </div>
        </div>

        {/* Coordinates */}
        {hasCoordinates && (
          <div className="text-sm text-base-content/70">
            <span className="font-medium">Location:</span>{' '}
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 py-2 border-t border-b border-base-content/10">
          <div className="text-center">
            <div className="text-lg font-semibold text-base-content">
              {eventsCount}
            </div>
            <div className="text-xs text-base-content/60">
              {eventsCount === 1 ? 'Event' : 'Events'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-base-content">
              {individualsCount}
            </div>
            <div className="text-xs text-base-content/60">
              {individualsCount === 1 ? 'Person' : 'People'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-base-content">
              {familiesCount}
            </div>
            <div className="text-xs text-base-content/60">
              {familiesCount === 1 ? 'Family' : 'Families'}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

