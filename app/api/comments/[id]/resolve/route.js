// POST /api/comments/[id]/resolve - Toggle or set resolved

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { canEditComment, canModerateComments } from '@/lib/permissions/comments';
import { prisma } from '@/lib/database/prisma';

const userSelect = {
  id: true,
  username: true,
  name: true,
};

/**
 * POST - Toggle isResolved, or set resolved=true.
 * Body (optional): { resolved: boolean }
 */
export async function POST(request, { params }) {
  const { user } = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, userId: true, treeId: true, isResolved: true, deletedAt: true },
  });

  if (!comment || comment.deletedAt) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const isAuthor = comment.userId === user.id;
  const canModerate = await canModerateComments(user.id, comment.treeId);
  const canEdit = await canEditComment(user.id, id);
  if (!canEdit && !isAuthor && !canModerate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let resolved = !comment.isResolved;
  try {
    const body = await request.json();
    if (typeof body.resolved === 'boolean') resolved = body.resolved;
  } catch {
    // no body
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { isResolved: resolved },
    include: {
      user: { select: userSelect },
      replies: { include: { user: { select: userSelect } } },
    },
  });

  return NextResponse.json({ comment: updated });
}
