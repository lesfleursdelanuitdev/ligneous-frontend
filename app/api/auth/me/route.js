// GET /api/auth/me
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { verifyToken, hashToken } from '@/lib/auth';
import { getTokenFromRequest } from '@/lib/middleware';

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Session expired or revoked' },
        { status: 401 }
      );
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
        _count: {
          select: {
            treeOwners: true,
            treeMaintainers: true,
            userIndividualLinks: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Transform to a cleaner format
    const transformedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      isWebsiteOwner: user.isWebsiteOwner,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      treesOwned: user._count.treeOwners,
      treesMaintained: user._count.treeMaintainers,
      linkedIndividuals: user._count.userIndividualLinks,
    };

    return NextResponse.json({ user: transformedUser });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

