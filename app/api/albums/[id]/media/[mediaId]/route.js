/**
 * Album Media Item API Route
 * Handles removing a specific media item from an album
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth } from '@/lib/middleware';

// DELETE - Remove media from album
export async function DELETE(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: albumId, mediaId } = params;

    // Find the album media record
    const albumMedia = await prisma.albumMedia.findFirst({
      where: {
        albumId,
        mediaId,
      },
      include: {
        album: {
          include: {
            albumShares: {
              where: { userId: user.id, canEdit: true },
            },
          },
        },
      },
    });

    if (!albumMedia) {
      return NextResponse.json(
        { error: 'Media not found in album' },
        { status: 404 }
      );
    }

    // Check permission
    const canEdit =
      albumMedia.album.userId === user.id ||
      albumMedia.album.albumShares.length > 0 ||
      user.isWebsiteOwner;

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    await prisma.albumMedia.delete({
      where: { id: albumMedia.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error removing media from album:', error);
    return NextResponse.json(
      { error: 'Failed to remove media from album' },
      { status: 500 }
    );
  }
}

