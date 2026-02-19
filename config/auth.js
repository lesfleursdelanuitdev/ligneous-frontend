/**
 * Authentication Configuration
 * Configuration for JWT and authentication
 */

import { env } from './environment.js';

/**
 * Authentication Configuration
 */
export const authConfig = {
  // JWT Secret (must be set in production!)
  jwtSecret: env.JWT_SECRET,
  
  // JWT Expiration (for backward compatibility, not used for access tokens)
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  
  // Access Token Expiration (short-lived tokens for API requests)
  jwtAccessTokenExpiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
  
  // Password hashing
  bcrypt: {
    saltRounds: 10,
  },
  
  // Session configuration
  session: {
    // Token hash algorithm
    hashAlgorithm: 'sha256',
  },
};

