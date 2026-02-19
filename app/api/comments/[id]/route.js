// PUT /api/comments/[id] - Update comment
// DELETE /api/comments/[id] - Soft-delete comment

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { canEditComment, canDeleteComment } from '@/lib/permissions/comments';
import { prisma } from '@/lib/database/prisma';

const userSelect = {
  id: true,
  username: true,
  name: true,
};

/**
 * PUT - Update comment content.
 * Body: content
 */
export async function PUT(request, { params }) {
  const { user } = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const canEdit = await canEditComment(user.id, id);
  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { content } = body;
  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }
  const trimmed = content.trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: { content: trimmed, isEdited: true },
    include: {
      user: { select: userSelect },
      replies: { include: { user: { select: userSelect } } },
    },
  });

  return NextResponse.json({ comment });
}

/**
 * DELETE - Soft-delete comment.
 */
export async function DELETE(request, { params }) {
  const { user } = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const canDelete = await canDeleteComment(user.id, id);
  if (!canDelete) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
