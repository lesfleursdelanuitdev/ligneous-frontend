'use client';

import BaseCard from './BaseCard';

/**
 * SurnameCard Component
 * Card for displaying surnames
 * 
 * @param {Object} props
 * @param {Object} props.surname - Surname object
 * @param {string} props.treeId - Tree ID for links
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function SurnameCard({ 
  surname, 
  treeId,
  onClick,
  className = '' 
}) {
  const {
    name,
    normalizedName,
    individualsCount = 0,
    familiesCount = 0,
  } = surname;

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
        <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-base-content/10">
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

