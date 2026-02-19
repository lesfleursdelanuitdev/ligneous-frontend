'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * AlbumCard Component
 * Card for displaying albums
 * 
 * @param {Object} props
 * @param {Object} props.album - Album object
 * @param {number} props.mediaCount - Number of media items in album
 * @param {string} props.coverImageUrl - Cover image URL
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function AlbumCard({ 
  album, 
  mediaCount = 0,
  coverImageUrl,
  onClick,
  className = '' 
}) {
  const {
    id,
    name,
    description,
    isPublic,
    user,
    createdAt,
    updatedAt,
  } = album;

  return (
    <BaseCard
      clickable={!!onClick}
      onClick={onClick}
      hoverable
      className={className}
    >
      <div className="space-y-3">
        {/* Cover Image */}
        {coverImageUrl ? (
          <div className="relative w-full h-48 bg-base-200 rounded-lg overflow-hidden">
            <img
              src={coverImageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge variant={isPublic ? 'success' : 'default'} size="sm">
                {isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-48 bg-base-200 rounded-lg flex items-center justify-center">
            <EntityIcon entityType="album" size="lg" />
            <div className="absolute top-2 right-2">
              <Badge variant={isPublic ? 'success' : 'default'} size="sm">
                {isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EntityIcon entityType="album" size="sm" />
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
            <EntityIcon entityType="media" size="sm" />
            {mediaCount} {mediaCount === 1 ? 'item' : 'items'}
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

