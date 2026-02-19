'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * ResearchNoteCard Component
 * Card for displaying research notes
 * 
 * @param {Object} props
 * @param {Object} props.note - Research note object
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function ResearchNoteCard({ note, onClick, className = '' }) {
  const {
    id,
    title,
    content,
    entityType,
    entityId,
    isPrivate,
    tags = [],
    notebook,
    user,
    createdAt,
    updatedAt,
    tree,
  } = note;

  const isEdited = updatedAt && new Date(updatedAt) > new Date(createdAt);

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
              {isPrivate && (
                <Badge variant="default" size="sm">
                  Private
                </Badge>
              )}
              {notebook && (
                <Badge variant="info" size="sm">
                  {notebook.name}
                </Badge>
              )}
              {entityType && (
                <>
                  <EntityIcon entityType={entityType} size="sm" />
                  <span className="text-xs text-base-content/60">
                    {entityType}
                  </span>
                </>
              )}
            </div>
            {title ? (
              <h3 className="text-lg font-semibold text-base-content truncate">
                {title}
              </h3>
            ) : (
              <h3 className="text-lg font-semibold text-base-content/60 italic">
                Untitled Note
              </h3>
            )}
          </div>
        </div>

        {/* Content Preview */}
        {content && (
          <p className="text-sm text-base-content/70 line-clamp-3">
            {content}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 5).map((tag, index) => (
              <Badge key={index} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
            {tags.length > 5 && (
              <Badge variant="default" size="sm">
                +{tags.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Avatar
                  src={user.profilePhotoUrl}
                  name={user.name || user.username}
                  size="sm"
                />
                <span className="text-sm text-base-content/70">
                  {user.name || user.username}
                </span>
              </>
            )}
            {createdAt && (
              <span className="text-xs text-base-content/50">
                {new Date(createdAt).toLocaleDateString()}
                {isEdited && ' (edited)'}
              </span>
            )}
          </div>
          {tree && (
            <span className="text-xs text-base-content/60 flex items-center gap-1">
              <EntityIcon entityType="tree" size="sm" />
              {tree.name}
            </span>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

