/**
 * Album Share Removal API Route
 * Handles removing a share from an album
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth } from '@/lib/middleware';

// DELETE - Remove share
export async function DELETE(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: albumId, userId: targetUserId } = params;

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Only owner can remove shares (or user can remove their own access)
    if (album.userId !== user.id && user.id !== targetUserId && !user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    await prisma.albumShare.deleteMany({
      where: {
        albumId,
        userId: targetUserId,
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error removing album share:', error);
    return NextResponse.json(
      { error: 'Failed to remove album share' },
      { status: 500 }
    );
  }
}

