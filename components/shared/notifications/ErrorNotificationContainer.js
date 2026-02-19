'use client';

import { useState, useEffect } from 'react';
import { useFacet, useListener } from 'mycelia-kernel-plugin/react';
import ErrorToast from './ErrorToast';

/**
 * ErrorNotificationContainer Component
 * Container that displays error notifications from the errors facet
 * 
 * @param {Object} props
 * @param {string} props.position - Position of notifications ('top-right', 'top-left', 'bottom-right', 'bottom-left')
 * @param {number} props.maxNotifications - Maximum number of notifications to show
 * @param {string} props.className - Additional CSS classes
 */
export default function ErrorNotificationContainer({
  position = 'top-right',
  maxNotifications = 5,
  className = '',
}) {
  const errors = useFacet('errors');
  const [notifications, setNotifications] = useState([]);

  // Listen to error state changes
  useListener('errors:stateChanged', (event) => {
    if (event.body?.notifications) {
      setNotifications(event.body.notifications.slice(0, maxNotifications));
    }
  });

  // Also check initial state
  useEffect(() => {
    if (errors) {
      const state = errors.getState();
      if (state?.notifications) {
        setNotifications(state.notifications.slice(0, maxNotifications));
      }
    }
  }, [errors, maxNotifications]);

  const handleDismiss = (notificationId) => {
    if (errors) {
      errors.dismissNotification(notificationId);
    }
  };

  const handleRetry = (error) => {
    // Emit retry event - components can listen to this
    // For now, just dismiss the notification
    // TODO: Implement actual retry logic based on error context
    console.log('[ErrorNotification] Retry requested for:', error);
    
    // You could emit a custom event here that facets can listen to
    // For example: `errors:retry:${error.facet}:${error.action}`
  };

  if (notifications.length === 0) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={`
        fixed ${positionClasses[position] || positionClasses['top-right']}
        z-[var(--z-toast)]
        flex flex-col gap-3
        pointer-events-none
        ${className}
      `}
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <ErrorToast
            error={notification.error}
            severity={notification.severity}
            retryable={notification.error?.retryable || false}
            onDismiss={() => handleDismiss(notification.id)}
            onRetry={notification.error?.retryable ? () => handleRetry(notification.error) : undefined}
          />
        </div>
      ))}
    </div>
  );
}

