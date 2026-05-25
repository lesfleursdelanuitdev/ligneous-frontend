import { NextResponse } from 'next/server';
import { isTreeOwner, isTreeMaintainer } from '@ligneous/authz';
import { prisma } from '@/lib/database/prisma';
import { getAuthenticatedUser } from '@/lib/middleware';
import { getFileIdFromTreeId } from '@/lib/tree-access';
import { runTreeHealthChecks } from '@/lib/health/tree-checks';

/**
 * GET /api/trees/[treeId]/manage/health
 * Runs all tree health checks and returns results.
 * Always fresh — no DB caching. Auth: tree owner or maintainer only.
 */
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

    const [owner, maintainer] = await Promise.all([
      isTreeOwner(user.id, treeId, prisma),
      isTreeMaintainer(user.id, treeId, prisma),
    ]);
    if (!owner && !maintainer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fileUuid = await getFileIdFromTreeId(treeId);
    if (!fileUuid) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    const results = await runTreeHealthChecks(fileUuid, treeId, prisma);
    const totalIssues = results.reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({ results, totalIssues, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Tree health check error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
