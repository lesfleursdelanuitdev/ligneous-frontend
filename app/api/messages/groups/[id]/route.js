import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const group = await prisma.messageGroup.findFirst({
    where: { id, members: { some: { id: user.id } } },
    include: {
      creator: { select: { id: true, username: true, name: true } },
      members: { select: { id: true, username: true, name: true } },
      _count: { select: { messages: true } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  return NextResponse.json({ group });
}

export async function PATCH(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const group = await prisma.messageGroup.findFirst({
    where: { id, createdBy: user.id },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found or not the creator' }, { status: 404 });
  }

  const body = await request.json();
  const { name, description } = body;

  const updated = await prisma.messageGroup.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
    include: {
      creator: { select: { id: true, username: true, name: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({ group: updated });
}

export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const group = await prisma.messageGroup.findFirst({
    where: { id, createdBy: user.id },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found or not the creator' }, { status: 404 });
  }

  await prisma.messageGroup.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
