/**
 * Errors Facet
 * Centralized error handling and collection
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';

const initialState = {
  // Current errors by facet
  errors: {},  // { facetName: { message, type, timestamp, action, context } }
  
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
 * Errors Facet Hook
 */
export const useErrors = createHook({
  kind: 'errors',
  version: '1.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const listeners = subsystem.find('listeners');
    const state = { ...initialState };

    /**
     * Categorize error by type
     */
    const categorizeError = (errorData) => {
      const error = errorData.originalError || errorData;
      
      // Check for HTTP error response
      if (error.response) {
        const status = error.response.status;
        if (status >= 500) return 'server';
        if (status === 401 || status === 403) return 'auth';
        if (status === 404) return 'notFound';
        if (status >= 400) return 'client';
        return 'api';
      }
      
      // Check error message for patterns
      const message = (error.message || error.error || '').toLowerCase();
      if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
        return 'network';
      }
      if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
        return 'validation';
      }
      if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
        return 'auth';
      }
      
      return 'unknown';
    };

    /**
     * Emit state change event
     */
    const emitStateChange = () => {
      if (listeners && listeners.hasListeners()) {
        listeners.emit('errors:stateChanged', {
          type: 'errors:stateChanged',
          body: getState()
        });
      }
    };

    /**
     * Record error from event
     */
    const recordError = (facetName, errorData) => {
      const errorMessage = errorData.error || errorData.message || 'Unknown error';
      const errorType = categorizeError(errorData);
      
      const error = {
        message: errorMessage,
        type: errorType,
        timestamp: new Date().toISOString(),
        action: errorData.action || 'unknown',
        facet: facetName,
        originalError: errorData.originalError,  // For debugging
        context: errorData.context || {},        // Additional context
        severity: errorData.severity || (errorType === 'server' || errorType === 'network' ? 'error' : 'warning'),
        recoverable: errorData.recoverable !== false,
        retryable: errorData.retryable || (errorType === 'server' || errorType === 'network'),
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
      state.stats.byType[errorType] = (state.stats.byType[errorType] || 0) + 1;
      state.stats.byFacet[facetName] = (state.stats.byFacet[facetName] || 0) + 1;
      state.stats.byAction[error.action] = (state.stats.byAction[error.action] || 0) + 1;

      // Emit error recorded event
      if (listeners && listeners.hasListeners()) {
        listeners.emit('errors:error:recorded', {
          type: 'errors:error:recorded',
          body: { error, facet: facetName }
        });
      }

      // Auto-add notification for errors
      if (error.severity === 'error') {
        addNotification(error, {
          autoDismiss: errorType !== 'server' && errorType !== 'network',
          dismissAfter: errorType === 'server' || errorType === 'network' ? 10000 : 5000,
        });
      }

      emitStateChange();
    };

    /**
     * Setup error listeners for all facets
     * This will be called after system initialization
     */
    const setupErrorListeners = () => {
      if (!listeners || !listeners.hasListeners()) {
        console.warn('[Errors] Listeners not available, cannot setup error listeners');
        return;
      }

      // List of facets that emit error events
      const facetErrorEvents = [
        'auth:error',
        'gedcomFiles:error',
        'gedcomIndividuals:error',
        'gedcomFamilies:error',
        'gedcomGraph:error',
        'gedcomDuplicates:error',
        'albums:error',
        'tags:error',
        'familyTreeVisualizer:error',
      ];

      // Register listeners for each facet's error events
      facetErrorEvents.forEach(eventType => {
        const facetName = eventType.split(':')[0];
        
        listeners.on(eventType, (event) => {
          console.log(`[Errors] Received error event: ${eventType}`, event.body);
          recordError(facetName, event.body);
        });
      });

      // Also listen to generic 'error' events (fallback)
      listeners.on('error', (event) => {
        // Try to extract facet name from context or use 'unknown'
        const facetName = event.body?.facet || event.body?.context?.facet || 'unknown';
        console.log(`[Errors] Received generic error event from ${facetName}`, event.body);
        recordError(facetName, event.body);
      });

      console.log('[Errors] Error listeners setup complete', {
        registeredEvents: facetErrorEvents.length + 1, // +1 for generic 'error'
      });
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
     * Get errors by action
     */
    const getErrorsByAction = (action) => {
      return state.history.filter(e => e.action === action);
    };

    /**
     * Add error notification
     */
    const addNotification = (error, options = {}) => {
      const notification = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        error,
        severity: options.severity || error.severity || 'error',
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
      const beforeCount = state.notifications.length;
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
      
      if (state.notifications.length !== beforeCount) {
        emitStateChange();
      }
    };

    /**
     * Dismiss all notifications
     */
    const dismissAllNotifications = () => {
      state.notifications = [];
      emitStateChange();
    };

    /**
     * Clear error history
     */
    const clearHistory = () => {
      state.history = [];
      state.stats = {
        total: 0,
        byType: {},
        byFacet: {},
        byAction: {},
      };
      emitStateChange();
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

    // Setup error listeners after a short delay to ensure listeners are enabled
    // This will be called in onInit callback
    const initialize = () => {
      // Wait a bit for listeners to be fully enabled
      setTimeout(() => {
        setupErrorListeners();
      }, 100);
    };

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
      getErrorsByAction,
      clearHistory,
      
      // Notifications
      addNotification,
      dismissNotification,
      dismissAllNotifications,
      
      // State
      getState,
      
      // Initialization (for system builder)
      initialize,
    });
  }
});

export default useErrors;

