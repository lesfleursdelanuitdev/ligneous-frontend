/**
 * Album Sharing API Route
 * Handles sharing albums with other users
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth } from '@/lib/middleware';

// GET - List users album is shared with
export async function GET(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: albumId } = params;

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Only owner can see shares
    if (album.userId !== user.id && !user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const shares = await prisma.albumShare.findMany({
      where: { albumId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: shares.map(share => ({
        userId: share.user.id,
        username: share.user.username,
        name: share.user.name,
        email: share.user.email,
        canEdit: share.canEdit,
        sharedAt: share.sharedAt,
      })),
    });
  } catch (error) {
    console.error('Error listing album shares:', error);
    return NextResponse.json(
      { error: 'Failed to list album shares' },
      { status: 500 }
    );
  }
}

// POST - Share album with user
export async function POST(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: albumId } = params;

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Only owner can share
    if (album.userId !== user.id && !user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, canEdit = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot share album with yourself' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const share = await prisma.albumShare.create({
      data: {
        albumId,
        userId,
        canEdit: canEdit || false,
        sharedBy: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: {
          userId: share.user.id,
          username: share.user.username,
          name: share.user.name,
          canEdit: share.canEdit,
          sharedAt: share.sharedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sharing album:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Album already shared with this user' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to share album' },
      { status: 500 }
    );
  }
}

