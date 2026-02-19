// POST /api/auth/register
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { hashPassword, generateToken, hashToken, generateRefreshToken, hashRefreshToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, password, name } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        name: name || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        isWebsiteOwner: true,
        createdAt: true,
      },
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
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Return user, access token, and refresh token
    return NextResponse.json(
      {
        user,
        token, // Access token (15 minutes)
        refreshToken, // Refresh token (7 days)
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

