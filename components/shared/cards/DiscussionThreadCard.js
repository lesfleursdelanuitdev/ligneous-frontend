'use client';

import Link from 'next/link';
import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * DiscussionThreadCard Component
 * Card for displaying discussion threads
 * 
 * @param {Object} props
 * @param {Object} props.thread - Thread object
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function DiscussionThreadCard({ thread, onClick, className = '' }) {
  const {
    id,
    title,
    description,
    category,
    tags = [],
    isLocked,
    isPinned,
    isClosed,
    createdBy,
    creator,
    createdAt,
    posts = [],
    tree,
  } = thread;

  const postCount = posts?.length || 0;
  const hasReplies = postCount > 0;

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
              {isPinned && (
                <Badge variant="accent" size="sm">
                  Pinned
                </Badge>
              )}
              {isLocked && (
                <Badge variant="warning" size="sm">
                  Locked
                </Badge>
              )}
              {isClosed && (
                <Badge variant="default" size="sm">
                  Closed
                </Badge>
              )}
              {category && (
                <Badge variant="info" size="sm">
                  {category}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-base-content truncate">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-base-content/70 line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="default" size="sm">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
          <div className="flex items-center gap-2">
            {creator && (
              <>
                <Avatar
                  src={creator.profilePhotoUrl}
                  name={creator.name || creator.username}
                  size="sm"
                />
                <span className="text-sm text-base-content/70">
                  {creator.name || creator.username}
                </span>
              </>
            )}
            {createdAt && (
              <span className="text-xs text-base-content/50">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-base-content/60">
            {hasReplies && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {postCount}
              </span>
            )}
            {tree && (
              <span className="flex items-center gap-1">
                <EntityIcon entityType="tree" size="sm" />
                {tree.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

