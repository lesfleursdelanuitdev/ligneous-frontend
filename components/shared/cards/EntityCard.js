'use client';

import BaseCard from './BaseCard';
import { EntityIcon } from '../ui/metadata';
import { Badge } from '../ui/badges';

/**
 * EntityCard Component
 * Configurable entity card wrapper that can display any entity type
 * 
 * @param {Object} props
 * @param {string} props.entityType - Entity type
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Card subtitle
 * @param {React.ReactNode} props.children - Card content
 * @param {Array} props.badges - Array of badge objects: { label, variant, size }
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function EntityCard({
  entityType,
  title,
  subtitle,
  children,
  badges = [],
  onClick,
  className = '',
}) {
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
              {entityType && <EntityIcon entityType={entityType} size="sm" />}
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant={badge.variant || 'default'}
                  size={badge.size || 'sm'}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
            {title && (
              <h3 className="text-lg font-semibold text-base-content truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-base-content/70 truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </BaseCard>
  );
}

