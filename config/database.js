/**
 * Database Configuration
 * Configuration for database connections
 */

import { env } from './environment.js';

/**
 * Database Configuration
 */
export const dbConfig = {
  // Database URL
  url: env.DATABASE_URL,
  
  // Prisma logging configuration
  log: env.isDevelopment 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  
  // Connection pool settings (if needed)
  pool: {
    min: 2,
    max: 10,
  },
};

