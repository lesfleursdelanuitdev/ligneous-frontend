'use client';

import Link from 'next/link';
import { Users, Heart, MapPin, Calendar, BookOpen, FileText, Search, KeyRound } from 'lucide-react';

/**
 * TreeCard - Displays a family tree with mini pedigree preview
 * 
 * Props:
 * - tree: Tree data object
 * - variant: 'default' | 'compact' | 'featured'
 * - showPreview: Whether to show the mini pedigree
 * - onRequestAccess: Callback when request access is clicked
 */
export default function TreeCard({ 
  tree,
  variant = 'default',
  showPreview = true,
  onRequestAccess,
}) {
  const {
    id,
    name,
    description,
    isPublic,
    individualsCount = 0,
    familiesCount = 0,
    placesCount = 0,
    eventsCount = 0,
    sourcesCount = 0,
    notesCount = 0,
    owner,
    updatedAt,
    focalPerson,
  } = tree;

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <div 
      className={`
        card card-interactive overflow-hidden
        ${isFeatured ? 'border-primary border-2' : ''}
      `}
    >
      {/* Mini Pedigree Preview */}
      {showPreview && !isCompact && focalPerson && (
        <div className="px-4 pt-4">
          <MiniPedigree focalPerson={focalPerson} />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                href={`/trees/${id}`}
                className="text-lg font-semibold link link-hover link-primary truncate"
              >
                {name}
              </Link>
              {isPublic ? (
                <span className="badge badge-public">🌐 Public</span>
              ) : (
                <span className="badge badge-private">🔒 Private</span>
              )}
            </div>
            {description && !isCompact && (
              <p className="text-sm text-base-content/50 mt-1 truncate-2">
                {description}
              </p>
            )}
          </div>
          {isFeatured && (
            <span className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded 
                           bg-primary text-primary-content">
              Featured
            </span>
          )}
        </div>

        {/* Stats */}
        {!isCompact && (
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm text-base-content/70 mb-3">
            <StatItem icon={Users} value={individualsCount} label="people" />
            <StatItem icon={Heart} value={familiesCount} label="families" />
            <StatItem icon={MapPin} value={placesCount} label="places" />
            <StatItem icon={Calendar} value={eventsCount} label="events" />
            <StatItem icon={BookOpen} value={sourcesCount} label="sources" />
            <StatItem icon={FileText} value={notesCount} label="notes" />
          </div>
        )}

        {/* Owner & Updated */}
        <div className="flex items-center justify-between text-xs text-base-content/50 mb-4">
          {owner && (
            <span>Created by {owner.name || owner.username}</span>
          )}
          {updatedAt && (
            <span>Updated {formatRelativeTime(updatedAt)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/trees/${id}`}
            className="btn btn-primary flex-1"
          >
            <Search className="w-4 h-4" />
            Explore
          </Link>
          {!isPublic && onRequestAccess && (
            <button
              onClick={() => onRequestAccess(tree)}
              className="btn btn-secondary"
            >
              <KeyRound className="w-4 h-4" />
              Request Access
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MiniPedigree - A simple 3-generation pedigree visualization
 */
function MiniPedigree({ focalPerson }) {
  const { name, father, mother } = focalPerson;
  
  // Get initials for the person boxes
  const getInitials = (personName) => {
    if (!personName) return '?';
    const parts = personName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return personName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative py-4 px-2">
      {/* SVG Lines connecting the boxes */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {/* Line from focal to parents junction */}
        <line 
          x1="50%" y1="72%" 
          x2="50%" y2="50%" 
          className="stroke-base-content/30" 
          strokeWidth="2"
        />
        {/* Horizontal line between parents */}
        <line 
          x1="25%" y1="50%" 
          x2="75%" y2="50%" 
          className="stroke-base-content/30" 
          strokeWidth="2"
        />
        {/* Line to father */}
        <line 
          x1="25%" y1="50%" 
          x2="25%" y2="32%" 
          className="stroke-base-content/30" 
          strokeWidth="2"
        />
        {/* Line to mother */}
        <line 
          x1="75%" y1="50%" 
          x2="75%" y2="32%" 
          className="stroke-base-content/30" 
          strokeWidth="2"
        />
      </svg>

      {/* Person boxes */}
      <div className="relative flex flex-col items-center gap-6" style={{ zIndex: 1 }}>
        {/* Parents row */}
        <div className="flex justify-between w-full px-4">
          {/* Father */}
          <PersonBox 
            name={father?.name}
            initials={getInitials(father?.name)}
            gender="male"
            label="Father"
          />
          {/* Mother */}
          <PersonBox 
            name={mother?.name}
            initials={getInitials(mother?.name)}
            gender="female"
            label="Mother"
          />
        </div>

        {/* Focal person */}
        <PersonBox 
          name={name}
          initials={getInitials(name)}
          isFocal
          label="Focal Person"
        />
      </div>
    </div>
  );
}

/**
 * PersonBox - Individual person in the pedigree
 */
function PersonBox({ name, initials, gender, isFocal, label }) {
  const bgColor = isFocal 
    ? 'bg-primary text-primary-content'
    : gender === 'male'
      ? 'bg-info text-info-content'
      : gender === 'female'
        ? 'bg-secondary text-secondary-content'
        : 'bg-base-200 text-base-content/70';

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          text-sm font-bold shadow-sm
          ${bgColor}
          ${!name ? 'opacity-50' : ''}
        `}
        title={name || 'Unknown'}
      >
        {initials}
      </div>
      {label && (
        <span className="text-[10px] text-base-content/50 mt-1 text-center">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

function StatItem({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
      <span><strong>{(value ?? 0).toLocaleString()}</strong> {label}</span>
    </div>
  );
}

/**
 * TreeCardSkeleton - Loading state for TreeCard
 */
export function TreeCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      {/* Preview skeleton */}
      <div className="h-32 bg-base-200" />
      
      {/* Content skeleton */}
      <div className="p-4">
        <div className="h-6 bg-base-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-base-200 rounded w-full mb-2" />
        <div className="h-4 bg-base-200 rounded w-2/3 mb-4" />
        <div className="flex gap-4 mb-4">
          <div className="h-4 bg-base-200 rounded w-20" />
          <div className="h-4 bg-base-200 rounded w-20" />
        </div>
        <div className="h-10 bg-base-200 rounded" />
      </div>
    </div>
  );
}


