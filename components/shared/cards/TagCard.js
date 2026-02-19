'use client';

import BaseCard from './BaseCard';
import { TagBadge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';

/**
 * TagCard Component
 * Card for displaying tags
 * 
 * @param {Object} props
 * @param {Object} props.tag - Tag object
 * @param {number} props.itemCount - Number of items tagged with this tag
 * @param {Function} props.onClick - Optional click handler
 * @param {Function} props.onRemove - Optional remove handler
 * @param {string} props.className - Additional CSS classes
 */
export default function TagCard({ 
  tag, 
  itemCount = 0,
  onClick,
  onRemove,
  className = '' 
}) {
  const {
    id,
    name,
    color,
    description,
    isGlobal,
    userId,
    createdAt,
  } = tag;

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
              <EntityIcon entityType="tag" size="sm" />
              {isGlobal ? (
                <TagBadge name={name} color={color} size="md" />
              ) : (
                <TagBadge name={name} color={color} size="md" removable={!!onRemove} onRemove={onRemove} />
              )}
            </div>
            {description && (
              <p className="text-sm text-base-content/70 line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
          <div className="flex items-center gap-2 text-sm text-base-content/60">
            {isGlobal ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Global
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal
              </span>
            )}
          </div>
          {itemCount > 0 && (
            <span className="text-sm font-medium text-base-content/80">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

