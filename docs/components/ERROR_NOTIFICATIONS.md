# Error Notification Components

## Overview

Error notification components provide a user-friendly way to display errors from the `useErrors` facet. They automatically collect errors from all facets and display them as toast notifications.

## Components

### 1. `ErrorToast`

Individual error notification toast component.

**Props:**
- `error` (Object) - Error object from errors facet
- `severity` (string) - Error severity: 'error', 'warning', 'info'
- `retryable` (boolean) - Whether the error can be retried
- `onDismiss` (Function) - Callback when toast is dismissed
- `onRetry` (Function) - Optional retry callback
- `className` (string) - Additional CSS classes

**Features:**
- Auto-dismisses after 5 seconds for info/warning errors
- Shows retry button for retryable errors
- Displays error source (facet and action)
- Shows relative timestamp
- Smooth enter/exit animations

### 2. `ErrorNotificationContainer`

Container that manages multiple error notifications from the errors facet.

**Props:**
- `position` (string) - Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
- `maxNotifications` (number) - Maximum notifications to show (default: 5)
- `className` (string) - Additional CSS classes

**Features:**
- Automatically listens to errors facet state changes
- Displays up to N notifications
- Manages notification lifecycle
- Integrates with errors facet dismiss functionality

## Usage

### Basic Setup

The `ErrorNotificationContainer` is already integrated into the app via `app/providers.js`:

```javascript
<ErrorNotificationContainer position="top-right" maxNotifications={5} />
```

### Custom Usage

If you want to add error notifications to a specific page or component:

```javascript
'use client';

import { ErrorNotificationContainer } from '@/components/shared/notifications';

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <ErrorNotificationContainer position="top-right" maxNotifications={3} />
    </div>
  );
}
```

### Manual Error Display

You can also manually display errors:

```javascript
'use client';

import { useFacet } from 'mycelia-kernel-plugin/react';
import ErrorToast from '@/components/shared/notifications/ErrorToast';

export default function ErrorDisplay() {
  const errors = useFacet('errors');
  const allErrors = errors.getAllErrors();
  
  return (
    <div>
      {Object.entries(allErrors).map(([facet, error]) => (
        <ErrorToast
          key={facet}
          error={error}
          severity={error.severity}
          retryable={error.retryable}
          onDismiss={() => errors.clearError(facet)}
          onRetry={() => {
            // Implement retry logic
            console.log('Retry:', facet, error.action);
          }}
        />
      ))}
    </div>
  );
}
```

## Error Object Structure

Errors from the errors facet have this structure:

```javascript
{
  message: 'Error message',
  type: 'server' | 'network' | 'auth' | 'validation' | 'client' | 'notFound' | 'unknown',
  timestamp: '2024-01-15T10:30:00.000Z',
  action: 'uploadGedcom',
  facet: 'gedcomFiles',
  severity: 'error' | 'warning' | 'info',
  recoverable: true | false,
  retryable: true | false,
  context: { /* additional context */ },
  originalError: Error, // Original error object
}
```

## Error Types & Colors

- **error** (red) - Critical errors (server, network)
- **warning** (yellow) - Warnings (client errors, validation)
- **info** (blue) - Informational messages

## Auto-Dismiss Behavior

- **error** severity: Does not auto-dismiss (user must dismiss manually)
- **warning** severity: Auto-dismisses after 5 seconds (unless retryable)
- **info** severity: Auto-dismisses after 5 seconds

## Retry Functionality

For retryable errors, a "Retry" button is shown. You can implement retry logic by:

1. **Listening to retry events** (recommended):
   ```javascript
   useListener('errors:retry:gedcomFiles:uploadGedcom', (event) => {
     // Retry the upload
     gedcomFiles.uploadGedcom(file, name);
   });
   ```

2. **Using onRetry callback**:
   ```javascript
   <ErrorToast
     error={error}
     retryable={error.retryable}
     onRetry={() => {
       // Retry the action
       gedcomFiles.uploadGedcom(file, name);
     }}
   />
   ```

## Styling

Error toasts use Tailwind CSS classes and support dark mode:

- **Error**: Red background with red border
- **Warning**: Yellow background with yellow border
- **Info**: Blue background with blue border

You can customize styling by passing `className` prop or modifying the component.

## Accessibility

- Uses `role="alert"` for error toasts
- Uses `aria-live="polite"` for container
- Includes `aria-label` for dismiss buttons
- Keyboard accessible (dismiss button)

## Examples

### Example 1: Display All Current Errors

```javascript
'use client';

import { useFacet } from 'mycelia-kernel-plugin/react';
import ErrorToast from '@/components/shared/notifications/ErrorToast';

export default function ErrorList() {
  const errors = useFacet('errors');
  const allErrors = errors.getAllErrors();
  
  return (
    <div className="space-y-2">
      {Object.entries(allErrors).map(([facet, error]) => (
        <ErrorToast
          key={facet}
          error={error}
          severity={error.severity}
          retryable={error.retryable}
          onDismiss={() => errors.clearError(facet)}
        />
      ))}
    </div>
  );
}
```

### Example 2: Error Statistics Dashboard

```javascript
'use client';

import { useFacet } from 'mycelia-kernel-plugin/react';

export default function ErrorDashboard() {
  const errors = useFacet('errors');
  const stats = errors.getStats();
  const history = errors.getHistory(10);
  
  return (
    <div>
      <h2>Error Statistics</h2>
      <p>Total errors: {stats.total}</p>
      <p>Server errors: {stats.byType.server || 0}</p>
      <p>Network errors: {stats.byType.network || 0}</p>
      
      <h3>Recent Errors</h3>
      <ul>
        {history.map((error, index) => (
          <li key={index}>
            {error.timestamp}: {error.facet}.{error.action} - {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Integration with Existing Notification System

The error notification system is separate from the user notification system (`NotificationPanel`):

- **Error notifications**: System errors, API failures, validation errors
- **User notifications**: Access requests, mentions, activity updates

Both can coexist in the same application.

## Troubleshooting

### Notifications not appearing?

1. Check that errors facet is initialized:
   ```javascript
   const errors = useFacet('errors');
   console.log('Errors facet:', errors);
   ```

2. Check that errors are being emitted:
   ```javascript
   // In browser console
   // Errors should be logged when they occur
   ```

3. Check that listeners are enabled:
   ```javascript
   const system = useMycelia();
   console.log('Listeners enabled:', system.listeners.hasListeners());
   ```

### Notifications appearing but not dismissing?

- Check that `onDismiss` callback is provided
- Check that errors facet `dismissNotification` is working
- Verify auto-dismiss timer is not being cleared

## Future Enhancements

Potential improvements:

1. **Error grouping** - Group similar errors together
2. **Error actions** - Custom actions per error type
3. **Error persistence** - Save errors to localStorage
4. **Error reporting** - Send errors to error tracking service
5. **Error recovery** - Automatic retry with exponential backoff

