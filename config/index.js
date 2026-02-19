/**
 * Configuration
 * Centralized configuration for the Ligneous frontend application
 * 
 * This module provides a single source of truth for all configuration values,
 * including environment variables, API endpoints, database settings, and more.
 */

import { env, getClientEnv } from './environment.js';
import { apiConfig } from './api.js';
import { dbConfig } from './database.js';
import { authConfig } from './auth.js';

/**
 * Main configuration object
 */
export const config = {
  // Environment
  env,
  
  // API configuration
  api: apiConfig,
  
  // Database configuration
  database: dbConfig,
  
  // Authentication configuration
  auth: authConfig,
  
  // Environment flags
  isDevelopment: env.isDevelopment,
  isProduction: env.isProduction,
  isTest: env.isTest,
  
  // Get client-side configuration
  getClientConfig() {
    return {
      api: apiConfig.getClientConfig(),
      env: getClientEnv(),
    };
  },
};

// Export individual configs for convenience
export { env, getClientEnv } from './environment.js';
export { apiConfig } from './api.js';
export { dbConfig } from './database.js';
export { authConfig } from './auth.js';

// Default export
export default config;

