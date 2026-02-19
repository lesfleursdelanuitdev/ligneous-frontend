/**
 * Tags API Route
 * Handles listing and creating user tags
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';

// GET - List user's tags
export async function GET(request) {
  try {
    const { user, error, status } = await getAuthenticatedUser(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const tags = await prisma.tag.findMany({
      where: {
        OR: [
          { userId: user.id, isGlobal: false }, // User's personal tags
          { isGlobal: true }, // All global tags
        ],
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [
        { isGlobal: 'desc' }, // Global tags first
        { name: 'asc' },
      ],
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
    console.error('Error listing tags:', error);
    return NextResponse.json(
      { error: 'Failed to list tags' },
      { status: 500 }
    );
  }
}

// POST - Create user tag
export async function POST(request) {
  try {
    const { user, error, status } = await requireAuth(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { name, color, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check if user already has a tag with this name
    const existing = await prisma.tag.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        isGlobal: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        userId: user.id,
        name: name.trim(),
        color: color || null,
        description: description?.trim() || null,
        isGlobal: false,
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
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}

