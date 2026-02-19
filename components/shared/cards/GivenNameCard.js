'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';

/**
 * GivenNameCard Component
 * Card for displaying given names
 * 
 * @param {Object} props
 * @param {Object} props.givenName - Given name object
 * @param {string} props.treeId - Tree ID for links
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function GivenNameCard({ 
  givenName, 
  treeId,
  onClick,
  className = '' 
}) {
  const {
    name,
    normalizedName,
    individualsCount = 0,
    malesCount = 0,
    femalesCount = 0,
    unknownCount = 0,
  } = givenName;

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
            <h3 className="text-xl font-semibold text-base-content">
              {name}
            </h3>
            {normalizedName && normalizedName !== name && (
              <p className="text-sm text-base-content/60 mt-0.5">
                {normalizedName}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 py-2 border-t border-b border-base-content/10">
          <div className="text-center">
            <div className="text-lg font-semibold text-base-content">
              {individualsCount}
            </div>
            <div className="text-xs text-base-content/60">
              Total
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {malesCount}
            </div>
            <div className="text-xs text-base-content/60">
              ♂ Male
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-pink-600 dark:text-pink-400">
              {femalesCount}
            </div>
            <div className="text-xs text-base-content/60">
              ♀ Female
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-base-content/70">
              {unknownCount}
            </div>
            <div className="text-xs text-base-content/60">
              ? Unknown
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

