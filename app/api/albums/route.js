/**
 * Albums API Route
 * Handles listing and creating albums
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';

// GET - List albums
export async function GET(request) {
  try {
    const { user, error, status } = await getAuthenticatedUser(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'owned', 'shared', or null for all

    let whereClause = {};

    if (filter === 'owned') {
      whereClause = { userId: user.id };
    } else if (filter === 'shared') {
      whereClause = {
        albumShares: {
          some: {
            userId: user.id,
          },
        },
      };
    } else {
      // All albums: owned + shared
      whereClause = {
        OR: [
          { userId: user.id },
          { albumShares: { some: { userId: user.id } } },
        ],
      };
    }

    const albums = await prisma.album.findMany({
      where: whereClause,
      include: {
        albumMedia: {
          take: 1, // Just to check if album has media
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            albumMedia: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      data: albums.map(album => ({
        id: album.id,
        name: album.name,
        description: album.description,
        coverMediaId: album.coverMediaId,
        isPublic: album.isPublic,
        mediaCount: album._count.albumMedia,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error listing albums:', error);
    return NextResponse.json(
      { error: 'Failed to list albums' },
      { status: 500 }
    );
  }
}

// POST - Create album
export async function POST(request) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { name, description, isPublic = false, coverMediaId } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Album name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const publicFlag = Boolean(isPublic);
    if (publicFlag) {
      const dup = await prisma.album.findFirst({
        where: {
          userId: user.id,
          isPublic: true,
          name: { equals: trimmedName, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json(
          {
            error:
              'A public album with this name already exists. Use a different name or create a personal album.',
          },
          { status: 409 },
        );
      }
    }

    // Get current max sortOrder for user's albums
    const maxSortOrder = await prisma.album.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });

    const album = await prisma.album.create({
      data: {
        userId: user.id,
        name: trimmedName,
        description: description?.trim() || null,
        isPublic: publicFlag,
        coverMediaId: coverMediaId || null,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: album.id,
          name: album.name,
          description: album.description,
          coverMediaId: album.coverMediaId,
          isPublic: album.isPublic,
          mediaCount: 0,
          createdAt: album.createdAt,
          updatedAt: album.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating album:', error);
    const msg = error?.message || '';
    if (msg.includes('albums_user_public_lower_trim_name_unique')) {
      return NextResponse.json(
        {
          error:
            'A public album with this name already exists. Use a different name or create a personal album.',
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    );
  }
}

