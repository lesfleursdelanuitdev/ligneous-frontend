/**
 * Album Detail API Route
 * Handles getting, updating, and deleting a specific album
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';

// GET - Get album details
export async function GET(request, { params }) {
  try {
    const { user, error, status } = await getAuthenticatedUser(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = params;

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        albumMedia: {
          orderBy: { sortOrder: 'asc' },
        },
        albumShares: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            albumMedia: true,
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Check access: user must own album or have it shared with them
    const hasAccess =
      album.userId === user.id ||
      album.albumShares.some(share => share.userId === user.id) ||
      user.isWebsiteOwner;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        id: album.id,
        name: album.name,
        description: album.description,
        coverMediaId: album.coverMediaId,
        isPublic: album.isPublic,
        mediaCount: album._count.albumMedia,
        media: album.albumMedia.map(am => ({
          id: am.id,
          fileId: am.fileId,
          mediaId: am.mediaId,
          sortOrder: am.sortOrder,
          addedAt: am.addedAt,
        })),
        sharedWith: album.albumShares.map(share => ({
          userId: share.user.id,
          username: share.user.username,
          name: share.user.name,
          canEdit: share.canEdit,
          sharedAt: share.sharedAt,
        })),
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting album:', error);
    return NextResponse.json(
      { error: 'Failed to get album' },
      { status: 500 }
    );
  }
}

// PUT - Update album
export async function PUT(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = params;

    const album = await prisma.album.findUnique({
      where: { id },
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

    // Check permission: user must own album or have edit permission
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
    const { name, description, isPublic, coverMediaId, sortOrder } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (coverMediaId !== undefined) updateData.coverMediaId = coverMediaId || null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const nextName = updateData.name !== undefined ? updateData.name : album.name;
    const nextPublic = updateData.isPublic !== undefined ? updateData.isPublic : album.isPublic;
    if (nextPublic) {
      const dup = await prisma.album.findFirst({
        where: {
          userId: album.userId,
          isPublic: true,
          name: { equals: nextName, mode: 'insensitive' },
          id: { not: id },
        },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json(
          {
            error:
              'A public album with this name already exists. Use a different name or keep this album personal.',
          },
          { status: 409 },
        );
      }
    }

    const updatedAlbum = await prisma.album.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            albumMedia: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        id: updatedAlbum.id,
        name: updatedAlbum.name,
        description: updatedAlbum.description,
        coverMediaId: updatedAlbum.coverMediaId,
        isPublic: updatedAlbum.isPublic,
        mediaCount: updatedAlbum._count.albumMedia,
        createdAt: updatedAlbum.createdAt,
        updatedAt: updatedAlbum.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating album:', error);
    const msg = error?.message || '';
    if (msg.includes('albums_user_public_lower_trim_name_unique')) {
      return NextResponse.json(
        {
          error:
            'A public album with this name already exists. Use a different name or keep this album personal.',
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to update album' },
      { status: 500 }
    );
  }
}

// DELETE - Delete album
export async function DELETE(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = params;

    const album = await prisma.album.findUnique({
      where: { id },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Check permission: only owner can delete
    if (album.userId !== user.id && !user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}

