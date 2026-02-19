# Error Handling Facet Analysis

## Current State

### Error Handling Patterns

**1. Per-Facet Error State**
```javascript
// Each facet maintains its own error
const state = {
  loading: false,
  error: null,  // ❌ Duplicated in every facet
  // ... other state
};

// Each facet has clearError()
const clearError = () => {
  state.error = null;
  emitStateChange();
};
```

**2. Shared Error Handling Utility**
```javascript
// utils/gedcom-api.js
export const handleApiError = (error, state, emitEvent, emitStateChange, action) => {
  state.loading = false;
  state.error = error.message;
  emitStateChange();
  emitEvent('error', { error: error.message, action });
};
```

**3. Error Events**
```javascript
// Facets emit error events
emitEvent('gedcomFiles:error', { error: error.message, action: 'uploadGedcom' });
emitEvent('auth:error', { error: error.message, action: 'login' });
```

### Problems with Current Approach

1. **Duplication** - Every facet has `error` state and `clearError()` method
2. **Inconsistent Error Format** - Different facets format errors differently
3. **No Global Error View** - Can't see all errors across facets
4. **No Error History** - Errors are lost when cleared
5. **No Error Categorization** - Can't distinguish API errors from validation errors
6. **No Error Recovery** - No automatic retry or recovery strategies
7. **No Error Analytics** - Can't track error patterns

---

## Proposed: `useErrors` Facet

### Purpose

Centralized error handling that:
- Collects errors from all facets
- Categorizes errors by type and source
- Provides error history and analytics
- Enables global error notifications
- Supports error recovery strategies

---

## Design Options

### Option 1: Event-Based Error Collection (Recommended)

**Approach:** Facets emit error events, `useErrors` listens and collects them.

**Pros:**
- ✅ Decoupled - facets don't need to depend on `useErrors`
- ✅ Flexible - facets can still have their own error state
- ✅ Non-breaking - existing code continues to work
- ✅ Reactive - errors automatically collected

**Cons:**
- ⚠️ Requires facets to emit error events (some might not)
- ⚠️ Event format must be standardized

**Sample Implementation:**

```javascript
/**
 * Errors Facet
 * Centralized error handling and collection
 */
export const useErrors = createHook({
  kind: 'errors',
  version: '1.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const listeners = subsystem.find('listeners');
    
    const state = {
      // Current errors by facet
      errors: {},  // { facetName: { message, type, timestamp, action } }
      
      // Error history (last N errors)
      history: [],
      maxHistorySize: 50,
      
      // Error statistics
      stats: {
        total: 0,
        byType: {},      // { 'api': 10, 'validation': 5, 'network': 3 }
        byFacet: {},    // { 'auth': 5, 'gedcomFiles': 8 }
        byAction: {},   // { 'login': 2, 'uploadGedcom': 3 }
      },
      
      // Error notifications
      notifications: [],  // Active error notifications
    };

    /**
     * Categorize error by type
     */
    const categorizeError = (error) => {
      if (error.response) {
        // HTTP error response
        if (error.response.status >= 500) return 'server';
        if (error.response.status === 401 || error.response.status === 403) return 'auth';
        if (error.response.status === 404) return 'notFound';
        if (error.response.status >= 400) return 'client';
        return 'api';
      }
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        return 'network';
      }
      if (error.message?.includes('validation') || error.message?.includes('invalid')) {
        return 'validation';
      }
      return 'unknown';
    };

    /**
     * Record error from event
     */
    const recordError = (facetName, errorData) => {
      const error = {
        message: errorData.error || errorData.message || 'Unknown error',
        type: categorizeError(errorData),
        timestamp: new Date().toISOString(),
        action: errorData.action || 'unknown',
        facet: facetName,
        originalError: errorData.originalError,  // For debugging
        context: errorData.context || {},        // Additional context
      };

      // Update current errors
      state.errors[facetName] = error;

      // Add to history
      state.history.unshift(error);
      if (state.history.length > state.maxHistorySize) {
        state.history.pop();
      }

      // Update statistics
      state.stats.total++;
      state.stats.byType[error.type] = (state.stats.byType[error.type] || 0) + 1;
      state.stats.byFacet[facetName] = (state.stats.byFacet[facetName] || 0) + 1;
      state.stats.byAction[error.action] = (state.stats.byAction[error.action] || 0) + 1;

      // Emit error recorded event
      if (listeners) {
        listeners.emit('errors:error:recorded', {
          type: 'errors:error:recorded',
          body: { error, facet: facetName }
        });
      }

      // Emit state change
      emitStateChange();
    };

    /**
     * Listen to error events from all facets
     */
    const setupErrorListeners = () => {
      // Listen to all facet error events
      const facetErrorPattern = /^(\w+):error$/;
      
      // We'll need to register listeners for each facet
      // This could be done dynamically or explicitly
      
      // Example: Listen to auth errors
      listeners.on('auth:error', (event) => {
        recordError('auth', event.body);
      });
      
      // Example: Listen to gedcomFiles errors
      listeners.on('gedcomFiles:error', (event) => {
        recordError('gedcomFiles', event.body);
      });
      
      // ... etc for all facets
    };

    /**
     * Clear error for a specific facet
     */
    const clearError = (facetName) => {
      if (state.errors[facetName]) {
        delete state.errors[facetName];
        emitStateChange();
      }
    };

    /**
     * Clear all errors
     */
    const clearAllErrors = () => {
      state.errors = {};
      emitStateChange();
    };

    /**
     * Get error for a facet
     */
    const getError = (facetName) => {
      return state.errors[facetName] || null;
    };

    /**
     * Get all current errors
     */
    const getAllErrors = () => {
      return { ...state.errors };
    };

    /**
     * Get error history
     */
    const getHistory = (limit = 10) => {
      return state.history.slice(0, limit);
    };

    /**
     * Get error statistics
     */
    const getStats = () => {
      return { ...state.stats };
    };

    /**
     * Get errors by type
     */
    const getErrorsByType = (type) => {
      return state.history.filter(e => e.type === type);
    };

    /**
     * Get errors by facet
     */
    const getErrorsByFacet = (facetName) => {
      return state.history.filter(e => e.facet === facetName);
    };

    /**
     * Add error notification
     */
    const addNotification = (error, options = {}) => {
      const notification = {
        id: `error-${Date.now()}-${Math.random()}`,
        error,
        severity: options.severity || 'error',  // 'error', 'warning', 'info'
        autoDismiss: options.autoDismiss !== false,
        dismissAfter: options.dismissAfter || 5000,
        timestamp: new Date().toISOString(),
      };
      
      state.notifications.push(notification);
      emitStateChange();
      
      // Auto-dismiss if enabled
      if (notification.autoDismiss) {
        setTimeout(() => {
          dismissNotification(notification.id);
        }, notification.dismissAfter);
      }
      
      return notification.id;
    };

    /**
     * Dismiss notification
     */
    const dismissNotification = (notificationId) => {
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
      emitStateChange();
    };

    /**
     * Dismiss all notifications
     */
    const dismissAllNotifications = () => {
      state.notifications = [];
      emitStateChange();
    };

    /**
     * Emit state change
     */
    const emitStateChange = () => {
      if (listeners) {
        listeners.emit('errors:stateChanged', {
          type: 'errors:stateChanged',
          body: getState()
        });
      }
    };

    /**
     * Get state
     */
    const getState = () => {
      return {
        errors: { ...state.errors },
        history: [...state.history],
        stats: { ...state.stats },
        notifications: [...state.notifications],
      };
    };

    // Setup error listeners after system is built
    // This would need to be called in onInit or similar
    
    return new Facet('errors', {
      attach: true,
      source: import.meta.url
    }).add({
      // Error management
      getError,
      getAllErrors,
      clearError,
      clearAllErrors,
      
      // History and analytics
      getHistory,
      getStats,
      getErrorsByType,
      getErrorsByFacet,
      
      // Notifications
      addNotification,
      dismissNotification,
      dismissAllNotifications,
      
      // State
      getState,
    });
  }
});
```

### Option 2: Dependency-Based Error Reporting

**Approach:** Facets depend on `useErrors` and call methods directly.

**Pros:**
- ✅ Direct control - facets explicitly report errors
- ✅ Type-safe - can validate error format
- ✅ Immediate - no event delay

**Cons:**
- ❌ Tight coupling - all facets must depend on `useErrors`
- ❌ Breaking change - requires updating all facets
- ❌ Less flexible - harder to add error sources later

**Sample Implementation:**

```javascript
// In a facet that depends on useErrors
export const useGedcomFiles = createHook({
  kind: 'gedcomFiles',
  required: ['listeners', 'errors'],  // ✅ Depend on errors
  // ...
  
  fn: (ctx, api, subsystem) => {
    const listeners = subsystem.find('listeners');
    const errors = subsystem.find('errors');  // ✅ Get errors facet
    
    // ...
    
    const uploadGedcom = async (file, name) => {
      try {
        // ... upload logic
      } catch (error) {
        // ✅ Report to errors facet
        errors.reportError('gedcomFiles', {
          error: error.message,
          action: 'uploadGedcom',
          originalError: error,
          context: { fileName: name }
        });
        throw error;
      }
    };
  }
});
```

### Option 3: Hybrid Approach (Best of Both)

**Approach:** Support both event-based and direct reporting.

**Pros:**
- ✅ Flexible - facets can choose their approach
- ✅ Backward compatible - existing event-based code works
- ✅ Progressive - can migrate to direct reporting over time

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Two ways to do the same thing (could be confusing)

---

## Recommended: Option 1 (Event-Based)

### Why Event-Based?

1. **Non-Breaking** - Existing facets don't need changes
2. **Decoupled** - Facets don't need to depend on `useErrors`
3. **Flexible** - Can add error sources without modifying facets
4. **Reactive** - Errors automatically collected

### Implementation Strategy

**Phase 1: Create `useErrors` Facet**
- Listen to error events from facets
- Collect and categorize errors
- Provide error history and stats

**Phase 2: Standardize Error Events**
- Create error event format specification
- Update `handleApiError` utility to emit standardized events
- Document error event contract

**Phase 3: Add Error Notifications**
- Create error notification system
- Add UI component for error notifications
- Integrate with existing notification system

**Phase 4: Add Error Recovery**
- Implement retry strategies
- Add error recovery helpers
- Document recovery patterns

---

## Error Event Format Specification

### Standard Error Event

```javascript
{
  type: 'facetName:error',  // Event type
  body: {
    error: 'Error message',           // Required: Error message
    action: 'actionName',             // Required: Action that failed
    originalError: Error,              // Optional: Original error object
    context: {                         // Optional: Additional context
      fileId: '123',
      userId: '456',
      // ... any relevant context
    },
    severity: 'error',                 // Optional: 'error', 'warning', 'info'
    recoverable: true,                  // Optional: Can error be recovered?
    retryable: true,                    // Optional: Can action be retried?
  }
}
```

### Example: Updated `handleApiError` Utility

```javascript
/**
 * Standardized error handling for API calls
 */
export const handleApiError = (error, state, emitEvent, emitStateChange, action, context = {}) => {
  state.loading = false;
  
  // Extract error message
  const errorMessage = error.response?.data?.error 
    || error.response?.data?.message 
    || error.message 
    || 'Unknown error';
  
  state.error = errorMessage;
  
  // Emit standardized error event
  emitEvent('error', {
    error: errorMessage,
    action,
    originalError: error,
    context: {
      ...context,
      status: error.response?.status,
      statusText: error.response?.statusText,
    },
    severity: error.response?.status >= 500 ? 'error' : 'warning',
    recoverable: error.response?.status !== 401 && error.response?.status !== 403,
    retryable: error.response?.status >= 500 || error.message?.includes('network'),
  });
  
  emitStateChange();
};
```

---

## Usage Examples

### 1. Component Listening to Errors

```javascript
'use client';

import { useFacet, useListener } from 'mycelia-kernel-plugin/react';

export default function ErrorNotificationPanel() {
  const errors = useFacet('errors');
  const [notifications, setNotifications] = useState([]);
  
  // Listen to error notifications
  useListener('errors:stateChanged', (event) => {
    setNotifications(event.body.notifications);
  });
  
  // Get all current errors
  const allErrors = errors.getAllErrors();
  
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

### 2. Facet Reporting Error (Event-Based)

```javascript
// In gedcomFiles facet
const uploadGedcom = async (file, name) => {
  try {
    // ... upload logic
  } catch (error) {
    // Use existing handleApiError (which emits event)
    handleApiError(error, state, emitEvent, emitStateChange, 'uploadGedcom', {
      fileName: name,
      fileSize: file.size,
    });
    throw error;
  }
};

// useErrors facet automatically collects via event listener
```

### 3. Getting Error Statistics

```javascript
const errors = useFacet('errors');
const stats = errors.getStats();

console.log(`Total errors: ${stats.total}`);
console.log(`API errors: ${stats.byType.api}`);
console.log(`Auth errors: ${stats.byFacet.auth}`);
```

### 4. Error History

```javascript
const errors = useFacet('errors');
const recentErrors = errors.getHistory(10);

recentErrors.forEach(error => {
  console.log(`${error.timestamp}: ${error.facet}.${error.action} - ${error.message}`);
});
```

### 5. Error Recovery

```javascript
const errors = useFacet('errors');
const error = errors.getError('gedcomFiles');

if (error && error.retryable) {
  // Show retry button
  <button onClick={() => retryUpload()}>
    Retry Upload
  </button>
}
```

---

## Integration with Existing Facets

### Minimal Changes Required

**1. Update `handleApiError` utility:**
```javascript
// utils/gedcom-api.js
export const handleApiError = (error, state, emitEvent, emitStateChange, action, context = {}) => {
  // ... existing code ...
  
  // Emit standardized error event (useErrors will listen)
  emitEvent('error', {
    error: errorMessage,
    action,
    originalError: error,
    context,
    // ... other fields
  });
};
```

**2. Facets continue using `handleApiError`:**
```javascript
// No changes needed in facets!
catch (error) {
  handleApiError(error, state, emitEvent, emitStateChange, 'uploadGedcom');
  throw error;
}
```

**3. `useErrors` listens to all error events:**
```javascript
// Automatically collects errors from all facets
listeners.on('auth:error', (event) => recordError('auth', event.body));
listeners.on('gedcomFiles:error', (event) => recordError('gedcomFiles', event.body));
// ... etc
```

---

## Benefits

### 1. Centralized Error Management
- Single place to view all errors
- Consistent error format
- Error history and analytics

### 2. Better User Experience
- Global error notifications
- Error recovery options
- Clear error messages

### 3. Developer Experience
- Error debugging tools
- Error statistics
- Error patterns analysis

### 4. Non-Breaking
- Existing code continues to work
- Gradual adoption
- No forced migration

---

## Potential Issues & Solutions

### Issue 1: Event Name Conflicts

**Problem:** Different facets might emit errors with different event names.

**Solution:** Standardize on `facetName:error` pattern and document it.

### Issue 2: Error Event Volume

**Problem:** Too many error events could impact performance.

**Solution:** 
- Throttle error collection
- Limit history size
- Batch error updates

### Issue 3: Memory Leaks

**Problem:** Error history could grow unbounded.

**Solution:**
- Limit history size (e.g., last 50 errors)
- Auto-clear old errors
- Configurable limits

### Issue 4: Duplicate Errors

**Problem:** Same error might be recorded multiple times.

**Solution:**
- Deduplicate by error message + facet + action
- Add timestamp window for duplicates
- Configurable deduplication

---

## Next Steps

1. **Create `useErrors` facet** (Option 1: Event-Based)
2. **Update `handleApiError` utility** to emit standardized events
3. **Add error listeners** for all existing facets
4. **Create error notification UI component**
5. **Add error statistics dashboard** (optional)
6. **Document error event contract**
7. **Add tests** for error collection and categorization

---

## Conclusion

A centralized `useErrors` facet would provide:
- ✅ **Centralized error management** without breaking existing code
- ✅ **Error history and analytics** for debugging
- ✅ **Global error notifications** for better UX
- ✅ **Error recovery strategies** for better resilience

**Recommended Approach:** Event-based error collection (Option 1) because it's:
- Non-breaking
- Decoupled
- Flexible
- Reactive

