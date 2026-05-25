/**
 * Per-tree health check engine.
 * Each check returns a CheckResult; results with count === 0 are filtered out.
 *
 * @typedef {{ id: string, xref: string, displayLabel: string, href: string }} HealthRecord
 * @typedef {{ id: string, label: string, description: string, category: string, count: number, records: HealthRecord[] }} CheckResult
 */

function stripSlashes(name) {
  if (!name) return name;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

// ── Individual checks ─────────────────────────────────────────────────────────

async function checkOrphanedIndividuals(fileUuid, treeId, prisma) {
  const where = {
    fileUuid,
    hasParents: false,
    hasChildren: false,
    hasSpouse: false,
  };
  const [count, rows] = await Promise.all([
    prisma.gedcomIndividual.count({ where }),
    prisma.gedcomIndividual.findMany({
      where,
      select: { id: true, xref: true, fullName: true },
      orderBy: { fullName: 'asc' },
      take: 10,
    }),
  ]);
  return {
    id: 'orphaned_individuals',
    label: 'Orphaned individuals',
    description: 'Individuals with no recorded family connections (no parents, children, or spouse).',
    category: 'individuals',
    count,
    records: rows.map((r) => ({
      id: r.id,
      xref: r.xref,
      displayLabel: stripSlashes(r.fullName) || r.xref,
      href: `/trees/${treeId}/individuals/${encodeURIComponent(r.xref)}`,
    })),
  };
}

async function checkDuplicateNames(fileUuid, treeId, prisma) {
  // Find name+birthYear combinations that appear more than once.
  const groups = await prisma.gedcomIndividual.groupBy({
    by: ['fullNameLower', 'birthYear'],
    where: { fileUuid, fullNameLower: { not: null } },
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
    orderBy: { _count: { id: 'desc' } },
  });
  const count = groups.reduce((sum, g) => sum + g._count.id, 0);

  // Fetch a sample of individuals from the top duplicate groups.
  const sampleGroups = groups.slice(0, 4);
  const batches = await Promise.all(
    sampleGroups.map((g) =>
      prisma.gedcomIndividual.findMany({
        where: { fileUuid, fullNameLower: g.fullNameLower, birthYear: g.birthYear },
        select: { id: true, xref: true, fullName: true },
        take: 2,
      })
    )
  );
  const records = batches
    .flat()
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      xref: r.xref,
      displayLabel: stripSlashes(r.fullName) || r.xref,
      href: `/trees/${treeId}/individuals/${encodeURIComponent(r.xref)}`,
    }));

  return {
    id: 'duplicate_names',
    label: 'Possible duplicate individuals',
    description: 'Multiple individuals share the same full name and birth year.',
    category: 'individuals',
    count,
    records,
  };
}

async function checkMissingBirthDates(fileUuid, treeId, prisma) {
  const where = { fileUuid, birthDateId: null, isLiving: false };
  const [count, rows] = await Promise.all([
    prisma.gedcomIndividual.count({ where }),
    prisma.gedcomIndividual.findMany({
      where,
      select: { id: true, xref: true, fullName: true },
      orderBy: { fullName: 'asc' },
      take: 10,
    }),
  ]);
  return {
    id: 'missing_birth_dates',
    label: 'Deceased individuals without a birth date',
    description: 'Deceased individuals that have no recorded birth date.',
    category: 'individuals',
    count,
    records: rows.map((r) => ({
      id: r.id,
      xref: r.xref,
      displayLabel: stripSlashes(r.fullName) || r.xref,
      href: `/trees/${treeId}/individuals/${encodeURIComponent(r.xref)}`,
    })),
  };
}

// ── Family checks ─────────────────────────────────────────────────────────────

async function checkFamiliesNoChildren(fileUuid, treeId, prisma) {
  const where = { fileUuid, childrenCount: 0 };
  const [count, rows] = await Promise.all([
    prisma.gedcomFamily.count({ where }),
    prisma.gedcomFamily.findMany({
      where,
      select: { id: true, xref: true, husbandXref: true, wifeXref: true },
      take: 10,
    }),
  ]);
  return {
    id: 'families_no_children',
    label: 'Families with no children',
    description: 'Family records with zero linked children.',
    category: 'families',
    count,
    records: rows.map((r) => ({
      id: r.id,
      xref: r.xref,
      displayLabel: [r.husbandXref, r.wifeXref].filter(Boolean).join(' & ') || r.xref,
      href: `/trees/${treeId}/families/${encodeURIComponent(r.xref)}`,
    })),
  };
}

// ── Media checks ──────────────────────────────────────────────────────────────

async function checkBrokenMediaLinks(fileUuid, treeId, prisma) {
  const where = {
    fileUuid,
    OR: [{ fileRef: null }, { fileRef: '' }],
  };
  const [count, rows] = await Promise.all([
    prisma.gedcomMedia.count({ where }),
    prisma.gedcomMedia.findMany({
      where,
      select: { id: true, xref: true, title: true },
      take: 10,
    }),
  ]);
  return {
    id: 'broken_media_links',
    label: 'Media without a file reference',
    description: 'Media records with no fileRef — the original file is likely missing.',
    category: 'media',
    count,
    records: rows.map((r) => ({
      id: r.id,
      xref: r.xref ?? r.id,
      displayLabel: r.title || r.xref || r.id,
      href: `/trees/${treeId}/pictures`,
    })),
  };
}

// ── Event checks ──────────────────────────────────────────────────────────────

async function checkEventsNoPlace(fileUuid, treeId, prisma) {
  const where = { fileUuid, placeId: null, dateId: null };
  const [count, rows] = await Promise.all([
    prisma.gedcomEvent.count({ where }),
    prisma.gedcomEvent.findMany({
      where,
      select: { id: true, eventType: true },
      take: 10,
    }),
  ]);
  return {
    id: 'events_no_place',
    label: 'Events with no date or place',
    description: 'Event records that have neither a date nor a place recorded.',
    category: 'events',
    count,
    records: rows.map((r) => ({
      id: r.id,
      xref: r.id,
      displayLabel: r.eventType || 'Unknown event',
      href: `/trees/${treeId}/events`,
    })),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run all health checks for the given tree.
 * Returns only checks that found at least one issue.
 *
 * @param {string} fileUuid
 * @param {string} treeId  — used to build record href links
 * @param {import('@prisma/client').PrismaClient} db
 * @returns {Promise<CheckResult[]>}
 */
export async function runTreeHealthChecks(fileUuid, treeId, db) {
  const [
    orphaned,
    missingBirth,
    familiesNoKids,
    brokenMedia,
    eventsNoDate,
    dupeNames,
  ] = await Promise.all([
    checkOrphanedIndividuals(fileUuid, treeId, db),
    checkMissingBirthDates(fileUuid, treeId, db),
    checkFamiliesNoChildren(fileUuid, treeId, db),
    checkBrokenMediaLinks(fileUuid, treeId, db),
    checkEventsNoPlace(fileUuid, treeId, db),
    checkDuplicateNames(fileUuid, treeId, db),
  ]);

  return [orphaned, dupeNames, missingBirth, familiesNoKids, brokenMedia, eventsNoDate].filter(
    (r) => r.count > 0
  );
}
