import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess, parsePagination, paginatedResponse } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search } = parsePagination(url);
    const country = url.searchParams.get('country');

    const where = { fileUuid };
    if (search) where.original = { contains: search, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    const advancedConditionsJson = url.searchParams.get('advanced_conditions');
    let advancedConditions = [];
    try { if (advancedConditionsJson) advancedConditions = JSON.parse(advancedConditionsJson); } catch { advancedConditions = []; }
    const andParts = [];
    const mode = { mode: 'insensitive' };
    const textFields = { original: 'original', name: 'name', country: 'country', county: 'county', state: 'state' };
    for (const c of advancedConditions) {
      const dbField = textFields[c.field];
      if (!dbField || !c.value?.trim?.()) continue;
      const val = c.value.trim();
      const op = c.operator || 'contains';
      if (op === 'contains') andParts.push({ [dbField]: { contains: val, ...mode } });
      else if (op === 'not_contains') andParts.push({ NOT: { [dbField]: { contains: val, ...mode } } });
      else if (op === 'equals') andParts.push({ [dbField]: { equals: val, ...mode } });
      else if (op === 'not_equals') andParts.push({ NOT: { [dbField]: { equals: val, ...mode } } });
      else if (op === 'starts_with') andParts.push({ [dbField]: { startsWith: val, ...mode } });
      else if (op === 'ends_with') andParts.push({ [dbField]: { endsWith: val, ...mode } });
    }
    if (andParts.length > 0) where.AND = andParts;

    const [places, total] = await Promise.all([
      prisma.gedcomPlace.findMany({
        where,
        select: {
          id: true, original: true, name: true,
          county: true, state: true, country: true,
          latitude: true, longitude: true,
        },
        orderBy: { original: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.gedcomPlace.count({ where }),
    ]);

    return paginatedResponse(places, total, limit, offset);
  } catch (err) {
    console.error('Places list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
