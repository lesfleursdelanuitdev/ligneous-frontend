import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';

/**
 * GET /api/trees/[treeId]/event-types
 * List event types (standard + file-specific custom) for use in validation and UI.
 */
export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'event');
    if (error) return error;

    const eventTypes = await prisma.eventType.findMany({
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
        ownerScope: true,
        isCustom: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ data: eventTypes });
  } catch (err) {
    console.error('Event types list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
