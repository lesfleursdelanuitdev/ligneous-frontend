/**
 * Tag Detail API Route
 * Handles getting, updating, and deleting a specific tag
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';

// GET - Get tag details
export async function GET(request, { params }) {
  try {
    const { user, error, status } = await getAuthenticatedUser(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check access: user can see their own tags and all global tags
    if (!tag.isGlobal && tag.userId !== user.id && !user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        isGlobal: tag.isGlobal,
        itemCount: tag._count.items,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting tag:', error);
    return NextResponse.json(
      { error: 'Failed to get tag' },
      { status: 500 }
    );
  }
}

// PUT - Update tag
export async function PUT(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = params;

    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check permission
    if (tag.isGlobal) {
      // Only website owners can update global tags
      if (!user.isWebsiteOwner) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    } else {
      // Only owner can update their own tags
      if (tag.userId !== user.id && !user.isWebsiteOwner) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { name, color, description } = body;

    const updateData = {};
    if (name !== undefined) {
      updateData.name = name.trim();
      // Check uniqueness if name changed
      if (name.trim() !== tag.name) {
        const existing = await prisma.tag.findFirst({
          where: {
            id: { not: id },
            ...(tag.isGlobal
              ? { name: name.trim(), isGlobal: true }
              : { userId: tag.userId, name: name.trim(), isGlobal: false }),
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: 'Tag with this name already exists' },
            { status: 400 }
          );
        }
      }
    }
    if (color !== undefined) updateData.color = color || null;
    if (description !== undefined) updateData.description = description?.trim() || null;

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        id: updatedTag.id,
        name: updatedTag.name,
        color: updatedTag.color,
        description: updatedTag.description,
        isGlobal: updatedTag.isGlobal,
        itemCount: updatedTag._count.items,
        createdAt: updatedTag.createdAt,
        updatedAt: updatedTag.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tag
export async function DELETE(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = params;

    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check permission
    if (tag.isGlobal) {
      // Only website owners can delete global tags
      if (!user.isWebsiteOwner) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    } else {
      // Only owner can delete their own tags
      if (tag.userId !== user.id && !user.isWebsiteOwner) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}

