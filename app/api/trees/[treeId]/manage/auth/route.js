import { NextResponse } from 'next/server';
import { isTreeOwner, isTreeMaintainer } from '@ligneous/authz';
import { prisma } from '@/lib/database/prisma';
import { getAuthenticatedUser } from '@/lib/middleware';

/**
 * GET /api/trees/[treeId]/manage/auth
 * Returns { canManage: boolean } — true if the authenticated user is a tree
 * owner or maintainer. Unauthenticated requests always get false (not 401)
 * so the client can silently hide the manage link.
 */
export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    if (!treeId) {
      return NextResponse.json({ canManage: false }, { status: 400 });
    }

    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ canManage: false });
    }

    const [owner, maintainer] = await Promise.all([
      isTreeOwner(user.id, treeId, prisma),
      isTreeMaintainer(user.id, treeId, prisma),
    ]);

    return NextResponse.json({ canManage: owner || maintainer });
  } catch (error) {
    console.error('Manage auth check error:', error);
    return NextResponse.json({ canManage: false });
  }
}
