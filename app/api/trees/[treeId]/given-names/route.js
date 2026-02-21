import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess, parsePagination, paginatedResponse } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search, sort, order } = parsePagination(url);

    const where = { fileUuid };
    if (search) where.givenNameLower = { contains: search.toLowerCase() };
    const advancedConditionsJson = url.searchParams.get('advanced_conditions');
    let advancedConditions = [];
    try { if (advancedConditionsJson) advancedConditions = JSON.parse(advancedConditionsJson); } catch { advancedConditions = []; }
    const andParts = [];
    for (const c of advancedConditions) {
      if (!c.value?.trim?.()) continue;
      const val = c.value.trim();
      const op = c.operator || 'contains';
      if (c.field === 'name') {
        const low = val.toLowerCase();
        if (op === 'contains') andParts.push({ givenNameLower: { contains: low } });
        else if (op === 'not_contains') andParts.push({ NOT: { givenNameLower: { contains: low } } });
        else if (op === 'equals') andParts.push({ givenNameLower: low });
        else if (op === 'not_equals') andParts.push({ NOT: { givenNameLower: low } });
        else if (op === 'starts_with') andParts.push({ givenNameLower: { startsWith: low } });
        else if (op === 'ends_with') andParts.push({ givenNameLower: { endsWith: low } });
      } else if (c.field === 'frequency') {
        const num = parseInt(val, 10);
        if (Number.isNaN(num)) continue;
        if (op === 'equals') andParts.push({ frequency: num });
        else if (op === 'not_equals') andParts.push({ NOT: { frequency: num } });
      }
    }
    if (andParts.length > 0) where.AND = andParts;

    let orderBy = { frequency: 'desc' };
    if (sort === 'name') orderBy = { givenName: order };
    else if (sort === 'frequency') orderBy = { frequency: order };

    const [givenNames, total] = await Promise.all([
      prisma.gedcomGivenName.findMany({
        where,
        select: { id: true, givenName: true, givenNameLower: true, frequency: true },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.gedcomGivenName.count({ where }),
    ]);

    return paginatedResponse(givenNames, total, limit, offset);
  } catch (err) {
    console.error('Given names list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
