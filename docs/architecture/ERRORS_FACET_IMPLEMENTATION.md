# Errors Facet Implementation

## ✅ Implementation Complete

The `useErrors` facet has been successfully implemented and integrated into the Mycelia system.

## What Was Implemented

### 1. Errors Facet (`mycelia/facets/errors.js`)

**Features:**
- ✅ Event-based error collection from all facets
- ✅ Error categorization (server, network, auth, validation, etc.)
- ✅ Error history (last 50 errors)
- ✅ Error statistics (by type, facet, action)
- ✅ Error notifications with auto-dismiss
- ✅ Error recovery flags (recoverable, retryable)

**Methods:**
- `getError(facetName)` - Get error for a specific facet
- `getAllErrors()` - Get all current errors
- `getHistory(limit)` - Get error history
- `getStats()` - Get error statistics
- `getErrorsByType(type)` - Get errors by type
- `getErrorsByFacet(facetName)` - Get errors by facet
- `getErrorsByAction(action)` - Get errors by action
- `clearError(facetName)` - Clear error for a facet
- `clearAllErrors()` - Clear all errors
- `clearHistory()` - Clear error history
- `addNotification(error, options)` - Add error notification
- `dismissNotification(id)` - Dismiss notification
- `dismissAllNotifications()` - Dismiss all notifications
- `getState()` - Get full state

### 2. Updated Error Handling Utility (`mycelia/utils/gedcom-api.js`)

**Enhanced `handleApiError` function:**
- ✅ Extracts error message from various sources
- ✅ Categorizes errors by type
- ✅ Determines severity (error/warning)
- ✅ Sets recoverable and retryable flags
- ✅ Emits standardized error events
- ✅ Includes context information

### 3. System Integration (`mycelia/system.builder.js`)

**Changes:**
- ✅ Added `useErrors` to system builder (early in chain)
- ✅ Initialized errors facet in `onInit` callback
- ✅ Error listeners setup automatically

### 4. Facet Updates

**Updated facets to emit error events:**
- ✅ `auth.js` - Emits `auth:error` events
- ✅ `gedcomFiles.js` - Emits `gedcomFiles:error` events
- ✅ `gedcomIndividuals.js` - Emits `gedcomIndividuals:error` events

**Note:** Other facets will automatically benefit from the generic `error` event listener.

## Usage Examples

### 1. Get All Current Errors

```javascript
import { useFacet } from 'mycelia-kernel-plugin/react';

function ErrorDisplay() {
  const errors = useFacet('errors');
  const allErrors = errors.getAllErrors();
  
  return (
    <div>
      {Object.entries(allErrors).map(([facet, error]) => (
        <div key={facet}>
          {facet}: {error.message}
        </div>
      ))}
    </div>
  );
}
```

### 2. Listen to Error Events

```javascript
import { useFacet, useListener } from 'mycelia-kernel-plugin/react';

function ErrorNotificationPanel() {
  const errors = useFacet('errors');
  const [notifications, setNotifications] = useState([]);
  
  useListener('errors:stateChanged', (event) => {
    setNotifications(event.body.notifications);
  });
  
  return (
    <div>
      {notifications.map(notification => (
        <ErrorToast
          key={notification.id}
          error={notification.error}
          severity={notification.severity}
          onDismiss={() => errors.dismissNotification(notification.id)}
        />
      ))}
    </div>
  );
}
```

### 3. Get Error Statistics

```javascript
const errors = useFacet('errors');
const stats = errors.getStats();

console.log(`Total errors: ${stats.total}`);
console.log(`Server errors: ${stats.byType.server}`);
console.log(`Auth errors: ${stats.byFacet.auth}`);
```

### 4. Get Error History

```javascript
const errors = useFacet('errors');
const recentErrors = errors.getHistory(10);

recentErrors.forEach(error => {
  console.log(`${error.timestamp}: ${error.facet}.${error.action} - ${error.message}`);
});
```

### 5. Clear Errors

```javascript
const errors = useFacet('errors');

// Clear error for specific facet
errors.clearError('gedcomFiles');

// Clear all errors
errors.clearAllErrors();
```

## Error Event Format

Errors are collected via standardized events:

```javascript
{
  type: 'facetName:error',  // e.g., 'auth:error', 'gedcomFiles:error'
  body: {
    error: 'Error message',
    action: 'actionName',
    originalError: Error,
    context: { /* additional context */ },
    severity: 'error' | 'warning',
    recoverable: true | false,
    retryable: true | false,
    type: 'server' | 'network' | 'auth' | 'validation' | 'client' | 'unknown',
  }
}
```

## Error Categories

- **server** - HTTP 5xx errors
- **network** - Network/fetch/timeout errors
- **auth** - HTTP 401/403 or permission errors
- **validation** - Validation/invalid input errors
- **client** - HTTP 4xx errors (except auth)
- **notFound** - HTTP 404 errors
- **api** - Other API errors
- **unknown** - Unclassified errors

## Next Steps

### Recommended Enhancements

1. **Error Notification UI Component**
   - Create `ErrorNotificationPanel` component
   - Display error toasts/notifications
   - Show retry buttons for retryable errors

2. **Error Dashboard** (Optional)
   - Admin view of error statistics
   - Error history viewer
   - Error pattern analysis

3. **Error Recovery Helpers**
   - Retry mechanism for retryable errors
   - Recovery strategies
   - User-friendly error messages

4. **Update Remaining Facets**
   - Add `facetName:error` events to all facets
   - Ensure consistent error reporting

## Testing

To test the errors facet:

1. **Trigger an error:**
   ```javascript
   const gedcomFiles = useFacet('gedcomFiles');
   try {
     await gedcomFiles.uploadGedcom(null, 'test');
   } catch (error) {
     // Error will be automatically collected
   }
   ```

2. **Check error collection:**
   ```javascript
   const errors = useFacet('errors');
   const error = errors.getError('gedcomFiles');
   console.log('Error collected:', error);
   ```

3. **View error history:**
   ```javascript
   const errors = useFacet('errors');
   const history = errors.getHistory(5);
   console.log('Recent errors:', history);
   ```

## Notes

- Errors are automatically collected from all facets that emit error events
- Error history is limited to last 50 errors (configurable)
- Notifications auto-dismiss after 5-10 seconds (configurable)
- Error statistics are updated in real-time
- All error operations are reactive (emit state change events)

