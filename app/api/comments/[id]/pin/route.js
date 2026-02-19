// POST /api/comments/[id]/pin - Toggle or set pinned (moderator only)

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { canModerateComments } from '@/lib/permissions/comments';
import { prisma } from '@/lib/database/prisma';

const userSelect = {
  id: true,
  username: true,
  name: true,
};

/**
 * POST - Toggle isPinned.
 * Body (optional): { pinned: boolean }
 */
export async function POST(request, { params }) {
  const { user } = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, treeId: true, isPinned: true, deletedAt: true },
  });

  if (!comment || comment.deletedAt) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const canModerate = await canModerateComments(user.id, comment.treeId);
  if (!canModerate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let pinned = !comment.isPinned;
  try {
    const body = await request.json();
    if (typeof body.pinned === 'boolean') pinned = body.pinned;
  } catch {
    // no body
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { isPinned: pinned },
    include: {
      user: { select: userSelect },
      replies: { include: { user: { select: userSelect } } },
    },
  });

  return NextResponse.json({ comment: updated });
}
