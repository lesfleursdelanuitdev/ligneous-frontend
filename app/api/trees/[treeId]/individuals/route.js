import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess, parsePagination, paginatedResponse } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search, sort, order } = parsePagination(url);

    const sex = url.searchParams.get('sex');
    const living = url.searchParams.get('living');
    const hasChildren = url.searchParams.get('has_children');
    const hasSpouse = url.searchParams.get('has_spouse');
    const birthYear = url.searchParams.get('birth_year');
    const birthPlace = url.searchParams.get('birth_place');
    const givenName = url.searchParams.get('given_name');
    const surname = url.searchParams.get('surname');
    const advancedConditionsJson = url.searchParams.get('advanced_conditions');

    const andParts = [];
    const where = { fileUuid };

    const hasGivenName = givenName?.trim();
    const hasSurname = surname?.trim();
    if (hasGivenName || hasSurname) {
      const nameFormConditions = {};
      if (hasGivenName) {
        const givenLower = givenName.trim().toLowerCase();
        nameFormConditions.givenNames = {
          some: { givenName: { givenNameLower: givenLower } },
        };
      }
      if (hasSurname) {
        const surnameLower = surname.trim().toLowerCase();
        nameFormConditions.surnames = {
          some: { surname: { surnameLower: surnameLower } },
        };
      }
      where.individualNameForms = { some: nameFormConditions };
    }

    if (search) where.fullNameLower = { contains: search.toLowerCase() };
    if (sex) where.sex = sex.toUpperCase();
    if (living === 'true') where.isLiving = true;
    if (living === 'false') where.isLiving = false;
    if (hasChildren === 'true') where.hasChildren = true;
    if (hasChildren === 'false') where.hasChildren = false;
    if (hasSpouse === 'true') where.hasSpouse = true;
    if (hasSpouse === 'false') where.hasSpouse = false;
    if (birthYear) where.birthYear = parseInt(birthYear, 10) || undefined;
    if (birthPlace) where.birthPlaceDisplay = { contains: birthPlace, mode: 'insensitive' };

    const fieldToDb = {
      name: 'fullNameLower',
      birth_place: 'birthPlaceDisplay',
      death_place: 'deathPlaceDisplay',
      sex: 'sex',
      birth_year: 'birthYear',
      death_year: 'deathYear',
      living: 'isLiving',
      has_children: 'hasChildren',
      has_spouse: 'hasSpouse',
    };
    const numericFields = ['birth_year', 'death_year'];
    const booleanFields = ['living', 'has_children', 'has_spouse'];
    let advancedConditions = [];
    try {
      if (advancedConditionsJson) {
        advancedConditions = JSON.parse(advancedConditionsJson);
      }
    } catch {
      advancedConditions = [];
    }
    for (const c of advancedConditions) {
      const dbField = fieldToDb[c.field];
      if (!dbField || !c.value?.trim?.()) continue;
      const val = c.value.trim();
      const op = c.operator || 'contains';
      if (dbField === 'fullNameLower') {
        const strVal = val.toLowerCase();
        if (op === 'contains') andParts.push({ fullNameLower: { contains: strVal } });
        else if (op === 'not_contains') andParts.push({ NOT: { fullNameLower: { contains: strVal } } });
        else if (op === 'equals') andParts.push({ fullNameLower: strVal });
        else if (op === 'not_equals') andParts.push({ NOT: { fullNameLower: strVal } });
        else if (op === 'starts_with') andParts.push({ fullNameLower: { startsWith: strVal } });
        else if (op === 'ends_with') andParts.push({ fullNameLower: { endsWith: strVal } });
      } else if (numericFields.includes(c.field)) {
        const num = parseInt(val, 10);
        if (Number.isNaN(num)) continue;
        if (op === 'equals') andParts.push({ [dbField]: num });
        else if (op === 'not_equals') andParts.push({ NOT: { [dbField]: num } });
      } else if (booleanFields.includes(c.field)) {
        const b = val === 'true' || val === 'yes' || val === '1';
        if (op === 'equals' || op === 'contains') andParts.push({ [dbField]: b });
        else if (op === 'not_equals' || op === 'not_contains') andParts.push({ NOT: { [dbField]: b } });
      } else if (c.field === 'sex') {
        const s = val.toUpperCase();
        if (op === 'equals') andParts.push({ sex: s });
        else if (op === 'not_equals') andParts.push({ NOT: { sex: s } });
      } else if (dbField === 'birthPlaceDisplay' || dbField === 'deathPlaceDisplay') {
        const mode = { mode: 'insensitive' };
        if (op === 'contains') andParts.push({ [dbField]: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { [dbField]: { contains: val, ...mode } } });
        else if (op === 'equals') andParts.push({ [dbField]: { equals: val, ...mode } });
        else if (op === 'not_equals') andParts.push({ NOT: { [dbField]: { equals: val, ...mode } } });
        else if (op === 'starts_with') andParts.push({ [dbField]: { startsWith: val, ...mode } });
        else if (op === 'ends_with') andParts.push({ [dbField]: { endsWith: val, ...mode } });
      }
    }
    if (andParts.length > 0) where.AND = andParts;

    let orderBy = { fullName: 'asc' };
    if (sort === 'birth_year') orderBy = { birthYear: order };
    else if (sort === 'death_year') orderBy = { deathYear: order };
    else if (sort === 'sex') orderBy = { sex: order };
    else if (sort === 'name') orderBy = { fullName: order };

    const [individuals, total] = await Promise.all([
      prisma.gedcomIndividual.findMany({
        where,
        select: {
          id: true, xref: true, fullName: true, sex: true,
          birthYear: true, birthDateDisplay: true, birthPlaceDisplay: true,
          deathYear: true, deathDateDisplay: true, deathPlaceDisplay: true,
          isLiving: true, hasParents: true, hasChildren: true, hasSpouse: true,
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.gedcomIndividual.count({ where }),
    ]);

    return paginatedResponse(individuals, total, limit, offset);
  } catch (err) {
    console.error('Individuals list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
