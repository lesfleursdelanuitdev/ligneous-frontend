/**
 * Entity Tags API Route
 * Handles getting, adding, and removing tags for a specific entity
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';
import { getFileIdFromTreeId } from '@/lib/tree-access';

// GET - Get tags for an entity (global + user's personal tags)
export async function GET(request, { params }) {
  try {
    const { user, error, status } = await getAuthenticatedUser(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { treeId, entityType, entityId } = params;

    // Get fileId from treeId
    const fileId = await getFileIdFromTreeId(treeId);
    if (!fileId) {
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }

    // Find all tags for this entity
    const taggedItems = await prisma.taggedItem.findMany({
      where: {
        entityType,
        fileId,
        entityId,
        OR: [
          // Global tags applied by anyone
          {
            tag: { isGlobal: true },
          },
          // User's personal tags
          {
            taggedBy: user.id,
            tag: { isGlobal: false },
          },
        ],
      },
      include: {
        tag: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Separate global and user tags
    const globalTags = [];
    const userTags = [];

    taggedItems.forEach(item => {
      const tagData = {
        id: item.tag.id,
        name: item.tag.name,
        color: item.tag.color,
        description: item.tag.description,
        isGlobal: item.tag.isGlobal,
        taggedBy: {
          id: item.user.id,
          username: item.user.username,
        },
        taggedAt: item.taggedAt,
      };

      if (item.tag.isGlobal) {
        globalTags.push(tagData);
      } else {
        userTags.push(tagData);
      }
    });

    return NextResponse.json({
      data: {
        globalTags,
        userTags,
      },
    });
  } catch (error) {
    console.error('Error getting entity tags:', error);
    return NextResponse.json(
      { error: 'Failed to get entity tags' },
      { status: 500 }
    );
  }
}

// POST - Add tag to entity
export async function POST(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { treeId, entityType, entityId } = params;

    // Get fileId from treeId
    const fileId = await getFileIdFromTreeId(treeId);
    if (!fileId) {
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { tagId, entityXref } = body;

    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId is required' },
        { status: 400 }
      );
    }

    // Verify tag exists and user can use it
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check permission: global tags can be applied by anyone, user tags only by owner
    if (!tag.isGlobal && tag.userId !== user.id && !user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Permission denied. You can only apply your own tags.' },
        { status: 403 }
      );
    }

    // Check if already tagged
    const existing = await prisma.taggedItem.findUnique({
      where: {
        tagId_taggedBy_entityType_fileId_entityId: {
          tagId,
          taggedBy: user.id,
          entityType,
          fileId,
          entityId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Entity already tagged with this tag' },
        { status: 400 }
      );
    }

    const taggedItem = await prisma.taggedItem.create({
      data: {
        tagId,
        taggedBy: user.id,
        entityType,
        fileId,
        entityId,
        entityXref: entityXref || null,
      },
      include: {
        tag: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: {
          id: taggedItem.id,
          tag: {
            id: taggedItem.tag.id,
            name: taggedItem.tag.name,
            color: taggedItem.tag.color,
            isGlobal: taggedItem.tag.isGlobal,
          },
          taggedBy: {
            id: taggedItem.user.id,
            username: taggedItem.user.username,
          },
          taggedAt: taggedItem.taggedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding tag to entity:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Entity already tagged with this tag' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add tag to entity' },
      { status: 500 }
    );
  }
}

// DELETE - Remove tag from entity
export async function DELETE(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { treeId, entityType, entityId } = params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId query parameter is required' },
        { status: 400 }
      );
    }

    // Get fileId from treeId
    const fileId = await getFileIdFromTreeId(treeId);
    if (!fileId) {
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }

    // Find the tagged item
    const taggedItem = await prisma.taggedItem.findUnique({
      where: {
        tagId_taggedBy_entityType_fileId_entityId: {
          tagId,
          taggedBy: user.id,
          entityType,
          fileId,
          entityId,
        },
      },
    });

    if (!taggedItem) {
      return NextResponse.json(
        { error: 'Tagged item not found' },
        { status: 404 }
      );
    }

    // User can only remove tags they applied (or admin can remove any)
    if (taggedItem.taggedBy !== user.id && !user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    await prisma.taggedItem.delete({
      where: { id: taggedItem.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error removing tag from entity:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag from entity' },
      { status: 500 }
    );
  }
}

