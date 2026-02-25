import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const following = await prisma.follow.findMany({
    where: { followerId: user.id, followeeId: { not: null } },
    include: {
      followee: { select: { id: true, username: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    following: following.map((f) => ({
      id: f.id,
      user: f.followee,
      followedAt: f.createdAt,
    })),
  });
}
