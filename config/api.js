/**
 * API Configuration
 * Configuration for API clients and endpoints
 */

import { env, getClientEnv } from './environment.js';

/**
 * API Configuration
 */
export const apiConfig = {
  // Go API configuration
  goApi: {
    baseURL: env.GO_API_URL,
    timeout: 30000,
  },
  
  // Next.js API routes configuration
  nextApi: {
    baseURL: env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
  },
  
  // Get client-side API config (for browser)
  getClientConfig() {
    const clientEnv = getClientEnv();
    return {
      goApi: {
        baseURL: clientEnv.NEXT_PUBLIC_GO_API_URL || env.GO_API_URL,
        timeout: 30000,
      },
      nextApi: {
        baseURL: clientEnv.NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_API_URL,
        timeout: 30000,
      },
    };
  },
};

