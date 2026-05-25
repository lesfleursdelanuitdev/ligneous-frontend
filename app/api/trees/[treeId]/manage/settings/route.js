import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { isTreeOwner, isTreeMaintainer } from '@ligneous/authz';
import { prisma } from '@/lib/database/prisma';

async function requireManage(request, treeId) {
  const { user } = await getAuthenticatedUser(request);
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const [owner, maintainer] = await Promise.all([
    isTreeOwner(user.id, treeId, prisma),
    isTreeMaintainer(user.id, treeId, prisma),
  ]);

  if (!owner && !maintainer) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user: { ...user, isOwner: owner }, error: null };
}

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    if (!treeId) return NextResponse.json({ error: 'Tree ID is required' }, { status: 400 });

    const { user, error } = await requireManage(request, treeId);
    if (error) return error;

    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
      select: { id: true, name: true, description: true, isPublic: true },
    });

    if (!tree) return NextResponse.json({ error: 'Tree not found' }, { status: 404 });

    return NextResponse.json({ settings: tree, isOwner: user.isOwner });
  } catch (err) {
    console.error('GET manage/settings error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { treeId } = await params;
    if (!treeId) return NextResponse.json({ error: 'Tree ID is required' }, { status: 400 });

    const { error } = await requireManage(request, treeId);
    if (error) return error;

    const body = await request.json();
    const allowed = ['name', 'description', 'isPublic'];
    const data = {};

    for (const field of allowed) {
      if (field in body) data[field] = body[field];
    }

    if ('name' in data && (typeof data.name !== 'string' || !data.name.trim())) {
      return NextResponse.json({ error: 'name is required and must be a non-empty string' }, { status: 422 });
    }
    if ('name' in data) data.name = data.name.trim();
    if ('description' in data) {
      data.description = typeof data.description === 'string' && data.description.trim()
        ? data.description.trim()
        : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 422 });
    }

    const updated = await prisma.tree.update({
      where: { id: treeId },
      data,
      select: { id: true, name: true, description: true, isPublic: true },
    });

    return NextResponse.json({ settings: updated });
  } catch (err) {
    console.error('PATCH manage/settings error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
