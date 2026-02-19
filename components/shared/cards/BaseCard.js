'use client';

/**
 * BaseCard Component
 * Generic card component with variants and hover effects
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - Variant: 'default', 'outlined', 'elevated', 'flat'
 * @param {boolean} props.hoverable - Enable hover effect
 * @param {boolean} props.clickable - Make card clickable
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function BaseCard({ 
  children, 
  variant = 'default',
  hoverable = false,
  clickable = false,
  onClick,
  className = '' 
}) {
  const variantStyles = {
    default: 'bg-base-100 border border-base-content/10',
    outlined: 'bg-transparent border-2 border-base-content/20',
    elevated: 'bg-base-100 shadow-md',
    flat: 'bg-base-200 border-0',
  };

  const hoverStyles = hoverable || clickable
    ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5'
    : '';

  const clickableStyles = clickable ? 'cursor-pointer' : '';

  return (
    <div
      className={`
        rounded-box p-4
        ${variantStyles[variant] || variantStyles.default}
        ${hoverStyles}
        ${clickableStyles}
        ${className}
      `}
      onClick={clickable && onClick ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      {children}
    </div>
  );
}

