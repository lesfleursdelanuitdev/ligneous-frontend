'use client';

/**
 * Badge Component
 * DaisyUI badge with variant mapping: default, success, warning, error, info, accent
 */
export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}) {
  const variantMap = {
    default: 'badge-ghost',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    accent: 'badge-primary',
  };
  const sizeMap = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg',
  };

  return (
    <span
      className={`badge ${variantMap[variant] || variantMap.default} ${sizeMap[size] || ''} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

