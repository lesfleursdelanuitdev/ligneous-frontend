// GET /api/comments - List comments for entity
// POST /api/comments - Create comment

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { can, isPublicTree } from '@ligneous/authz';
import { canComment, canModerateComments } from '@/lib/permissions/comments';
import { prisma } from '@/lib/database/prisma';

const userSelect = {
  id: true,
  username: true,
  name: true,
};

/**
 * GET - List comments for an entity.
 * Query: entityType, entityId, treeId (required), limit, offset
 * Read access to tree/entity required (public tree allows unauthenticated).
 */
export async function GET(request) {
  const { user } = await getAuthenticatedUser(request);
  const userId = user?.id ?? null;

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  const treeId = searchParams.get('treeId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!entityType || !entityId || !treeId) {
    return NextResponse.json(
      { error: 'entityType, entityId, and treeId are required' },
      { status: 400 }
    );
  }

  const entityMap = { story: 'story', discussion_post: 'openQuestion', individual: 'individual', family: 'family' };
  const authzEntity = entityMap[entityType] ?? 'openQuestion';
  const canRead = userId
    ? await can({ userId, entity: authzEntity, action: 'read', scope: 'tree', treeId }, prisma)
    : await isPublicTree(treeId, prisma);
  if (!canRead) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const where = {
    entityType,
    entityId,
    treeId,
    deletedAt: null,
    parentId: null,
  };
  const canModerate = userId
    ? await canModerateComments(userId, treeId)
    : false;
  if (!canModerate) {
    where.isHidden = false;
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: { select: userSelect },
        replies: {
          where: { deletedAt: null, ...(canModerate ? {} : { isHidden: false }) },
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
      skip: offset,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return NextResponse.json({
    comments,
    pagination: { total, limit, offset },
  });
}

/**
 * POST - Create a comment.
 * Body: entityType, entityId, treeId, content, parentId?
 */
export async function POST(request) {
  const { user } = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { entityType, entityId, treeId, content, parentId } = body;
  if (!entityType || !entityId || !treeId || typeof content !== 'string') {
    return NextResponse.json(
      { error: 'entityType, entityId, treeId, and content are required' },
      { status: 400 }
    );
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
  }

  const canAdd = await canComment(user.id, entityType, entityId, treeId);
  if (!canAdd) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = {
    entityType,
    entityId,
    treeId,
    userId: user.id,
    content: trimmed,
    parentId: parentId || null,
  };

  const comment = await prisma.comment.create({
    data,
    include: {
      user: { select: userSelect },
      parent: parentId ? { select: { id: true } } : false,
    },
  });

  return NextResponse.json({ comment });
}
