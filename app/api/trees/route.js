/**
 * Trees API Route
 * Handles listing and creating trees
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';
import { isWebsiteOwner, addTreeOwner } from '@/lib/permissions';

// GET - List trees
export async function GET(request) {
  try {
    // 1. Get authenticated user (optional for public trees)
    const { user } = await getAuthenticatedUser(request);
    
    // 2. Get filter from query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'public', 'owned', or null for all
    const search = searchParams.get('search') || '';
    const advancedConditionsJson = searchParams.get('advanced_conditions');
    const limit = Math.min(parseInt(searchParams.get('limit'), 10) || 50, 500);
    const offset = parseInt(searchParams.get('offset'), 10) || 0;
    const sort = searchParams.get('sort') || 'updatedAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const visibility = searchParams.get('visibility'); // 'public', 'private', or null for all

    // 3. Build query based on user permissions and filter
    let whereClause = {};

    if (filter === 'public') {
      whereClause = { isPublic: true };
    } else if (filter === 'owned' && user) {
      // Trees owned or maintained by user
      if (user.isWebsiteOwner) {
        // Superuser "owns" all trees
        whereClause = {};
      } else {
        whereClause = {
          OR: [
            { owners: { some: { userId: user.id } } },
            { treeMaintainers: { some: { userId: user.id } } },
          ],
        };
      }
    } else if (!user) {
      // Unauthenticated: only public trees
      whereClause = { isPublic: true };
    } else if (user.isWebsiteOwner) {
      // Website owner: all trees
      whereClause = {};
    } else {
      // Regular user: public trees + trees they have access to
      whereClause = {
        OR: [
          { isPublic: true },
          {
            owners: {
              some: {
                userId: user.id,
              },
            },
          },
          {
            treeMaintainers: {
              some: {
                userId: user.id,
              },
            },
          },
          {
            permissions: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      };
    }

    const andParts = [];
    if (search) {
      andParts.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    let advancedConditions = [];
    try { if (advancedConditionsJson) advancedConditions = JSON.parse(advancedConditionsJson); } catch { advancedConditions = []; }
    const mode = { mode: 'insensitive' };
    for (const c of advancedConditions) {
      if (!c.value?.trim?.()) continue;
      const val = c.value.trim();
      const op = c.operator || 'contains';
      if (c.field === 'name') {
        if (op === 'contains') andParts.push({ name: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { name: { contains: val, ...mode } } });
        else if (op === 'equals') andParts.push({ name: { equals: val, ...mode } });
        else if (op === 'not_equals') andParts.push({ NOT: { name: { equals: val, ...mode } } });
        else if (op === 'starts_with') andParts.push({ name: { startsWith: val, ...mode } });
        else if (op === 'ends_with') andParts.push({ name: { endsWith: val, ...mode } });
      } else if (c.field === 'description') {
        if (op === 'contains') andParts.push({ description: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { description: { contains: val, ...mode } } });
      }
    }
    if (andParts.length > 0) {
      whereClause = { AND: [whereClause, ...andParts] };
    }
    if (visibility === 'public') {
      whereClause = { AND: [whereClause, { isPublic: true }] };
    } else if (visibility === 'private') {
      whereClause = { AND: [whereClause, { isPublic: false }] };
    }

    const orderByMap = {
      name: { name: order },
      createdAt: { createdAt: order },
      updatedAt: { updatedAt: order },
      individuals_count: {}, // requires join, use default
    };
    const orderBy = orderByMap[sort] || { updatedAt: 'desc' };

    // 4. Query trees with related data
    const [trees, total] = await Promise.all([
      prisma.tree.findMany({
        where: whereClause,
      include: {
        owners: {
          select: {
            userId: true,
            isPrimary: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        treeMaintainers: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        gedcomFile: {
          select: {
            individualsCount: true,
            familiesCount: true,
            placesCount: true,
            eventsCount: true,
            notesCount: true,
            sourcesCount: true,
            status: true,
          },
        },
        _count: {
          select: {
            owners: true,
            treeMaintainers: true,
            userIndividualLinks: true,
          },
        },
      },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.tree.count({ where: whereClause }),
    ]);

    // 4. Enrich with stats: use gedcomFile relation, or fallback lookup by fileId when null
    const fileIdsToLookup = trees.filter((t) => !t.gedcomFile && t.fileId).map((t) => t.fileId);
    const gedcomByFileId =
      fileIdsToLookup.length > 0
        ? Object.fromEntries(
            (
              await prisma.gedcomFile.findMany({
                where: { fileId: { in: fileIdsToLookup } },
                select: {
                  fileId: true,
                  individualsCount: true,
                  familiesCount: true,
                  placesCount: true,
                  datesCount: true,
                  eventsCount: true,
                  notesCount: true,
                  sourcesCount: true,
                  status: true,
                },
              })
            ).map((gf) => [gf.fileId, gf])
          )
        : {};

    const treesWithStats = trees.map((tree) => {
      const gf = tree.gedcomFile ?? gedcomByFileId[tree.fileId];
      return {
        ...tree,
        gedcomFile: undefined,
        individualsCount: gf?.individualsCount ?? 0,
        familiesCount: gf?.familiesCount ?? 0,
        placesCount: gf?.placesCount ?? 0,
        datesCount: gf?.datesCount ?? 0,
        eventsCount: gf?.eventsCount ?? 0,
        notesCount: gf?.notesCount ?? 0,
        sourcesCount: gf?.sourcesCount ?? 0,
        parseStatus: gf?.status ?? 'unknown',
      };
    });

    return NextResponse.json({
      success: true,
      trees: treesWithStats,
      pagination: { total, limit, offset, hasMore: offset + trees.length < total },
    });
  } catch (error) {
    console.error('Trees listing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new tree
export async function POST(request) {
  // Require authentication
  const { user, response } = await requireAuth(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { fileId, name, description, isPublic = false } = body;

    // Validate required fields
    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tree name is required' },
        { status: 400 }
      );
    }

    // Check if a tree with this fileId already exists
    const existingTree = await prisma.tree.findUnique({
      where: { fileId },
    });

    if (existingTree) {
      return NextResponse.json(
        { error: 'A tree with this file already exists' },
        { status: 400 }
      );
    }

    // Verify the GedcomFile exists locally
    const gedcomFile = await prisma.gedcomFile.findUnique({
      where: { fileId },
      select: { id: true },
    });
    if (!gedcomFile) {
      return NextResponse.json(
        { error: 'GEDCOM file not found. Please upload the file first.' },
        { status: 400 }
      );
    }

    // Create the tree and add the user as primary owner in a transaction
    const tree = await prisma.$transaction(async (tx) => {
      // Create tree
      const newTree = await tx.tree.create({
        data: {
          fileId,
          name: name.trim(),
          description: description?.trim() || null,
          isPublic,
        },
      });

      // Add uploader as primary owner
      await tx.treeOwner.create({
        data: {
          treeId: newTree.id,
          userId: user.id,
          isPrimary: true,
        },
      });

      return newTree;
    });

    // Fetch the tree with owner info
    const treeWithOwner = await prisma.tree.findUnique({
      where: { id: tree.id },
      include: {
        owners: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tree: treeWithOwner,
      message: 'Tree created successfully',
    });
  } catch (error) {
    console.error('Create tree error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tree' },
      { status: 500 }
    );
  }
}
