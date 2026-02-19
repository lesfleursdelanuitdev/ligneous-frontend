// GET /api/user-content - List content (with privacy filtering)
// POST /api/user-content - Create content

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { canViewContent } from '@/lib/permissions/user-content';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request); // Optional (for public content)
  const { searchParams } = new URL(request.url);
  const privacy = searchParams.get('privacy'); // 'all', 'public', 'followers', 'private'
  const userId = searchParams.get('userId'); // Filter by creator
  const contentType = searchParams.get('contentType'); // Filter by content type
  
  const where = {};
  
  // Privacy filtering
  if (privacy === 'public') {
    where.visibility = 'public';
  } else if (privacy === 'followers' && user) {
    // Get users that current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: user.id, isActive: true },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    where.userId = { in: followingIds };
    where.visibility = { in: ['followers_only', 'public'] };
  } else if (privacy === 'private' && user) {
    where.userId = user.id;
    where.visibility = 'private';
  } else if (user) {
    // Show user's own content + public content + followed users' content
    const following = await prisma.follow.findMany({
      where: { followerId: user.id, isActive: true },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    
    where.OR = [
      { userId: user.id }, // Own content
      { visibility: 'public' }, // Public content
      { 
        userId: { in: followingIds },
        visibility: { in: ['followers_only', 'public'] },
      }, // Followed users' content
    ];
  } else {
    // Unauthenticated: only public
    where.visibility = 'public';
  }
  
  // Filter by creator
  if (userId) {
    where.userId = userId;
  }
  
  // Filter by content type
  if (contentType) {
    where.contentType = contentType;
  }
  
  // Exclude deleted content
  where.deletedAt = null;
  
  const content = await prisma.userContent.findMany({
    where,
    include: {
      user: {
        select: { id: true, username: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit to 50 items
  });
  
  return NextResponse.json({ content });
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const body = await request.json();
  const { contentType, title, content, visibility, treeId, entityType, entityId } = body;
  
  // Validate
  if (!contentType || !content) {
    return NextResponse.json(
      { error: 'Content type and content are required' },
      { status: 400 }
    );
  }
  
  // Validate visibility
  const validVisibility = ['public', 'followers_only', 'collaborators_only', 'private'];
  if (visibility && !validVisibility.includes(visibility)) {
    return NextResponse.json(
      { error: 'Invalid visibility level' },
      { status: 400 }
    );
  }
  
  // Create content
  const userContent = await prisma.userContent.create({
    data: {
      userId: user.id,
      contentType,
      title,
      content,
      visibility: visibility || 'followers_only',
      treeId: treeId || null,
      entityType: entityType || null,
      entityId: entityId || null,
    },
    include: {
      user: {
        select: { id: true, username: true, name: true },
      },
    },
  });
  
  return NextResponse.json({ content: userContent }, { status: 201 });
}

