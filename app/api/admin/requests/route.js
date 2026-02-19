// GET /api/admin/requests - List all pending access requests (superuser only)
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
    const status = searchParams.get('status') || 'pending'; // 'pending', 'approved', 'rejected', 'all'
    const type = searchParams.get('type'); // 'basic_access', 'individual_link', 'maintainer_role', 'owner_role'

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (status !== 'all') {
      where.status = status;
    }

    if (type) {
      where.requestType = type;
    }

    // Get requests with user and tree info
    const [requests, total, statusCounts] = await Promise.all([
      prisma.accessRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              name: true,
            },
          },
          tree: {
            select: {
              id: true,
              name: true,
              fileId: true,
              isPublic: true,
            },
          },
          responder: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accessRequest.count({ where }),
      // Get counts for each status
      prisma.accessRequest.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Transform status counts to object
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };
    statusCounts.forEach(sc => {
      counts[sc.status] = sc._count;
    });

    return NextResponse.json({
      requests,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List requests error:', error);
    return NextResponse.json(
      { error: 'Failed to list access requests' },
      { status: 500 }
    );
  }
}


