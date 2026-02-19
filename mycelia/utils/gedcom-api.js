/**
 * GEDCOM API Shared Utilities
 * Common functions shared across all GEDCOM facets
 */

/**
 * Create an event emitter function with defensive checks
 * @param {Object} listeners - The listeners facet
 * @returns {Function} Function to emit events
 */
export const createEmitEvent = (listeners) => {
  return (eventType, body) => {
    if (listeners && listeners.hasListeners()) {
      listeners.emit(eventType, {
        type: eventType,
        body
      });
    }
  };
};

/**
 * Create a state change emitter function for a specific facet
 * @param {Object} listeners - The listeners facet
 * @param {string} facetName - Name of the facet (e.g., 'gedcomFiles')
 * @param {Function} getState - Function that returns the current state
 * @returns {Function} Function to emit state change events
 */
export const createEmitStateChange = (listeners, facetName, getState) => {
  const emitEvent = createEmitEvent(listeners);
  
  return () => {
    const state = getState();
    emitEvent(`${facetName}:stateChanged`, state);
  };
};

/**
 * Create an API request wrapper with consistent error handling
 * @param {string} baseURL - Base URL for the API
 * @returns {Function} Function to make API requests
 */
export const createApiRequest = (baseURL) => {
  return async (path, options = {}) => {
    const url = `${baseURL}${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data; // Return data.data if available, otherwise data
  };
};

/**
 * Standardized error handling for API calls
 * @param {Error} error - The error object
 * @param {Object} state - The state object to update
 * @param {Function} emitEvent - Function to emit events
 * @param {Function} emitStateChange - Function to emit state changes
 * @param {string} action - The action that failed
 * @param {Object} context - Additional context for the error
 */
export const handleApiError = (error, state, emitEvent, emitStateChange, action, context = {}) => {
  state.loading = false;
  
  // Extract error message
  const errorMessage = error.response?.data?.error 
    || error.response?.data?.message 
    || error.message 
    || 'Unknown error';
  
  state.error = errorMessage;
  
  // Determine error type and severity
  const status = error.response?.status;
  let errorType = 'unknown';
  let severity = 'error';
  let recoverable = true;
  let retryable = false;
  
  if (status) {
    if (status >= 500) {
      errorType = 'server';
      severity = 'error';
      retryable = true;
    } else if (status === 401 || status === 403) {
      errorType = 'auth';
      severity = 'warning';
      recoverable = false;
    } else if (status === 404) {
      errorType = 'notFound';
      severity = 'warning';
    } else if (status >= 400) {
      errorType = 'client';
      severity = 'warning';
    } else {
      errorType = 'api';
    }
  } else if (error.message?.toLowerCase().includes('network') || 
             error.message?.toLowerCase().includes('fetch') ||
             error.message?.toLowerCase().includes('timeout')) {
    errorType = 'network';
    severity = 'error';
    retryable = true;
  }
  
  // Emit standardized error event (useErrors facet will collect it)
  emitEvent('error', {
    error: errorMessage,
    action,
    originalError: error,
    context: {
      ...context,
      status: error.response?.status,
      statusText: error.response?.statusText,
    },
    severity,
    recoverable,
    retryable,
    type: errorType,
  });
  
  emitStateChange();
};

/**
 * Build query string from params object
 * @param {Object} params - Parameters to convert to query string
 * @returns {string} Query string (with leading ? if not empty)
 */
export const buildQueryString = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Create a standard loading state updater
 * @param {Object} state - The state object
 * @param {Function} emitStateChange - Function to emit state changes
 * @returns {Function} Function to set loading state
 */
export const createLoadingUpdater = (state, emitStateChange) => {
  return (loading) => {
    state.loading = loading;
    if (loading) {
      state.error = null; // Clear error when starting new operation
    }
    emitStateChange();
  };
};

