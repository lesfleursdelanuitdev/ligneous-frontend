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
  const sort = searchParams.get('sort') || 'createdAt';
  const sortDirection = searchParams.get('sortDirection') || 'desc';

  const where = {
    entityType: 'user_content',
    entityId: {
      in: (await prisma.userContent.findMany({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      })).map((c) => c.id),
    },
  };

  if (search) {
    where.OR = [
      { fileId: { contains: search, mode: 'insensitive' } },
      { mediaId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const validSortFields = ['createdAt', 'fileId'];
  const orderField = validSortFields.includes(sort) ? sort : 'createdAt';
  const orderDir = sortDirection === 'asc' ? 'asc' : 'desc';

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { [orderField]: orderDir },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.media.count({ where }),
  ]);

  return NextResponse.json({
    data: media,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}
