'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * SuggestionCard Component
 * Card for displaying suggestions
 * 
 * @param {Object} props
 * @param {Object} props.suggestion - Suggestion object
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function SuggestionCard({ suggestion, onClick, className = '' }) {
  const {
    id,
    entityType,
    entityId,
    fieldName,
    currentValue,
    suggestedValue,
    evidence,
    status,
    suggestedBy,
    suggester,
    reviewedBy,
    reviewer,
    reviewedAt,
    createdAt,
    tree,
  } = suggestion;

  const statusColors = {
    pending: 'default',
    approved: 'success',
    rejected: 'error',
    needs_info: 'warning',
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
            <div className="flex items-center gap-2 mb-2">
              <EntityIcon entityType={entityType} size="sm" />
              <Badge variant={statusColors[status] || 'default'} size="sm">
                {status}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-base-content">
              {fieldName} Suggestion
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              {entityType}: {entityId}
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="space-y-2 p-3 bg-base-200 rounded-lg">
          {currentValue && (
            <div>
              <span className="text-xs font-medium text-base-content/60">Current:</span>
              <p className="text-sm text-base-content/80 mt-0.5 line-clamp-2">
                {currentValue}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium text-base-content/60">Suggested:</span>
            <p className="text-sm text-success mt-0.5 line-clamp-2">
              {suggestedValue}
            </p>
          </div>
        </div>

        {/* Evidence */}
        {evidence && (
          <p className="text-sm text-base-content/70 line-clamp-2">
            <span className="font-medium">Evidence:</span> {evidence}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
          <div className="flex items-center gap-2">
            {suggester && (
              <>
                <Avatar
                  src={suggester.profilePhotoUrl}
                  name={suggester.name || suggester.username}
                  size="sm"
                />
                <span className="text-sm text-base-content/70">
                  {suggester.name || suggester.username}
                </span>
              </>
            )}
            {createdAt && (
              <span className="text-xs text-base-content/50">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {reviewer && reviewedAt && (
            <div className="text-xs text-base-content/60">
              Reviewed by {reviewer.name || reviewer.username}
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

