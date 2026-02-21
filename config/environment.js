/**
 * Environment Variables
 * Centralized access to environment variables with defaults
 */

/**
 * Get environment variable with optional default
 * @param {string} key - Environment variable key
 * @param {string} [defaultValue] - Default value if not set
 * @returns {string|undefined}
 */
function getEnv(key, defaultValue) {
  return process.env[key] ?? defaultValue;
}

/**
 * Environment configuration
 */
export const env = {
  // Node environment
  NODE_ENV: getEnv('NODE_ENV', 'development'),

  // Database
  DATABASE_URL: getEnv('DATABASE_URL'),

  // JWT Configuration
  JWT_SECRET: getEnv('JWT_SECRET', 'your-secret-key-change-in-production'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),

  // API URLs
  NEXT_PUBLIC_API_URL: getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:4000/api'),

  // Environment flags
  isDevelopment: getEnv('NODE_ENV') === 'development',
  isProduction: getEnv('NODE_ENV') === 'production',
  isTest: getEnv('NODE_ENV') === 'test',
};

/**
 * Get client-side accessible environment variables
 * (only NEXT_PUBLIC_* variables are available in the browser)
 */
export function getClientEnv() {
  if (typeof window === 'undefined') {
    return {
      NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    };
  }

  return {
    NEXT_PUBLIC_API_URL: window.__NEXT_DATA__?.env?.NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_API_URL,
  };
}
