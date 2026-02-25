import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request, { params }) {
  const currentUser = await getAuthenticatedUser(request);
  const { id: userId } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (profile?.profileVisibility === 'private' && currentUser?.id !== userId) {
    return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
  }

  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followeeId: userId } }),
    prisma.follow.count({ where: { followerId: userId, followeeId: { not: null } } }),
  ]);

  let isFollowing = false;
  if (currentUser && currentUser.id !== userId) {
    const follow = await prisma.follow.findFirst({
      where: { followerId: currentUser.id, followeeId: userId },
    });
    isFollowing = !!follow;
  }

  const treesOwned = await prisma.treeOwner.findMany({
    where: { userId },
    include: { tree: { select: { id: true, name: true, fileId: true, isPublic: true } } },
  });

  const publicTrees = treesOwned
    .filter((to) => to.tree.isPublic || currentUser?.id === userId)
    .map((to) => ({ ...to.tree, role: 'owner' }));

  const recentContent = await prisma.userContent.findMany({
    where: {
      userId,
      deletedAt: null,
      visibility: currentUser?.id === userId ? undefined : 'public',
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      _count: { select: { likes: true, contentComments: true } },
    },
  });

  return NextResponse.json({
    user: targetUser,
    profile: profile || {},
    stats: { followersCount, followingCount, treesCount: publicTrees.length },
    isFollowing,
    connectedTrees: publicTrees,
    recentContent,
  });
}
