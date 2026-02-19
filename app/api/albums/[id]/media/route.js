/**
 * Album Media API Route
 * Handles adding, removing, and reordering media in albums
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth } from '@/lib/middleware';
import { config } from '@/config';

// GET - List media in album (with enrichment from Go API)
export async function GET(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: albumId } = params;

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        albumMedia: {
          orderBy: { sortOrder: 'asc' },
        },
        albumShares: {
          where: { userId: user.id },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess =
      album.userId === user.id ||
      album.albumShares.length > 0 ||
      user.isWebsiteOwner;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch media details from Go API in parallel
    const goApiUrl = config.api.goApi.baseURL;
    const mediaPromises = album.albumMedia.map(async (am) => {
      try {
        const response = await fetch(
          `${goApiUrl}/api/v1/files/${am.fileId}/media/${am.mediaId}`,
          {
            headers: {
              'Authorization': request.headers.get('Authorization') || '',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return {
            ...data.data,
            sortOrder: am.sortOrder,
            addedAt: am.addedAt,
            albumMediaId: am.id,
          };
        } else {
          // Media might have been deleted in Go API
          return {
            id: am.mediaId,
            fileId: am.fileId,
            sortOrder: am.sortOrder,
            addedAt: am.addedAt,
            albumMediaId: am.id,
            error: 'Media not found in Go API',
          };
        }
      } catch (err) {
        console.error(`Error fetching media ${am.mediaId}:`, err);
        return {
          id: am.mediaId,
          fileId: am.fileId,
          sortOrder: am.sortOrder,
          addedAt: am.addedAt,
          albumMediaId: am.id,
          error: 'Failed to fetch media details',
        };
      }
    });

    const media = await Promise.all(mediaPromises);

    return NextResponse.json({ data: media });
  } catch (error) {
    console.error('Error listing album media:', error);
    return NextResponse.json(
      { error: 'Failed to list album media' },
      { status: 500 }
    );
  }
}

// POST - Add media to album
export async function POST(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: albumId } = params;

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        albumShares: {
          where: { userId: user.id, canEdit: true },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Check permission
    const canEdit =
      album.userId === user.id ||
      album.albumShares.length > 0 ||
      user.isWebsiteOwner;

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileId, mediaId, sortOrder } = body;

    if (!fileId || !mediaId) {
      return NextResponse.json(
        { error: 'fileId and mediaId are required' },
        { status: 400 }
      );
    }

    // Check if media already in album
    const existing = await prisma.albumMedia.findUnique({
      where: {
        albumId_fileId_mediaId: {
          albumId,
          fileId,
          mediaId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Media already in album' },
        { status: 400 }
      );
    }

    // Get max sortOrder if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const maxSort = await prisma.albumMedia.aggregate({
        where: { albumId },
        _max: { sortOrder: true },
      });
      finalSortOrder = (maxSort._max.sortOrder || 0) + 1;
    }

    const albumMedia = await prisma.albumMedia.create({
      data: {
        albumId,
        fileId,
        mediaId,
        sortOrder: finalSortOrder,
        addedBy: user.id,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: albumMedia.id,
          fileId: albumMedia.fileId,
          mediaId: albumMedia.mediaId,
          sortOrder: albumMedia.sortOrder,
          addedAt: albumMedia.addedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding media to album:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Media already in album' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add media to album' },
      { status: 500 }
    );
  }
}

// PUT - Reorder media in album
export async function PUT(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: albumId } = params;

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        albumShares: {
          where: { userId: user.id, canEdit: true },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Check permission
    const canEdit =
      album.userId === user.id ||
      album.albumShares.length > 0 ||
      user.isWebsiteOwner;

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { mediaOrder } = body; // Array of { id, sortOrder }

    if (!Array.isArray(mediaOrder)) {
      return NextResponse.json(
        { error: 'mediaOrder must be an array' },
        { status: 400 }
      );
    }

    // Update sortOrder for each media item
    const updates = mediaOrder.map(({ id, sortOrder }) =>
      prisma.albumMedia.update({
        where: { id },
        data: { sortOrder },
      })
    );

    await Promise.all(updates);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error reordering album media:', error);
    return NextResponse.json(
      { error: 'Failed to reorder album media' },
      { status: 500 }
    );
  }
}

