// POST /api/auth/login
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { verifyPassword, generateToken, hashToken, generateRefreshToken, hashRefreshToken } from '@/lib/auth';

// Use first IP from X-Forwarded-For (PostgreSQL INET accepts only a single address)
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  const first = forwarded.split(',')[0]?.trim();
  if (!first) return null;
  // Basic sanity: INET expects a single IPv4 or IPv6 address
  if (/^[\d.a-f:]+$/i.test(first)) return first;
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate access token (short-lived: 15 minutes)
    const token = generateToken(user.id);

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // Create session
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes for access token

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days for refresh token

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        refreshTokenHash,
        expiresAt,
        refreshExpiresAt,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Return user, access token, and refresh token
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        isWebsiteOwner: user.isWebsiteOwner,
      },
      token, // Access token (15 minutes)
      refreshToken, // Refresh token (7 days)
    });
  } catch (error) {
    console.error('[Login] Error:', error?.message ?? error);
    if (error?.stack) console.error('[Login] Stack:', error.stack);
    const isDev = process.env.NODE_ENV === 'development';
    const message = error?.message ?? 'Internal server error';
    return NextResponse.json(
      {
        error: isDev ? message : 'Internal server error',
        ...(isDev && { detail: message }),
      },
      { status: 500 }
    );
  }
}

