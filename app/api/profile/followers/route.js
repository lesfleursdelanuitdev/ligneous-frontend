import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const followers = await prisma.follow.findMany({
    where: { followeeId: user.id },
    include: {
      follower: { select: { id: true, username: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    followers: followers.map((f) => ({
      id: f.id,
      user: f.follower,
      followedAt: f.createdAt,
    })),
  });
}
