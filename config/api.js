/**
 * API Configuration
 * Configuration for API clients and endpoints
 */

import { env, getClientEnv } from './environment.js';

/**
 * API Configuration
 */
export const apiConfig = {
  // Next.js API routes configuration
  nextApi: {
    baseURL: env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
  },

  // Get client-side API config (for browser)
  getClientConfig() {
    const clientEnv = getClientEnv();
    return {
      nextApi: {
        baseURL: clientEnv.NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_API_URL,
        timeout: 30000,
      },
    };
  },
};
