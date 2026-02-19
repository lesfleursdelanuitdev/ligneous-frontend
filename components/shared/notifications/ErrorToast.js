'use client';

import { useEffect, useState } from 'react';

/**
 * ErrorToast Component
 * Individual error notification toast
 * 
 * @param {Object} props
 * @param {Object} props.error - Error object from errors facet
 * @param {string} props.severity - Error severity ('error', 'warning', 'info')
 * @param {boolean} props.retryable - Whether the error can be retried
 * @param {Function} props.onDismiss - Callback when toast is dismissed
 * @param {Function} props.onRetry - Optional retry callback
 * @param {string} props.className - Additional CSS classes
 */
export default function ErrorToast({
  error,
  severity = 'error',
  retryable = false,
  onDismiss,
  onRetry,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss();
      }
    }, 300); // Animation duration
  };

  // Auto-dismiss for non-critical errors
  useEffect(() => {
    if (severity === 'info' || (severity === 'warning' && !retryable)) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          if (onDismiss) {
            onDismiss();
          }
        }, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [severity, retryable, onDismiss]);

  if (!isVisible) {
    return null;
  }

  const severityAlert = {
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  };
  const alertClass = severityAlert[severity] || severityAlert.error;

  const iconPaths = {
    error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  const iconPath = iconPaths[severity] || iconPaths.error;

  // Format error message
  const errorMessage = error?.message || error?.error || 'An error occurred';
  const errorAction = error?.action ? `${error.action}` : '';
  const errorFacet = error?.facet ? `${error.facet}` : '';

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div
      className={`
        alert ${alertClass}
        relative flex items-start gap-3 p-4 rounded-box shadow-lg min-w-[320px] max-w-md
        transform transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Error source */}
            {(errorFacet || errorAction) && (
              <div className="text-xs font-medium mb-1 opacity-75">
                {errorFacet && <span className="capitalize">{errorFacet}</span>}
                {errorFacet && errorAction && <span> • </span>}
                {errorAction && <span className="lowercase">{errorAction}</span>}
              </div>
            )}

            {/* Error message */}
            <p className="text-sm font-medium leading-5">
              {errorMessage}
            </p>

            {/* Timestamp */}
            {error?.timestamp && (
              <p className="text-xs mt-1 opacity-60">
                {formatTime(error.timestamp)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn-ghost btn-sm btn-square flex-shrink-0"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {retryable && onRetry && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => { onRetry(); handleDismiss(); }}
              className="btn btn-sm"
            >
              Retry
            </button>
            <button type="button" onClick={handleDismiss} className="btn btn-ghost btn-sm">
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

