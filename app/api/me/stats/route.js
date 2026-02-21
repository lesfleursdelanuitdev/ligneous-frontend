// GET /api/me/stats - Get current user's dashboard stats
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
  const { user, response } = await requireAuth(request);
  if (response) return response;

  try {
    // Debug: Log user ID and type
    console.log('[Stats] User ID:', user.id, 'Type:', typeof user.id);
    
    // Get stats for the current user
    const [
      treesOwned,
      treesMaintained,
      pendingRequests,
      linkedIndividuals,
    ] = await Promise.all([
      // Trees owned by user
      prisma.treeOwner.count({
        where: { userId: user.id },
      }),
      // Trees maintained by user
      prisma.treeMaintainer.count({
        where: { userId: user.id },
      }),
      // Pending access requests (for trees user owns/maintains)
      user.isWebsiteOwner
        ? prisma.accessRequest.count({
            where: { status: 'pending' },
          })
        : prisma.accessRequest.count({
            where: {
              status: 'pending',
              tree: {
                OR: [
                  { owners: { some: { userId: user.id } } },
                  { treeMaintainers: { some: { userId: user.id } } },
                ],
              },
            },
          }),
      // Linked individuals
      prisma.userIndividualLink.count({
        where: { userId: user.id },
      }),
    ]);

    // Get total individuals and families count from GedcomFile (lookup by Tree.fileId)
    const ownedTrees = await prisma.tree.findMany({
      where: {
        owners: {
          some: { userId: user.id },
        },
      },
      select: { fileId: true },
    });

    const fileIds = ownedTrees.map((t) => t.fileId).filter(Boolean);
    const gedcomFiles =
      fileIds.length > 0
        ? await prisma.gedcomFile.findMany({
            where: { fileId: { in: fileIds } },
            select: { individualsCount: true, familiesCount: true },
          })
        : [];

    let totalIndividuals = 0;
    let totalFamilies = 0;
    for (const gf of gedcomFiles) {
      totalIndividuals += gf.individualsCount ?? 0;
      totalFamilies += gf.familiesCount ?? 0;
    }

    // Get collaborators (unique users who have access to trees user owns)
    const collaborators = await prisma.user.count({
      where: {
        OR: [
          {
            treeOwners: {
              some: {
                tree: {
                  owners: { some: { userId: user.id } },
                },
                userId: { not: user.id },
              },
            },
          },
          {
            treeMaintainers: {
              some: {
                tree: {
                  owners: { some: { userId: user.id } },
                },
              },
            },
          },
          {
            permissions: {
              some: {
                tree: {
                  owners: { some: { userId: user.id } },
                },
              },
            },
          },
        ],
      },
    });

    // Debug: Log results
    console.log('[Stats] Results:', {
      treesOwned,
      treesMaintained,
      pendingRequests,
      linkedIndividuals,
      totalIndividuals,
      totalFamilies,
      collaborators,
    });

    return NextResponse.json({
      treesOwned,
      treesMaintained,
      pendingRequests,
      linkedIndividuals,
      totalIndividuals,
      totalFamilies,
      collaborators,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard stats' },
      { status: 500 }
    );
  }
}


