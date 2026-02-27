import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

/**
 * GET /api/trees/[treeId]/tags
 * List GEDCOM tags (standard + file-specific custom) for use in validation and UI.
 */
export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const tags = await prisma.gedcomTag.findMany({
      where: {
        OR: [
          { fileUuid: null },
          ...(fileUuid ? [{ fileUuid }] : []),
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { tag: 'asc' }],
      select: {
        id: true,
        tag: true,
        label: true,
        scope: true,
        isCustom: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ data: tags });
  } catch (err) {
    console.error('Tags list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
