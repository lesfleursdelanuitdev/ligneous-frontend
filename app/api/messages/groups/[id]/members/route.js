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
      members: { select: { id: true, username: true, name: true } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  return NextResponse.json({ members: group.members });
}

export async function POST(request, { params }) {
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
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  await prisma.messageGroup.update({
    where: { id },
    data: { members: { connect: { id: userId } } },
  });

  return NextResponse.json({ success: true }, { status: 201 });
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

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
  }

  await prisma.messageGroup.update({
    where: { id },
    data: { members: { disconnect: { id: userId } } },
  });

  return NextResponse.json({ success: true });
}
