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

    // Get total individuals and families count across all owned trees
    const ownedTrees = await prisma.tree.findMany({
      where: {
        owners: {
          some: { userId: user.id },
        },
      },
      select: { fileId: true },
    });

    // Fetch stats from Go API for each tree
    const goApiUrl = process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8090';
    let totalIndividuals = 0;
    let totalFamilies = 0;

    for (const tree of ownedTrees) {
      try {
        const goResponse = await fetch(`${goApiUrl}/api/v1/files/${tree.fileId}`);
        if (goResponse.ok) {
          const goData = await goResponse.json();
          const fileInfo = goData.data;
          totalIndividuals += fileInfo.individuals_count || 0;
          totalFamilies += fileInfo.families_count || 0;
        }
      } catch (error) {
        console.error(`Failed to fetch stats for tree ${tree.fileId}:`, error.message);
      }
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


