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
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const visibility = searchParams.get('visibility'); // 'public', 'private', or null

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fileId: { contains: search, mode: 'insensitive' } },
      ];
    }

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
          _count: {
            select: {
              permissions: true,
              accessRequests: { where: { status: 'pending' } },
              invitationLinks: { where: { isRevoked: false } },
              userIndividualLinks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tree.count({ where }),
    ]);

    // Transform for cleaner response
    const transformedTrees = trees.map(tree => ({
      id: tree.id,
      fileId: tree.fileId,
      name: tree.name,
      description: tree.description,
      isPublic: tree.isPublic,
      createdAt: tree.createdAt,
      updatedAt: tree.updatedAt,
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
    }));

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


