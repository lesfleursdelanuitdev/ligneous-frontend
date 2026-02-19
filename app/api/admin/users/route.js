// GET /api/admin/users - List all users (superuser only)
// POST /api/admin/users/:id/deactivate - Deactivate a user
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

export async function GET(request) {
  // Require superuser access
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', or null for all

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get users with counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          isWebsiteOwner: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              treeOwners: true,
              treeMaintainers: true,
              accessRequests: true,
              userIndividualLinks: true,
              sessions: {
                where: {
                  isRevoked: false,
                  expiresAt: { gt: new Date() },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Transform to a cleaner format
    const transformedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      isWebsiteOwner: u.isWebsiteOwner,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      treesOwned: u._count.treeOwners,
      treesMaintained: u._count.treeMaintainers,
      pendingRequests: u._count.accessRequests,
      linkedIndividuals: u._count.userIndividualLinks,
      activeSessions: u._count.sessions,
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    );
  }
}

