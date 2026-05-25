import { NextResponse } from 'next/server';
import { resolveTreeAuthz } from '@/lib/authz';
import { prisma } from '@/lib/database/prisma';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'individual', 'read');
    if (error) return error;

    const [individuals, families, sources, stories, events, media] = await Promise.all([
      prisma.gedcomIndividual.count({ where: { fileUuid } }),
      prisma.gedcomFamily.count({ where: { fileUuid } }),
      prisma.gedcomSource.count({ where: { fileUuid } }),
      prisma.story.count({ where: { treeId, deletedAt: null } }),
      prisma.gedcomEvent.count({ where: { fileUuid } }),
      prisma.gedcomMedia.count({ where: { fileUuid } }),
    ]);

    return NextResponse.json({ individuals, families, sources, stories, events, media });
  } catch (error) {
    console.error('Tree stats error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
