import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '20', 10)));
  const search = searchParams.get('search') || '';
  const contentType = searchParams.get('contentType') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const sortDirection = searchParams.get('sortDirection') || 'desc';

  const where = {
    userId: user.id,
    deletedAt: null,
  };

  if (contentType) {
    where.contentType = contentType;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const validSortFields = ['createdAt', 'updatedAt', 'title', 'contentType'];
  const orderField = validSortFields.includes(sort) ? sort : 'createdAt';
  const orderDir = sortDirection === 'asc' ? 'asc' : 'desc';

  const [posts, total] = await Promise.all([
    prisma.userContent.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, name: true } },
        _count: { select: { likes: true, contentComments: true, shares: true } },
      },
      orderBy: { [orderField]: orderDir },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.userContent.count({ where }),
  ]);

  return NextResponse.json({
    data: posts,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { contentType, title, content, visibility, treeId, entityType, entityId } = body;

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const validTypes = ['research_update', 'family_story', 'research_discovery', 'collaboration_request', 'research_log'];
  const type = validTypes.includes(contentType) ? contentType : 'family_story';

  const post = await prisma.userContent.create({
    data: {
      userId: user.id,
      contentType: type,
      title: title || null,
      content,
      visibility: visibility || 'followers_only',
      treeId: treeId || null,
      entityType: entityType || null,
      entityId: entityId || null,
    },
    include: {
      user: { select: { id: true, username: true, name: true } },
      _count: { select: { likes: true, contentComments: true, shares: true } },
    },
  });

  return NextResponse.json({ data: post }, { status: 201 });
}
