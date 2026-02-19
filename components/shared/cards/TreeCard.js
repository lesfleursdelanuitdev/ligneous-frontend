'use client';

import Link from 'next/link';
import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * TreeCard Component
 * Card for displaying family trees
 * 
 * @param {Object} props
 * @param {Object} props.tree - Tree object
 * @param {Function} props.onClick - Optional click handler
 * @param {Function} props.onRequestAccess - Callback when request access is clicked
 * @param {string} props.variant - Variant: 'default', 'compact', 'featured'
 * @param {boolean} props.showPreview - Whether to show mini pedigree preview
 * @param {string} props.className - Additional CSS classes
 */
export default function TreeCard({ 
  tree,
  onClick,
  onRequestAccess,
  variant = 'default',
  showPreview = false,
  className = '' 
}) {
  const {
    id,
    name,
    description,
    isPublic,
    individualsCount = 0,
    familiesCount = 0,
    generations = 0,
    locations = [],
    dateRange = {},
    owner,
    owners = [],
    updatedAt,
    createdAt,
    focalPerson,
  } = tree;

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';
  const primaryOwner = owner || owners?.find(o => o.isPrimary)?.user || owners?.[0]?.user;

  const treeLink = id ? `/trees/${id}` : null;

  return (
    <BaseCard
      clickable={!!onClick || !!treeLink}
      onClick={onClick}
      hoverable
      variant={isFeatured ? 'elevated' : 'default'}
      className={`
        ${isFeatured ? 'ring-2 ring-primary' : ''}
        ${className}
      `}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EntityIcon entityType="tree" size="sm" />
              {isPublic ? (
                <Badge variant="success" size="sm">Public</Badge>
              ) : (
                <Badge variant="default" size="sm">Private</Badge>
              )}
              {isFeatured && (
                <Badge variant="accent" size="sm">Featured</Badge>
              )}
            </div>
            {treeLink ? (
              <Link
                href={treeLink}
                className="text-lg font-semibold text-base-content link link-hover link-primary truncate block"
                onClick={(e) => {
                  if (onClick) {
                    e.preventDefault();
                    onClick();
                  }
                }}
              >
                {name}
              </Link>
            ) : (
              <h3 className="text-lg font-semibold text-base-content truncate">
                {name}
              </h3>
            )}
            {description && !isCompact && (
              <p className="text-sm text-base-content/70 line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        {!isCompact && (
          <div className="grid grid-cols-3 gap-3 py-2 border-t border-b border-base-content/10">
            <div className="text-center">
              <div className="text-lg font-semibold text-base-content">{individualsCount.toLocaleString()}</div>
              <div className="text-xs text-base-content/50">{individualsCount === 1 ? 'Person' : 'People'}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-base-content">{familiesCount.toLocaleString()}</div>
              <div className="text-xs text-base-content/50">{familiesCount === 1 ? 'Family' : 'Families'}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-base-content">{generations}</div>
              <div className="text-xs text-base-content/50">{generations === 1 ? 'Generation' : 'Generations'}</div>
            </div>
          </div>
        )}

        {/* Date Range */}
        {!isCompact && dateRange && (dateRange.start || dateRange.end) && (
          <div className="text-sm text-base-content/70">
            <span className="font-medium">Time Period:</span>{' '}
            {dateRange.start || '?'} - {dateRange.end || 'Present'}
          </div>
        )}

        {/* Locations */}
        {!isCompact && locations && locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {locations.slice(0, 3).map((location, index) => (
              <Badge key={index} variant="info" size="sm">
                📍 {location}
              </Badge>
            ))}
            {locations.length > 3 && (
              <Badge variant="default" size="sm">
                +{locations.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
          <div className="flex items-center gap-2">
            {primaryOwner && (
              <>
                <Avatar
                  src={primaryOwner.profilePhotoUrl}
                  name={primaryOwner.name || primaryOwner.username}
                  size="sm"
                />
                <span className="text-sm text-base-content/70">
                  {primaryOwner.name || primaryOwner.username}
                </span>
              </>
            )}
            {updatedAt && (
              <span className="text-xs text-base-content/50">
                Updated {new Date(updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isCompact && (
          <div className="flex gap-2 pt-2">
            {treeLink && (
              <Link
                href={treeLink}
                className="btn btn-primary btn-sm flex-1"
                onClick={(e) => {
                  if (onClick) {
                    e.preventDefault();
                    onClick();
                  }
                }}
              >
                Explore
              </Link>
            )}
            {!isPublic && onRequestAccess && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestAccess(tree);
                }}
                className="btn btn-ghost btn-sm"
              >
                Request Access
              </button>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
}

