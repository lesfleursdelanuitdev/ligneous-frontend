/**
 * Global Tags API Route
 * Handles listing and creating global tags (admin/owner only)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';

// GET - List all global tags
export async function GET(request) {
  try {
    const { user, error, status } = await getAuthenticatedUser(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const tags = await prisma.tag.findMany({
      where: {
        isGlobal: true,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      data: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        isGlobal: tag.isGlobal,
        itemCount: tag._count.items,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error listing global tags:', error);
    return NextResponse.json(
      { error: 'Failed to list global tags' },
      { status: 500 }
    );
  }
}

// POST - Create global tag (admin/owner only)
export async function POST(request) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Only website owners can create global tags
    if (!user.isWebsiteOwner) {
      return NextResponse.json(
        { error: 'Permission denied. Only website owners can create global tags.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, color, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check if global tag with this name already exists
    const existing = await prisma.tag.findFirst({
      where: {
        name: name.trim(),
        isGlobal: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Global tag with this name already exists' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        userId: null,
        name: name.trim(),
        color: color || null,
        description: description?.trim() || null,
        isGlobal: true,
        createdBy: user.id,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          isGlobal: tag.isGlobal,
          itemCount: 0,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating global tag:', error);
    return NextResponse.json(
      { error: 'Failed to create global tag' },
      { status: 500 }
    );
  }
}

