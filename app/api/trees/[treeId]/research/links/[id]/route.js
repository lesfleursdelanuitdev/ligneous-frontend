import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

export async function PATCH(request, { params }) {
  try {
    const { treeId, id } = await params;
    const { user, error } = await resolveTreeAccess(request, treeId, 'write');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.researchLink.findFirst({
      where: { id, treeId, userId },
    });
    if (!existing) {
      return Response.json({ error: 'Research link not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const data = {};
    if (body.label !== undefined) data.label = body.label?.trim() || existing.label;
    if (body.url !== undefined) data.url = body.url?.trim() || existing.url;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

    const item = await prisma.researchLink.update({
      where: { id },
      data,
    });

    return Response.json({ data: item });
  } catch (err) {
    return Response.json(
      { error: err?.message || 'Failed to update research link' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { treeId, id } = await params;
    const { user, error } = await resolveTreeAccess(request, treeId, 'write');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.researchLink.findFirst({
      where: { id, treeId, userId },
    });
    if (!existing) {
      return Response.json({ error: 'Research link not found' }, { status: 404 });
    }

    await prisma.researchLink.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err?.message || 'Failed to delete research link' },
      { status: 500 }
    );
  }
}
