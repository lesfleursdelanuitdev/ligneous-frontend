'use client';

import { Globe, User } from 'lucide-react';
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
                <Globe className="w-4 h-4 shrink-0" />
                Global
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4 shrink-0" />
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

