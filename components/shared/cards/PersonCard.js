'use client';

import Link from 'next/link';
import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * PersonCard Component
 * Card for displaying individual/person entities
 * 
 * @param {Object} props
 * @param {Object} props.person - Person/individual object
 * @param {string} props.treeId - Tree ID for links
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.variant - Variant: 'default', 'compact'
 * @param {string} props.className - Additional CSS classes
 */
export default function PersonCard({ 
  person, 
  treeId,
  onClick,
  variant = 'default',
  className = '' 
}) {
  const {
    id,
    xref,
    name,
    givenName,
    surname,
    birthDate,
    birthPlace,
    deathDate,
    deathPlace,
    gender,
    isLiving,
    photoUrl,
    relationships,
  } = person;

  const isCompact = variant === 'compact';
  const displayName = name || `${givenName || ''} ${surname || ''}`.trim() || 'Unknown';

  const personLink = treeId && id 
    ? `/trees/${treeId}/individuals/${id}`
    : null;

  return (
    <BaseCard
      clickable={!!onClick || !!personLink}
      onClick={onClick}
      hoverable
      className={className}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-base-content/10"
              />
            ) : (
              <Avatar name={displayName} size="lg" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EntityIcon entityType="individual" size="sm" />
              {gender && (
                <Badge 
                  variant={gender === 'M' ? 'info' : gender === 'F' ? 'accent' : 'default'} 
                  size="sm"
                >
                  {gender === 'M' ? '♂' : gender === 'F' ? '♀' : '?'}
                </Badge>
              )}
              {isLiving !== undefined && (
                <Badge variant={isLiving ? 'success' : 'default'} size="sm">
                  {isLiving ? 'Living' : 'Deceased'}
                </Badge>
              )}
            </div>
            {personLink ? (
              <Link
                href={personLink}
                className="text-lg font-semibold link link-hover link-primary truncate block"
                onClick={(e) => {
                  if (onClick) {
                    e.preventDefault();
                    onClick();
                  }
                }}
              >
                {displayName}
              </Link>
            ) : (
              <h3 className="text-lg font-semibold text-base-content truncate">{displayName}</h3>
            )}
            {xref && <p className="text-xs text-base-content/50 mt-0.5">{xref}</p>}
          </div>
        </div>

        {/* Life Events */}
        {!isCompact && (
          <div className="space-y-1.5 text-sm">
            {birthDate && (
              <div className="flex items-center gap-2 text-base-content/70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Born: {birthDate}{birthPlace ? ` in ${birthPlace}` : ''}</span>
              </div>
            )}
            {deathDate && (
              <div className="flex items-center gap-2 text-base-content/70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Died: {deathDate}{deathPlace ? ` in ${deathPlace}` : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Relationships */}
        {!isCompact && relationships && (
          <div className="pt-2 border-t border-base-content/10">
            <div className="flex items-center gap-4 text-xs text-base-content/60">
              {relationships.spouses > 0 && (
                <span>{relationships.spouses} {relationships.spouses === 1 ? 'spouse' : 'spouses'}</span>
              )}
              {relationships.children > 0 && (
                <span>{relationships.children} {relationships.children === 1 ? 'child' : 'children'}</span>
              )}
              {relationships.parents > 0 && (
                <span>{relationships.parents} {relationships.parents === 1 ? 'parent' : 'parents'}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
}

