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
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [repositories, total] = await Promise.all([
      prisma.gedcomRepository.findMany({
        where,
        select: {
          id: true, xref: true, name: true,
          address: true, city: true, state: true, country: true,
          phone: true, email: true, website: true,
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.gedcomRepository.count({ where }),
    ]);

    return paginatedResponse(repositories, total, limit, offset);
  } catch (err) {
    console.error('Repositories list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
