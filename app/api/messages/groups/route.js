import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groups = await prisma.messageGroup.findMany({
    where: { members: { some: { id: user.id } } },
    include: {
      creator: { select: { id: true, username: true, name: true } },
      _count: { select: { members: true, messages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ groups });
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, memberIds, treeId } = body;

  if (!name) {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
  }

  const allMemberIds = [...new Set([user.id, ...(memberIds || [])])];

  const group = await prisma.messageGroup.create({
    data: {
      name,
      description: description || null,
      createdBy: user.id,
      treeId: treeId || null,
      members: { connect: allMemberIds.map((id) => ({ id })) },
    },
    include: {
      creator: { select: { id: true, username: true, name: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}
