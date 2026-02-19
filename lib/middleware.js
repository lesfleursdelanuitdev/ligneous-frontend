// Middleware utilities for API routes
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { verifyToken, hashToken } from '@/lib/auth';

/**
 * Extract token from request (cookie or Authorization header)
 */
export function getTokenFromRequest(request) {
  // Try cookie first
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Try Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Get authenticated user from request
 * Returns { user, error, status }
 */
export async function getAuthenticatedUser(request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return { user: null, error: 'Not authenticated', status: 401 };
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return { user: null, error: 'Invalid token', status: 401 };
    }

    // Check session
    const tokenHash = hashToken(token);
    const session = await prisma.session.findFirst({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return { user: null, error: 'Session expired or revoked', status: 401 };
    }

    // Update last used
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        isWebsiteOwner: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user || !user.isActive) {
      return { user: null, error: 'User not found or inactive', status: 401 };
    }

    return { user, error: null, status: 200 };
  } catch (error) {
    console.error('Auth error:', error);
    return { user: null, error: 'Internal server error', status: 500 };
  }
}

/**
 * Require authentication - returns error response if not authenticated
 */
export async function requireAuth(request) {
  const { user, error, status } = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error }, { status }),
    };
  }
  
  return { user, response: null };
}

/**
 * Require superuser (website owner) - returns error response if not authorized
 */
export async function requireSuperuser(request) {
  const { user, response } = await requireAuth(request);
  
  if (response) {
    return { user: null, response };
  }
  
  if (!user.isWebsiteOwner) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Superuser access required' },
        { status: 403 }
      ),
    };
  }
  
  return { user, response: null };
}

/**
 * Authenticate request - alias for getAuthenticatedUser for backward compatibility
 * Returns { user, error, status } format
 */
export async function authenticateRequest(request) {
  return await getAuthenticatedUser(request);
}
