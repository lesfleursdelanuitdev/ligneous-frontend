// GET /api/me/links - Get current user's individual links
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth } from '@/lib/middleware';

// GET - Get all individual links for the current user
export async function GET(request) {
  const { user, response } = await requireAuth(request);
  if (response) return response;

  try {
    const links = await prisma.userIndividualLink.findMany({
      where: { userId: user.id },
      include: {
        tree: {
          select: { id: true, name: true, fileId: true, isPublic: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('List user links error:', error);
    return NextResponse.json(
      { error: 'Failed to list your individual links' },
      { status: 500 }
    );
  }
}


