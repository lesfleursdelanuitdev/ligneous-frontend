'use client';

import { FileText } from 'lucide-react';
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
            <FileText className="w-4 h-4 shrink-0" />
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

