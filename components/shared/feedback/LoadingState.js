'use client';

/**
 * LoadingState Component
 * Displays a loading spinner with optional message (DaisyUI)
 */
export default function LoadingState({ 
  message, 
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'loading-sm',
    md: '',
    lg: 'loading-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <span className={`loading loading-spinner text-primary ${sizeClasses[size]}`} />
      {message && (
        <p className="mt-4 text-sm text-base-content/60">
          {message}
        </p>
      )}
    </div>
  );
}

