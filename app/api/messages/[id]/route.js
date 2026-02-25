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
  });

  let messages;
  if (group) {
    messages = await prisma.message.findMany({
      where: { groupId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, name: true } },
      },
    });
  } else {
    messages = await prisma.message.findMany({
      where: {
        groupId: null,
        OR: [
          { senderId: user.id, recipientId: id },
          { senderId: id, recipientId: user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, name: true } },
      },
    });
  }

  return NextResponse.json({ messages, isGroup: !!group, group: group || null });
}

export async function PATCH(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (body.markRead) {
    const group = await prisma.messageGroup.findFirst({
      where: { id, members: { some: { id: user.id } } },
    });

    if (group) {
      await prisma.message.updateMany({
        where: { groupId: id, isRead: false, senderId: { not: user.id } },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      await prisma.message.updateMany({
        where: { senderId: id, recipientId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'No action specified' }, { status: 400 });
}
