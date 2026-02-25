import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = await prisma.message.count({
    where: {
      recipientId: user.id,
      isRead: false,
    },
  });

  return NextResponse.json({ count });
}
