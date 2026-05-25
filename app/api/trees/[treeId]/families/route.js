import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';
import { parsePagination, paginatedResponse } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'family');
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search, sort, order } = parsePagination(url);
    const advancedConditionsJson = url.searchParams.get('advanced_conditions');

    const where = { fileUuid };
    if (search) {
      where.OR = [
        { husbandXref: { contains: search, mode: 'insensitive' } },
        { wifeXref: { contains: search, mode: 'insensitive' } },
      ];
    }
    let advancedConditions = [];
    try { if (advancedConditionsJson) advancedConditions = JSON.parse(advancedConditionsJson); } catch { advancedConditions = []; }
    const andParts = [];
    const fieldToDb = { xref: 'xref', husband: 'husbandXref', wife: 'wifeXref', children_count: 'childrenCount' };
    const mode = { mode: 'insensitive' };
    for (const c of advancedConditions) {
      const dbField = fieldToDb[c.field];
      if (!dbField || !c.value?.trim?.()) continue;
      const val = c.value.trim();
      const op = c.operator || 'contains';
      if (c.field === 'children_count') {
        const num = parseInt(val, 10);
        if (Number.isNaN(num)) continue;
        if (op === 'equals') andParts.push({ childrenCount: num });
        else if (op === 'not_equals') andParts.push({ NOT: { childrenCount: num } });
      } else if (dbField === 'xref' || dbField === 'husbandXref' || dbField === 'wifeXref') {
        if (op === 'contains') andParts.push({ [dbField]: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { [dbField]: { contains: val, ...mode } } });
        else if (op === 'equals') andParts.push({ [dbField]: { equals: val, ...mode } });
        else if (op === 'not_equals') andParts.push({ NOT: { [dbField]: { equals: val, ...mode } } });
        else if (op === 'starts_with') andParts.push({ [dbField]: { startsWith: val, ...mode } });
        else if (op === 'ends_with') andParts.push({ [dbField]: { endsWith: val, ...mode } });
      }
    }
    if (andParts.length > 0) where.AND = andParts;

    let orderBy = { xref: 'asc' };
    if (sort === 'xref') orderBy = { xref: order };
    else if (sort === 'husband') orderBy = { husband: { fullName: order } };
    else if (sort === 'wife') orderBy = { wife: { fullName: order } };
    else if (sort === 'children_count') orderBy = { childrenCount: order };

    const [families, total] = await Promise.all([
      prisma.gedcomFamily.findMany({
        where,
        select: {
          id: true, xref: true,
          husbandId: true, husbandXref: true,
          wifeId: true, wifeXref: true,
          marriageDateDisplay: true, marriagePlaceDisplay: true, marriageYear: true,
          childrenCount: true,
          husband: { select: { id: true, xref: true, fullName: true } },
          wife: { select: { id: true, xref: true, fullName: true } },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.gedcomFamily.count({ where }),
    ]);

    return paginatedResponse(families, total, limit, offset);
  } catch (err) {
    console.error('Families list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
