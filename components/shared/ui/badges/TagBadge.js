'use client';

import Badge from './Badge';

/**
 * TagBadge Component
 * Specialized badge for tags with optional color and remove action
 * 
 * @param {Object} props
 * @param {string} props.name - Tag name
 * @param {string} props.color - Hex color for the badge
 * @param {boolean} props.removable - Show remove button
 * @param {Function} props.onRemove - Callback when remove is clicked
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 */
export default function TagBadge({ 
  name, 
  color, 
  removable = false, 
  onRemove,
  size = 'md',
  className = '' 
}) {
  const customColorStyle = color 
    ? { backgroundColor: `${color}20`, color: color, borderColor: color }
    : {};

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-3 py-1.5' : 'text-sm px-2.5 py-1'}
        ${className}
      `}
      style={customColorStyle}
    >
      <span>{name}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-70 transition-opacity"
          aria-label={`Remove ${name} tag`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

