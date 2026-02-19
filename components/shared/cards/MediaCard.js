'use client';

import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import { EntityIcon } from '../ui/metadata';

/**
 * MediaCard Component
 * Card for displaying media files
 * 
 * @param {Object} props
 * @param {Object} props.media - Media object
 * @param {string} props.treeId - Tree ID for links
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function MediaCard({ 
  media, 
  treeId,
  onClick,
  className = '' 
}) {
  const {
    id,
    title,
    description,
    filePath,
    thumbnailPath,
    mimeType,
    fileSize,
    width,
    height,
    createdAt,
    associations = [],
  } = media;

  const isImage = mimeType?.startsWith('image/');
  const isVideo = mimeType?.startsWith('video/');
  const isAudio = mimeType?.startsWith('audio/');
  const isDocument = mimeType?.startsWith('application/') || mimeType?.includes('pdf') || mimeType?.includes('document');

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <BaseCard
      clickable={!!onClick}
      onClick={onClick}
      hoverable
      className={className}
    >
      <div className="space-y-3">
        {/* Thumbnail/Preview */}
        {thumbnailPath || (isImage && filePath) ? (
          <div className="relative w-full h-48 bg-base-200 rounded-lg overflow-hidden">
            <img
              src={thumbnailPath || filePath}
              alt={title || 'Media'}
              className="w-full h-full object-cover"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-base-200 rounded-lg flex items-center justify-center">
            <EntityIcon entityType="media" size="lg" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EntityIcon entityType="media" size="sm" />
              {isImage && <Badge variant="info" size="sm">Image</Badge>}
              {isVideo && <Badge variant="accent" size="sm">Video</Badge>}
              {isAudio && <Badge variant="default" size="sm">Audio</Badge>}
              {isDocument && <Badge variant="warning" size="sm">Document</Badge>}
            </div>
            {title && (
              <h3 className="text-base font-semibold text-base-content truncate">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-base-content/70 line-clamp-2 mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-base-content/60">
          {fileSize && (
            <span>{formatFileSize(fileSize)}</span>
          )}
          {width && height && (
            <span>{width} × {height}</span>
          )}
          {mimeType && (
            <span className="truncate">{mimeType}</span>
          )}
        </div>

        {/* Associations */}
        {associations.length > 0 && (
          <div className="pt-2 border-t border-base-content/10">
            <div className="text-xs text-base-content/60">
              Associated with {associations.length} {associations.length === 1 ? 'entity' : 'entities'}
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
}

