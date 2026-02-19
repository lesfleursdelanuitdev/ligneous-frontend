'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';

/**
 * SourceCard Component
 * Card for displaying sources/citations
 * 
 * @param {Object} props
 * @param {Object} props.source - Source object
 * @param {string} props.treeId - Tree ID for links
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function SourceCard({ 
  source, 
  treeId,
  onClick,
  className = '' 
}) {
  const {
    id,
    xref,
    title,
    author,
    publication,
    repository,
    citationsCount = 0,
    media = [],
  } = source;

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
              <EntityIcon entityType="source" size="sm" />
              {xref && (
                <Badge variant="default" size="sm">{xref}</Badge>
              )}
            </div>
            {title ? (
              <h3 className="text-lg font-semibold text-base-content truncate">
                {title}
              </h3>
            ) : (
              <h3 className="text-lg font-semibold text-base-content/60 italic">
                Untitled Source
              </h3>
            )}
          </div>
        </div>

        {/* Author */}
        {author && (
          <div className="text-sm text-base-content/70">
            <span className="font-medium">Author:</span> {author}
          </div>
        )}

        {/* Publication */}
        {publication && (
          <div className="text-sm text-base-content/70">
            <span className="font-medium">Publication:</span> {publication}
          </div>
        )}

        {/* Repository */}
        {repository && (
          <div className="text-sm text-base-content/70">
            <span className="font-medium">Repository:</span> {repository}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
          <div className="flex items-center gap-4 text-xs text-base-content/60">
            {citationsCount > 0 && (
              <span>
                {citationsCount} {citationsCount === 1 ? 'citation' : 'citations'}
              </span>
            )}
            {media.length > 0 && (
              <span className="flex items-center gap-1">
                <EntityIcon entityType="media" size="sm" />
                {media.length} {media.length === 1 ? 'media' : 'media'}
              </span>
            )}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

