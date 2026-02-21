/**
 * GEDCOM API Shared Utilities
 * Common functions shared across all GEDCOM facets.
 *
 * All GEDCOM data is now served by Next.js API routes (Prisma) keyed by treeId.
 */

/**
 * Create an event emitter function with defensive checks
 */
export const createEmitEvent = (listeners) => {
  return (eventType, body) => {
    if (listeners && listeners.hasListeners()) {
      listeners.emit(eventType, { type: eventType, body });
    }
  };
};

/**
 * Create a state change emitter function for a specific facet
 */
export const createEmitStateChange = (listeners, facetName, getState) => {
  const emitEvent = createEmitEvent(listeners);
  return () => {
    const state = getState();
    emitEvent(`${facetName}:stateChanged`, state);
  };
};

/**
 * Get the auth token from localStorage (client-side only).
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

/**
 * Build standard headers including Authorization if a token is available.
 */
export const authHeaders = (extra = {}) => {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Authenticated fetch wrapper for Next.js API routes.
 * Throws on non-ok responses with the server error message.
 */
export const apiFetch = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: authHeaders(options.headers),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const err = new Error(errData.error || errData.message || `Request failed: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
};

/**
 * Standardized error handling for API calls
 */
export const handleApiError = (error, state, emitEvent, emitStateChange, action, context = {}) => {
  state.loading = false;

  const errorMessage = error.message || 'Unknown error';
  state.error = errorMessage;

  const status = error.status;
  let errorType = 'unknown';
  let severity = 'error';
  let recoverable = true;
  let retryable = false;

  if (status) {
    if (status >= 500) { errorType = 'server'; retryable = true; }
    else if (status === 401 || status === 403) { errorType = 'auth'; severity = 'warning'; recoverable = false; }
    else if (status === 404) { errorType = 'notFound'; severity = 'warning'; }
    else if (status >= 400) { errorType = 'client'; severity = 'warning'; }
  } else if (/network|fetch|timeout/i.test(errorMessage)) {
    errorType = 'network';
    retryable = true;
  }

  emitEvent('error', {
    error: errorMessage, action, originalError: error,
    context: { ...context, status },
    severity, recoverable, retryable, type: errorType,
  });

  emitStateChange();
};

/**
 * Build query string from params object
 */
export const buildQueryString = (params = {}) => {
  const filtered = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') filtered[k] = v;
  }
  const qs = new URLSearchParams(filtered).toString();
  return qs ? `?${qs}` : '';
};

/**
 * Create a standard loading state updater
 */
export const createLoadingUpdater = (state, emitStateChange) => {
  return (loading) => {
    state.loading = loading;
    if (loading) state.error = null;
    emitStateChange();
  };
};
