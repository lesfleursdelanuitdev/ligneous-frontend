/**
 * Library utilities
 * Central export for all lib utilities
 */

// API utilities (client-side - for Next.js API routes only)
export * from './api';

// Auth utilities (server-side only - client uses useAuth facet)
export * from './auth';

// Permission utilities
export * from './permissions';

// Database utilities
export { prisma } from './database/prisma';

// Tree access utilities
export * from './tree-access';

// Middleware utilities
export * from './middleware';

