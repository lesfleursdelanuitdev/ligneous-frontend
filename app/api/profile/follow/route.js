import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { userId: targetUserId } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const existing = await prisma.follow.findFirst({
    where: { followerId: user.id, followeeId: targetUserId },
  });

  if (existing) {
    return NextResponse.json({ error: 'Already following this user' }, { status: 409 });
  }

  const follow = await prisma.follow.create({
    data: { followerId: user.id, followeeId: targetUserId },
  });

  return NextResponse.json({ follow }, { status: 201 });
}

export async function DELETE(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId');

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
  }

  const existing = await prisma.follow.findFirst({
    where: { followerId: user.id, followeeId: targetUserId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not following this user' }, { status: 404 });
  }

  await prisma.follow.delete({ where: { id: existing.id } });

  return NextResponse.json({ success: true });
}
