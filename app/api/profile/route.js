import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { userId: user.id },
    });
  }

  const [followersCount, followingCount, treesOwned, treesMaintained, treesContributed, individualLinks] = await Promise.all([
    prisma.follow.count({ where: { followeeId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id, followeeId: { not: null } } }),
    prisma.treeOwner.findMany({
      where: { userId: user.id },
      include: { tree: { select: { id: true, name: true, fileId: true } } },
    }),
    prisma.treeMaintainer.findMany({
      where: { userId: user.id },
      include: { tree: { select: { id: true, name: true, fileId: true } } },
    }),
    prisma.treeContributor.findMany({
      where: { userId: user.id },
      include: { tree: { select: { id: true, name: true, fileId: true } } },
    }),
    prisma.userIndividualLink.findMany({
      where: { userId: user.id },
      take: 50,
    }),
  ]);

  const connectedTrees = [
    ...treesOwned.map((to) => ({ ...to.tree, role: 'owner' })),
    ...treesMaintained.map((tm) => ({ ...tm.tree, role: 'maintainer' })),
    ...treesContributed.map((tc) => ({ ...tc.tree, role: 'contributor' })),
  ];

  const uniqueTrees = Array.from(new Map(connectedTrees.map((t) => [t.id, t])).values());

  return NextResponse.json({
    user: { id: user.id, username: user.username, name: user.name, email: user.email },
    profile,
    stats: { followersCount, followingCount, treesCount: uniqueTrees.length, individualsLinked: individualLinks.length },
    connectedTrees: uniqueTrees,
    connectedIndividuals: individualLinks,
  });
}

export async function PUT(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    displayName, bio, location, profilePhotoUrl, coverPhotoUrl,
    researchSurnames, researchLocations, researchTimePeriods, researchGoals,
    yearsResearching, specializations, certifications, languages,
    profileVisibility, activityVisibility, allowDirectMessages, allowFollowing,
  } = body;

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      ...(displayName !== undefined && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
      ...(coverPhotoUrl !== undefined && { coverPhotoUrl }),
      ...(researchSurnames !== undefined && { researchSurnames }),
      ...(researchLocations !== undefined && { researchLocations }),
      ...(researchTimePeriods !== undefined && { researchTimePeriods }),
      ...(researchGoals !== undefined && { researchGoals }),
      ...(yearsResearching !== undefined && { yearsResearching }),
      ...(specializations !== undefined && { specializations }),
      ...(certifications !== undefined && { certifications }),
      ...(languages !== undefined && { languages }),
      ...(profileVisibility !== undefined && { profileVisibility }),
      ...(activityVisibility !== undefined && { activityVisibility }),
      ...(allowDirectMessages !== undefined && { allowDirectMessages }),
      ...(allowFollowing !== undefined && { allowFollowing }),
    },
    create: {
      userId: user.id,
      displayName, bio, location,
    },
  });

  return NextResponse.json({ profile });
}
