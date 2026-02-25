import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const directMessages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: user.id }, { recipientId: user.id }],
      groupId: null,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, username: true, name: true } },
      recipient: { select: { id: true, username: true, name: true } },
    },
  });

  const dmConversations = new Map();
  for (const msg of directMessages) {
    const otherId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
    if (!otherId) continue;
    if (!dmConversations.has(otherId)) {
      const other = msg.senderId === user.id ? msg.recipient : msg.sender;
      dmConversations.set(otherId, {
        type: 'direct',
        id: otherId,
        name: other?.name || other?.username || 'Unknown',
        username: other?.username,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        unreadCount: 0,
      });
    }
  }

  const unreadCounts = await prisma.message.groupBy({
    by: ['senderId'],
    where: { recipientId: user.id, isRead: false, groupId: null },
    _count: true,
  });
  for (const uc of unreadCounts) {
    const conv = dmConversations.get(uc.senderId);
    if (conv) conv.unreadCount = uc._count;
  }

  const groups = await prisma.messageGroup.findMany({
    where: { members: { some: { id: user.id } } },
    include: {
      _count: { select: { members: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, createdAt: true } },
    },
  });

  const groupConversations = groups.map((g) => ({
    type: 'group',
    id: g.id,
    name: g.name,
    description: g.description,
    memberCount: g._count.members,
    lastMessage: g.messages[0]?.content || null,
    lastMessageAt: g.messages[0]?.createdAt || g.createdAt,
    unreadCount: 0,
  }));

  const conversations = [...Array.from(dmConversations.values()), ...groupConversations]
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  return NextResponse.json({ conversations });
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { recipientId, groupId, content, subject } = body;

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }
  if (!recipientId && !groupId) {
    return NextResponse.json({ error: 'recipientId or groupId is required' }, { status: 400 });
  }

  if (groupId) {
    const group = await prisma.messageGroup.findFirst({
      where: { id: groupId, members: { some: { id: user.id } } },
    });
    if (!group) {
      return NextResponse.json({ error: 'Group not found or not a member' }, { status: 404 });
    }
  }

  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      recipientId: recipientId || null,
      groupId: groupId || null,
      content,
      subject: subject || null,
    },
    include: {
      sender: { select: { id: true, username: true, name: true } },
      recipient: { select: { id: true, username: true, name: true } },
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
