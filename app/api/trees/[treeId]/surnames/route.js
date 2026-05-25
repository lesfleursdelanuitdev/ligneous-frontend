import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';
import { parsePagination, paginatedResponse } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'lastName');
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search, sort, order } = parsePagination(url);

    const where = { fileUuid };
    if (search) where.surnameLower = { contains: search.toLowerCase() };
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
        if (op === 'contains') andParts.push({ surnameLower: { contains: low } });
        else if (op === 'not_contains') andParts.push({ NOT: { surnameLower: { contains: low } } });
        else if (op === 'equals') andParts.push({ surnameLower: low });
        else if (op === 'not_equals') andParts.push({ NOT: { surnameLower: low } });
        else if (op === 'starts_with') andParts.push({ surnameLower: { startsWith: low } });
        else if (op === 'ends_with') andParts.push({ surnameLower: { endsWith: low } });
      } else if (c.field === 'frequency') {
        const num = parseInt(val, 10);
        if (Number.isNaN(num)) continue;
        if (op === 'equals') andParts.push({ frequency: num });
        else if (op === 'not_equals') andParts.push({ NOT: { frequency: num } });
      }
    }
    if (andParts.length > 0) where.AND = andParts;

    let orderBy = { frequency: 'desc' };
    if (sort === 'name') orderBy = { surname: order };
    else if (sort === 'frequency') orderBy = { frequency: order };

    const [surnames, total] = await Promise.all([
      prisma.gedcomSurname.findMany({
        where,
        select: { id: true, surname: true, surnameLower: true, frequency: true },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.gedcomSurname.count({ where }),
    ]);

    return paginatedResponse(surnames, total, limit, offset);
  } catch (err) {
    console.error('Surnames list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
