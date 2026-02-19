'use client';

/**
 * ErrorState Component
 * Displays an error message with optional retry action (DaisyUI)
 */
export default function ErrorState({ 
  title = 'Something went wrong',
  message,
  onRetry,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <svg
        className="w-12 h-12 text-error"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-base-content">
        {title}
      </h3>
      {message && (
        <p className="mt-2 text-sm text-base-content/60 max-w-sm">
          {message}
        </p>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-6 btn btn-primary">
          Try Again
        </button>
      )}
    </div>
  );
}

