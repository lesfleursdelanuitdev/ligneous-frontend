/**
 * Client-side API utilities
 * For making authenticated requests to Next.js API routes (not Go API)
 * 
 * Note: For Go API communication, use Mycelia facets:
 * - useGedcomFiles, useGedcomIndividuals, useGedcomGraph, etc.
 */

/**
 * Get the auth token from localStorage
 */
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Make an authenticated fetch request
 * Automatically adds the Authorization header if a token exists
 */
export async function authFetch(url, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
  };

  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for JSON bodies
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Also include cookies
  });
}

/**
 * Make an authenticated GET request
 */
export async function authGet(url) {
  return authFetch(url, { method: 'GET' });
}

/**
 * Make an authenticated POST request with JSON body
 */
export async function authPost(url, body) {
  return authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated PATCH request with JSON body
 */
export async function authPatch(url, body) {
  return authFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated DELETE request
 */
export async function authDelete(url) {
  return authFetch(url, { method: 'DELETE' });
}
