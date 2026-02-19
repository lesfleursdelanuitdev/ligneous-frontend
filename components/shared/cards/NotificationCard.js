'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';

/**
 * NotificationCard Component
 * Card for displaying notifications
 * 
 * @param {Object} props
 * @param {Object} props.notification - Notification object
 * @param {Function} props.onClick - Optional click handler
 * @param {Function} props.onMarkRead - Optional mark as read handler
 * @param {string} props.className - Additional CSS classes
 */
export default function NotificationCard({ 
  notification, 
  onClick, 
  onMarkRead,
  className = '' 
}) {
  const {
    id,
    type,
    title,
    message,
    link,
    isRead,
    readAt,
    createdAt,
  } = notification;

  const typeIcons = {
    comment: 'note',
    reply: 'note',
    mention: 'user',
    suggestion: 'source',
    message: 'user',
    access_request: 'tree',
    activity: 'event',
    system: 'tree',
    follow: 'user',
    content_like: 'media',
    content_comment: 'note',
    content_share: 'media',
  };

  const typeColors = {
    comment: 'info',
    reply: 'info',
    mention: 'accent',
    suggestion: 'warning',
    message: 'accent',
    access_request: 'warning',
    activity: 'default',
    system: 'default',
    follow: 'success',
    content_like: 'success',
    content_comment: 'info',
    content_share: 'info',
  };

  return (
    <BaseCard
      clickable={!!onClick}
      onClick={onClick}
      hoverable={!isRead}
      className={`
        ${!isRead ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <EntityIcon entityType={typeIcons[type] || 'note'} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-base-content">
                  {title}
                </h3>
                {!isRead && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </div>
              {message && (
                <p className="text-sm text-base-content/70 line-clamp-2">
                  {message}
                </p>
              )}
            </div>
            {onMarkRead && !isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="text-xs text-base-content/60 hover:text-base-content"
                aria-label="Mark as read"
              >
                Mark read
              </button>
            )}
          </div>
          {createdAt && (
            <p className="text-xs text-base-content/50 mt-2">
              {new Date(createdAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

