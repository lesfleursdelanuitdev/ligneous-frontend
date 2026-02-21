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
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const advancedConditionsJson = searchParams.get('advanced_conditions');

    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
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
      const fields = { username: 'username', email: 'email', name: 'name' };
      const dbField = fields[c.field];
      if (!dbField) continue;
      if (op === 'contains') andParts.push({ [dbField]: { contains: val, ...mode } });
      else if (op === 'not_contains') andParts.push({ NOT: { [dbField]: { contains: val, ...mode } } });
      else if (op === 'equals') andParts.push({ [dbField]: { equals: val, ...mode } });
      else if (op === 'not_equals') andParts.push({ NOT: { [dbField]: { equals: val, ...mode } } });
      else if (op === 'starts_with') andParts.push({ [dbField]: { startsWith: val, ...mode } });
      else if (op === 'ends_with') andParts.push({ [dbField]: { endsWith: val, ...mode } });
    }
    if (andParts.length > 0) where.AND = andParts;

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const sortableFields = {
      username: { username: order },
      email: { email: order },
      createdAt: { createdAt: order },
      lastLoginAt: { lastLoginAt: order },
    };
    const orderBy = sortableFields[sort] || { createdAt: 'desc' };

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
        orderBy,
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

