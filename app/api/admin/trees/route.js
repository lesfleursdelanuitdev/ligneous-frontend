// GET /api/admin/trees - List all trees with owners/maintainers (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

export async function GET(request) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const visibility = searchParams.get('visibility');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const advancedConditionsJson = searchParams.get('advanced_conditions');

    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fileId: { contains: search, mode: 'insensitive' } },
      ];
    }
    let advancedConditions = [];
    try { if (advancedConditionsJson) advancedConditions = JSON.parse(advancedConditionsJson); } catch { advancedConditions = []; }
    const andParts = [];
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
      } else if (c.field === 'fileId') {
        if (op === 'contains') andParts.push({ fileId: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { fileId: { contains: val, ...mode } } });
        else if (op === 'equals') andParts.push({ fileId: { equals: val, ...mode } });
      }
    }
    if (andParts.length > 0) where.AND = andParts;

    if (visibility === 'public') {
      where.isPublic = true;
    } else if (visibility === 'private') {
      where.isPublic = false;
    }

    const [trees, total] = await Promise.all([
      prisma.tree.findMany({
        where,
        include: {
          owners: {
            include: {
              user: {
                select: { id: true, username: true, email: true },
              },
            },
            orderBy: { isPrimary: 'desc' },
          },
          treeMaintainers: {
            include: {
              user: {
                select: { id: true, username: true, email: true },
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
            },
          },
          _count: {
            select: {
              permissions: true,
              accessRequests: { where: { status: 'pending' } },
              invitationLinks: { where: { isRevoked: false } },
              userIndividualLinks: true,
            },
          },
        },
        orderBy: sort === 'name' ? { name: order } : sort === 'updatedAt' ? { updatedAt: order } : { createdAt: order },
        skip,
        take: limit,
      }),
      prisma.tree.count({ where }),
    ]);

    // Fallback: lookup GedcomFile by fileId when gedcomFile relation is null
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
                  eventsCount: true,
                  notesCount: true,
                  sourcesCount: true,
                },
              })
            ).map((gf) => [gf.fileId, gf])
          )
        : {};

    const gfStats = (tree) => {
      const gf = tree.gedcomFile ?? gedcomByFileId[tree.fileId];
      return {
        individualsCount: gf?.individualsCount ?? 0,
        familiesCount: gf?.familiesCount ?? 0,
        placesCount: gf?.placesCount ?? 0,
        eventsCount: gf?.eventsCount ?? 0,
        notesCount: gf?.notesCount ?? 0,
        sourcesCount: gf?.sourcesCount ?? 0,
      };
    };

    // Transform for cleaner response
    const transformedTrees = trees.map(tree => {
      const stats = gfStats(tree);
      return {
        id: tree.id,
        fileId: tree.fileId,
        name: tree.name,
        description: tree.description,
        isPublic: tree.isPublic,
        createdAt: tree.createdAt,
        updatedAt: tree.updatedAt,
        ...stats,
        owners: tree.owners.map(o => ({
          id: o.id,
          userId: o.user.id,
          username: o.user.username,
          email: o.user.email,
          isPrimary: o.isPrimary,
          createdAt: o.createdAt,
        })),
        maintainers: tree.treeMaintainers.map(m => ({
          id: m.id,
          userId: m.user.id,
          username: m.user.username,
          email: m.user.email,
          createdAt: m.createdAt,
        })),
        counts: {
          permissions: tree._count.permissions,
          pendingRequests: tree._count.accessRequests,
          activeInvitations: tree._count.invitationLinks,
          linkedUsers: tree._count.userIndividualLinks,
        },
      };
    });

    return NextResponse.json({
      trees: transformedTrees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List trees error:', error);
    return NextResponse.json(
      { error: 'Failed to list trees' },
      { status: 500 }
    );
  }
}


