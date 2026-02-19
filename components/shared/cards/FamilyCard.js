'use client';

import Link from 'next/link';
import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';
import Avatar from '../ui/avatars/Avatar';

/**
 * FamilyCard Component
 * Card for displaying family units
 * 
 * @param {Object} props
 * @param {Object} props.family - Family object
 * @param {string} props.treeId - Tree ID for links
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function FamilyCard({ 
  family, 
  treeId,
  onClick,
  className = '' 
}) {
  const {
    id,
    xref,
    husband,
    wife,
    children = [],
    marriageDate,
    marriagePlace,
    divorceDate,
    divorcePlace,
  } = family;

  const familyLink = treeId && id 
    ? `/trees/${treeId}/families/${id}`
    : null;

  const getPersonName = (person) => {
    if (!person) return 'Unknown';
    return person.name || `${person.givenName || ''} ${person.surname || ''}`.trim() || 'Unknown';
  };

  return (
    <BaseCard
      clickable={!!onClick || !!familyLink}
      onClick={onClick}
      hoverable
      className={className}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <EntityIcon entityType="family" size="sm" />
          <Badge variant="info" size="sm">Family</Badge>
          {xref && (
            <span className="text-xs text-base-content/60">
              {xref}
            </span>
          )}
        </div>

        {/* Spouses */}
        <div className="space-y-2">
          {husband && (
            <div className="flex items-center gap-2">
              <Avatar
                src={husband.photoUrl}
                name={getPersonName(husband)}
                size="sm"
              />
              <span className="text-sm font-medium text-base-content">
                {getPersonName(husband)}
              </span>
              <Badge variant="info" size="sm">♂</Badge>
            </div>
          )}
          {wife && (
            <div className="flex items-center gap-2">
              <Avatar
                src={wife.photoUrl}
                name={getPersonName(wife)}
                size="sm"
              />
              <span className="text-sm font-medium text-base-content">
                {getPersonName(wife)}
              </span>
              <Badge variant="accent" size="sm">♀</Badge>
            </div>
          )}
        </div>

        {/* Marriage Info */}
        {(marriageDate || marriagePlace) && (
          <div className="text-sm text-base-content/70">
            <span className="font-medium">Married:</span>{' '}
            {marriageDate || 'Date unknown'}
            {marriagePlace && ` in ${marriagePlace}`}
          </div>
        )}

        {/* Divorce Info */}
        {divorceDate && (
          <div className="text-sm text-base-content/70">
            <span className="font-medium">Divorced:</span>{' '}
            {divorceDate}
            {divorcePlace && ` in ${divorcePlace}`}
          </div>
        )}

        {/* Children */}
        {children.length > 0 && (
          <div className="pt-2 border-t border-base-content/10">
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <EntityIcon entityType="individual" size="sm" />
              <span>
                {children.length} {children.length === 1 ? 'child' : 'children'}
              </span>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
}

