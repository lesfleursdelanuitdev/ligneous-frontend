import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess, parsePagination, paginatedResponse } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search } = parsePagination(url);

    const where = { fileUuid };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { fileRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [media, total] = await Promise.all([
      prisma.gedcomMedia.findMany({
        where,
        select: {
          id: true, xref: true, fileRef: true, form: true, title: true,
        },
        orderBy: { xref: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.gedcomMedia.count({ where }),
    ]);

    return paginatedResponse(media, total, limit, offset);
  } catch (err) {
    console.error('Media list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
