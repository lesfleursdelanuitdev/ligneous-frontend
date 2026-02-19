// Authentication utilities (Server-side only)
// For use in API routes and server components
//
// Note: Client-side token management is handled by the useAuth Mycelia facet.
// This file only contains server-side utilities.

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authConfig } from '@/config/auth.js';

const JWT_SECRET = authConfig.jwtSecret;
const JWT_EXPIRES_IN = authConfig.jwtExpiresIn;
const JWT_ACCESS_TOKEN_EXPIRES_IN = authConfig.jwtAccessTokenExpiresIn || '15m'; // Default 15 minutes

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, authConfig.bcrypt.saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT access token for a user (short-lived, configurable)
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN, // Configurable via JWT_ACCESS_TOKEN_EXPIRES_IN env var
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash a JWT token for storage in database
 */
export function hashToken(token) {
  const crypto = require('crypto');
  return crypto.createHash(authConfig.session.hashAlgorithm).update(token).digest('hex');
}

/**
 * Generate a secure refresh token
 */
export function generateRefreshToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a refresh token for storage in database
 */
export function hashRefreshToken(token) {
  const crypto = require('crypto');
  return crypto.createHash(authConfig.session.hashAlgorithm).update(token).digest('hex');
}

