'use client';

/**
 * Avatar Component
 * User avatar with image or initials fallback
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text
 * @param {string} props.name - Name for initials fallback
 * @param {string} props.size - Size: 'sm', 'md', 'lg', 'xl'
 * @param {string} props.className - Additional CSS classes
 */
export default function Avatar({ 
  src, 
  alt, 
  name, 
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full bg-base-200
        flex items-center justify-center
        font-medium text-base-content/70
        overflow-hidden flex-shrink-0
        ${className}
      `}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

