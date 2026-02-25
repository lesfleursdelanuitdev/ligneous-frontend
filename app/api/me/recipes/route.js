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
    userId: user.id,
    contentType: 'recipe',
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { recipeIngredients: { contains: search, mode: 'insensitive' } },
    ];
  }

  const validSortFields = ['createdAt', 'updatedAt', 'title'];
  const orderField = validSortFields.includes(sort) ? sort : 'createdAt';
  const orderDir = sortDirection === 'asc' ? 'asc' : 'desc';

  const [recipes, total] = await Promise.all([
    prisma.userContent.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, name: true } },
      },
      orderBy: { [orderField]: orderDir },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.userContent.count({ where }),
  ]);

  return NextResponse.json({
    data: recipes,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, recipeIngredients, recipeInstructions, visibility } = body;

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }

  const recipe = await prisma.userContent.create({
    data: {
      userId: user.id,
      contentType: 'recipe',
      title,
      content,
      recipeIngredients: recipeIngredients || null,
      recipeInstructions: recipeInstructions || null,
      visibility: visibility || 'followers_only',
    },
    include: {
      user: { select: { id: true, username: true, name: true } },
    },
  });

  return NextResponse.json({ data: recipe }, { status: 201 });
}
