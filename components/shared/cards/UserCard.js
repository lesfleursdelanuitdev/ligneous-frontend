'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import Avatar from '../ui/avatars/Avatar';

/**
 * UserCard Component
 * Card for displaying user accounts
 * 
 * @param {Object} props
 * @param {Object} props.user - User object
 * @param {Object} props.profile - User profile object (optional)
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function UserCard({ 
  user, 
  profile,
  onClick,
  className = '' 
}) {
  const {
    id,
    username,
    name,
    email,
    isWebsiteOwner,
    profilePhotoUrl,
  } = user;

  const {
    displayName,
    bio,
    location,
    treesOwnedCount = 0,
    treesMaintainedCount = 0,
    contributionsCount = 0,
    followersCount = 0,
    followingCount = 0,
  } = profile || {};

  const displayNameFinal = displayName || name || username;

  return (
    <BaseCard
      clickable={!!onClick}
      onClick={onClick}
      hoverable
      className={className}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Avatar
              src={profilePhotoUrl}
              name={displayNameFinal}
              size="lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isWebsiteOwner && (
                <Badge variant="accent" size="sm">Admin</Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-base-content truncate">
              {displayNameFinal}
            </h3>
            <p className="text-sm text-base-content/60 truncate">
              @{username}
            </p>
            {location && (
              <p className="text-sm text-base-content/70 truncate mt-1">
                📍 {location}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-base-content/70 line-clamp-2">
            {bio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-base-content/10">
          <div className="text-center">
            <div className="text-lg font-semibold text-base-content">
              {treesOwnedCount + treesMaintainedCount}
            </div>
            <div className="text-xs text-base-content/60">
              {treesOwnedCount + treesMaintainedCount === 1 ? 'Tree' : 'Trees'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-base-content">
              {contributionsCount}
            </div>
            <div className="text-xs text-base-content/60">
              {contributionsCount === 1 ? 'Contribution' : 'Contributions'}
            </div>
          </div>
        </div>

        {/* Following/Followers */}
        {(followingCount > 0 || followersCount > 0) && (
          <div className="flex items-center gap-4 text-sm text-base-content/60">
            {followersCount > 0 && (
              <span>
                <span className="font-medium">{followersCount}</span> {followersCount === 1 ? 'follower' : 'followers'}
              </span>
            )}
            {followingCount > 0 && (
              <span>
                Following <span className="font-medium">{followingCount}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
}

