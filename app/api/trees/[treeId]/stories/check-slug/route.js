import { NextResponse } from 'next/server';
import { normalizeStorySlugInput } from '@ligneous/story-creator';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'story');
    if (error) return error;

    const url = new URL(request.url);
    const slugRaw = url.searchParams.get('slug') ?? '';
    const excludeId = url.searchParams.get('excludeId')?.trim() || undefined;

    const slug = normalizeStorySlugInput(slugRaw);
    if (!slug) return NextResponse.json({ available: false });

    const taken = await prisma.story.findFirst({
      where: {
        treeId,
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({ available: !taken });
  } catch (err) {
    console.error('Story check-slug error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
