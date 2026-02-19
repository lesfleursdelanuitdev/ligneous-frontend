// POST /api/auth/refresh
// Refresh access token using refresh token
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { generateToken, hashToken, hashRefreshToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash,
        isRevoked: false,
        refreshExpiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Check if user is still active
    if (!session.user.isActive) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = generateToken(session.userId);
    const newTokenHash = hashToken(newAccessToken);

    // Update session with new access token
    const newExpiresAt = new Date();
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + 15); // 15 minutes

    await prisma.session.update({
      where: { id: session.id },
      data: {
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      token: newAccessToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

