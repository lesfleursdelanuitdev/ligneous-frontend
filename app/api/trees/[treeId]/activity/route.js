import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { can, getFileIdFromTreeId } from '@ligneous/authz';
import { prisma } from '@/lib/database/prisma';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    if (!treeId) {
      return NextResponse.json({ error: 'Tree ID is required' }, { status: 400 });
    }

    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await can(
      { userId: user.id, entity: 'tree', action: 'update', scope: 'tree', treeId },
      prisma
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fileUuid = await getFileIdFromTreeId(treeId, prisma);
    if (!fileUuid) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    // Fetch recent logs and deduplicate by batchId, keeping first (most recent) per batch.
    const logs = await prisma.changeLog.findMany({
      where: { fileUuid, undoneAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        batchId: true,
        summary: true,
        entityType: true,
        operation: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    });

    const seen = new Set();
    const batches = [];
    for (const log of logs) {
      if (!seen.has(log.batchId)) {
        seen.add(log.batchId);
        batches.push({
          batchId: log.batchId,
          summary: log.summary,
          entityType: log.entityType,
          operation: log.operation,
          createdAt: log.createdAt,
          user: log.user,
        });
      }
      if (batches.length >= 20) break;
    }

    return NextResponse.json({ activity: batches });
  } catch (error) {
    console.error('Tree activity error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
