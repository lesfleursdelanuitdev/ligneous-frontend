/**
 * Tag Items API Route
 * Handles tagging/untagging entities and listing tagged items
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';

// GET - List entities with this tag
export async function GET(request, { params }) {
  try {
    const { user, error, status } = await getAuthenticatedUser(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: tagId } = params;
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType'); // Optional filter

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check access
    if (!tag.isGlobal && tag.userId !== user.id && !user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build where clause
    const whereClause = { tagId };
    if (entityType) {
      whereClause.entityType = entityType;
    }

    // For user tags, only show items tagged by the current user
    if (!tag.isGlobal) {
      whereClause.taggedBy = user.id;
    }

    const taggedItems = await prisma.taggedItem.findMany({
      where: whereClause,
      orderBy: { taggedAt: 'desc' },
    });

    // Group by entity type
    const grouped = taggedItems.reduce((acc, item) => {
      if (!acc[item.entityType]) {
        acc[item.entityType] = [];
      }
      acc[item.entityType].push({
        fileId: item.fileId,
        entityId: item.entityId,
        entityXref: item.entityXref,
        taggedAt: item.taggedAt,
      });
      return acc;
    }, {});

    return NextResponse.json({ data: grouped });
  } catch (error) {
    console.error('Error listing tagged items:', error);
    return NextResponse.json(
      { error: 'Failed to list tagged items' },
      { status: 500 }
    );
  }
}

// POST - Tag an entity
export async function POST(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: tagId } = params;

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

    const body = await request.json();
    const { entityType, fileId, entityId, entityXref } = body;

    if (!entityType || !fileId || !entityId) {
      return NextResponse.json(
        { error: 'entityType, fileId, and entityId are required' },
        { status: 400 }
      );
    }

    // Validate entityType
    const validTypes = ['media', 'event', 'individual', 'family', 'note', 'source', 'place', 'date'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
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
    });

    return NextResponse.json(
      {
        data: {
          id: taggedItem.id,
          tagId: taggedItem.tagId,
          entityType: taggedItem.entityType,
          fileId: taggedItem.fileId,
          entityId: taggedItem.entityId,
          entityXref: taggedItem.entityXref,
          taggedAt: taggedItem.taggedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error tagging entity:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Entity already tagged with this tag' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to tag entity' },
      { status: 500 }
    );
  }
}

// DELETE - Untag an entity
export async function DELETE(request, { params }) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: tagId } = params;

    const body = await request.json();
    const { entityType, fileId, entityId } = body;

    if (!entityType || !fileId || !entityId) {
      return NextResponse.json(
        { error: 'entityType, fileId, and entityId are required' },
        { status: 400 }
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

    // User can only remove tags they applied
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
    console.error('Error untagging entity:', error);
    return NextResponse.json(
      { error: 'Failed to untag entity' },
      { status: 500 }
    );
  }
}

