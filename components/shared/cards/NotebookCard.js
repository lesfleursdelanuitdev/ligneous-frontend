'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import Avatar from '../ui/avatars/Avatar';

/**
 * NotebookCard Component
 * Card for displaying notebooks
 * 
 * @param {Object} props
 * @param {Object} props.notebook - Notebook object
 * @param {number} props.noteCount - Number of notes in notebook
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function NotebookCard({ notebook, noteCount = 0, onClick, className = '' }) {
  const {
    id,
    name,
    description,
    isPrivate,
    user,
    createdAt,
    updatedAt,
  } = notebook;

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
            </div>
            <h3 className="text-lg font-semibold text-base-content truncate">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-base-content/70 line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-base-content/60">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {noteCount} {noteCount === 1 ? 'note' : 'notes'}
          </span>
        </div>

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
              </span>
            )}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

