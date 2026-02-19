// POST /api/auth/logout
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { hashToken } from '@/lib/auth';
import { getTokenFromRequest } from '@/lib/middleware';

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Revoke session
    const tokenHash = hashToken(token);
    await prisma.session.updateMany({
      where: {
        tokenHash,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


