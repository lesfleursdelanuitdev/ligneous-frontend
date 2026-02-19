'use client';

import BaseCard from './BaseCard';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * ActivityCard Component
 * Card for displaying activity feed items
 * 
 * @param {Object} props
 * @param {Object} props.activity - Activity object
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function ActivityCard({ activity, onClick, className = '' }) {
  const {
    id,
    activityType,
    entityType,
    entityId,
    description,
    user,
    tree,
    createdAt,
    metadata,
  } = activity;

  const activityIcons = {
    edit: 'note',
    comment: 'note',
    suggestion: 'source',
    media_upload: 'media',
    content_created: 'note',
    follow: 'user',
    tree_created: 'tree',
    individual_added: 'individual',
    family_added: 'family',
  };

  return (
    <BaseCard
      clickable={!!onClick}
      onClick={onClick}
      hoverable
      className={className}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {user ? (
            <Avatar
              src={user.profilePhotoUrl}
              name={user.name || user.username}
              size="md"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center">
              <EntityIcon 
                entityType={activityIcons[activityType] || entityType || 'note'} 
                size="md" 
              />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {user && (
                <p className="text-sm font-medium text-base-content">
                  {user.name || user.username}
                </p>
              )}
              <p className="text-sm text-base-content/70 mt-1">
                {description}
              </p>
              {entityType && entityId && (
                <div className="flex items-center gap-1.5 mt-2">
                  <EntityIcon entityType={entityType} size="sm" />
                  <span className="text-xs text-base-content/60">
                    {entityType}: {entityId}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-base-content/60">
            {tree && (
              <span className="flex items-center gap-1">
                <EntityIcon entityType="tree" size="sm" />
                {tree.name}
              </span>
            )}
            {createdAt && (
              <span>
                {new Date(createdAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

