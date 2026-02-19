/**
 * Trees API Route
 * Handles listing and creating trees
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireAuth, getAuthenticatedUser } from '@/lib/middleware';
import { isWebsiteOwner, addTreeOwner } from '@/lib/permissions';

// GET - List trees
export async function GET(request) {
  try {
    // 1. Get authenticated user (optional for public trees)
    const { user } = await getAuthenticatedUser(request);
    
    // 2. Get filter from query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'public', 'owned', or null for all

    // 3. Build query based on user permissions and filter
    let whereClause = {};

    if (filter === 'public') {
      // Only public trees
      whereClause = { isPublic: true };
    } else if (filter === 'owned' && user) {
      // Trees owned or maintained by user
      if (user.isWebsiteOwner) {
        // Superuser "owns" all trees
        whereClause = {};
      } else {
        whereClause = {
          OR: [
            { owners: { some: { userId: user.id } } },
            { treeMaintainers: { some: { userId: user.id } } },
          ],
        };
      }
    } else if (!user) {
      // Unauthenticated: only public trees
      whereClause = { isPublic: true };
    } else if (user.isWebsiteOwner) {
      // Website owner: all trees
      whereClause = {};
    } else {
      // Regular user: public trees + trees they have access to
      whereClause = {
        OR: [
          { isPublic: true },
          {
            owners: {
              some: {
                userId: user.id,
              },
            },
          },
          {
            treeMaintainers: {
              some: {
                userId: user.id,
              },
            },
          },
          {
            permissions: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      };
    }

    // 3. Query trees with related data
    const trees = await prisma.tree.findMany({
      where: whereClause,
      include: {
        owners: {
          select: {
            userId: true,
            isPrimary: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        treeMaintainers: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            owners: true,
            treeMaintainers: true,
            userIndividualLinks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 4. For each tree, get stats from Go API
    const goApiUrl = process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8090';
    const treesWithStats = await Promise.all(
      trees.map(async (tree) => {
        try {
          const goResponse = await fetch(
            `${goApiUrl}/api/v1/files/${tree.fileId}`,
            { next: { revalidate: 60 } } // Cache for 60 seconds
          );
          
          if (goResponse.ok) {
            const goData = await goResponse.json();
            const fileInfo = goData.data;
            
            return {
              ...tree,
              individualsCount: fileInfo.individuals_count || 0,
              familiesCount: fileInfo.families_count || 0,
              parseStatus: fileInfo.status || 'ready',
            };
          }
        } catch (error) {
          console.error(`Failed to fetch Go API data for tree ${tree.id}:`, error.message);
        }
        
        // Return tree without Go API data if fetch fails
        return {
          ...tree,
          individualsCount: 0,
          familiesCount: 0,
          parseStatus: 'unknown',
        };
      })
    );

    return NextResponse.json({
      success: true,
      trees: treesWithStats,
    });
  } catch (error) {
    console.error('Trees listing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new tree
export async function POST(request) {
  // Require authentication
  const { user, response } = await requireAuth(request);
  if (response) return response;

  try {
    const body = await request.json();
    const { fileId, name, description, isPublic = false } = body;

    // Validate required fields
    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tree name is required' },
        { status: 400 }
      );
    }

    // Check if a tree with this fileId already exists
    const existingTree = await prisma.tree.findUnique({
      where: { fileId },
    });

    if (existingTree) {
      return NextResponse.json(
        { error: 'A tree with this file already exists' },
        { status: 400 }
      );
    }

    // Verify the file exists in Go API
    const goApiUrl = process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8090';
    try {
      const goResponse = await fetch(`${goApiUrl}/api/v1/files/${fileId}`);
      if (!goResponse.ok) {
        return NextResponse.json(
          { error: 'GEDCOM file not found. Please upload the file first.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Go API check failed:', error);
      return NextResponse.json(
        { error: 'Unable to verify GEDCOM file. Please try again.' },
        { status: 500 }
      );
    }

    // Create the tree and add the user as primary owner in a transaction
    const tree = await prisma.$transaction(async (tx) => {
      // Create tree
      const newTree = await tx.tree.create({
        data: {
          fileId,
          name: name.trim(),
          description: description?.trim() || null,
          isPublic,
        },
      });

      // Add uploader as primary owner
      await tx.treeOwner.create({
        data: {
          treeId: newTree.id,
          userId: user.id,
          isPrimary: true,
        },
      });

      return newTree;
    });

    // Fetch the tree with owner info
    const treeWithOwner = await prisma.tree.findUnique({
      where: { id: tree.id },
      include: {
        owners: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tree: treeWithOwner,
      message: 'Tree created successfully',
    });
  } catch (error) {
    console.error('Create tree error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tree' },
      { status: 500 }
    );
  }
}
