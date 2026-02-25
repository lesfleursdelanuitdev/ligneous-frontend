'use client';

import { Heart, MessageCircle, Share2 } from 'lucide-react';
import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * UserContentCard Component
 * Card for displaying user content (research updates, stories, recipes, etc.)
 * 
 * @param {Object} props
 * @param {Object} props.content - User content object
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function UserContentCard({ content, onClick, className = '' }) {
  const {
    id,
    contentType,
    title,
    content: contentText,
    isPublic,
    visibility,
    surnames = [],
    locations = [],
    timePeriods = [],
    likesCount = 0,
    commentsCount = 0,
    sharesCount = 0,
    recipeIngredients,
    recipeInstructions,
    user,
    createdAt,
    tree,
    entityType,
    entityId,
  } = content;

  const contentTypeLabels = {
    research_update: 'Research Update',
    family_story: 'Family Story',
    research_discovery: 'Discovery',
    collaboration_request: 'Collaboration',
    recipe: 'Recipe',
    research_log: 'Research Log',
  };

  const contentTypeIcons = {
    research_update: 'note',
    family_story: 'individual',
    research_discovery: 'source',
    collaboration_request: 'user',
    recipe: 'media',
    research_log: 'note',
  };

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
              <EntityIcon entityType={contentTypeIcons[contentType] || 'note'} size="sm" />
              <Badge variant="accent" size="sm">
                {contentTypeLabels[contentType] || contentType}
              </Badge>
              {!isPublic && (
                <Badge variant="default" size="sm">
                  {visibility}
                </Badge>
              )}
            </div>
            {title && (
              <h3 className="text-lg font-semibold text-base-content truncate">
                {title}
              </h3>
            )}
          </div>
        </div>

        {/* Content Preview */}
        {contentText && (
          <p className="text-sm text-base-content/70 line-clamp-3">
            {contentText}
          </p>
        )}

        {/* Recipe-specific */}
        {contentType === 'recipe' && recipeIngredients && (
          <div className="p-3 bg-base-200 rounded-lg">
            <p className="text-xs font-medium text-base-content/60 mb-1">Ingredients:</p>
            <p className="text-sm text-base-content/80 line-clamp-2">
              {recipeIngredients}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {surnames.slice(0, 3).map((surname, index) => (
            <Badge key={`surname-${index}`} variant="default" size="sm">
              {surname}
            </Badge>
          ))}
          {locations.slice(0, 2).map((location, index) => (
            <Badge key={`location-${index}`} variant="info" size="sm">
              📍 {location}
            </Badge>
          ))}
          {timePeriods.slice(0, 2).map((period, index) => (
            <Badge key={`period-${index}`} variant="default" size="sm">
              {period}
            </Badge>
          ))}
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
          <div className="flex items-center gap-4 text-sm text-base-content/60">
            {likesCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 shrink-0" />
                {likesCount}
              </span>
            )}
            {commentsCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4 shrink-0" />
                {commentsCount}
              </span>
            )}
            {sharesCount > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="w-4 h-4 shrink-0" />
                {sharesCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

