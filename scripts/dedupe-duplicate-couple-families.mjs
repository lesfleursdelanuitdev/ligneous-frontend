/**
 * Merges duplicate gedcom_families_v2 rows sharing (file_uuid, husband_id, wife_id)
 * when both partners are set — run before partial unique index migration.
 *
 *   cd ligneous-frontend && node --env-file=.env.local scripts/dedupe-duplicate-couple-families.mjs
 */

import { PrismaClient } from "@ligneous/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {string} fileUuid
 * @param {string} loserId
 * @param {string} keeperId
 */
async function mergeLoserFamilyIntoKeeper(tx, fileUuid, loserId, keeperId) {
  if (loserId === keeperId) return;

  const fcRows = await tx.gedcomFamilyChild.findMany({
    where: { familyId: loserId },
    select: { id: true, childId: true },
  });
  for (const row of fcRows) {
    const existsOnKeeper = await tx.gedcomFamilyChild.findFirst({
      where: { fileUuid, familyId: keeperId, childId: row.childId },
      select: { id: true },
    });
    if (existsOnKeeper) {
      await tx.gedcomFamilyChild.delete({ where: { id: row.id } });
    } else {
      await tx.gedcomFamilyChild.update({
        where: { id: row.id },
        data: { familyId: keeperId },
      });
    }
  }

  await tx.gedcomParentChild.updateMany({
    where: { familyId: loserId },
    data: { familyId: keeperId },
  });

  await tx.gedcomSpouse.updateMany({
    where: { familyId: loserId },
    data: { familyId: keeperId },
  });

  const loserFe = await tx.gedcomFamilyEvent.findMany({
    where: { familyId: loserId },
    select: { id: true, eventId: true },
  });
  for (const fe of loserFe) {
    const dup = await tx.gedcomFamilyEvent.findFirst({
      where: { fileUuid, familyId: keeperId, eventId: fe.eventId },
      select: { id: true },
    });
    if (dup) await tx.gedcomFamilyEvent.delete({ where: { id: fe.id } });
    else
      await tx.gedcomFamilyEvent.update({
        where: { id: fe.id },
        data: { familyId: keeperId },
      });
  }

  const loserFn = await tx.gedcomFamilyNote.findMany({
    where: { familyId: loserId },
    select: { id: true, noteId: true },
  });
  for (const fn of loserFn) {
    const dup = await tx.gedcomFamilyNote.findFirst({
      where: { fileUuid, familyId: keeperId, noteId: fn.noteId },
      select: { id: true },
    });
    if (dup) await tx.gedcomFamilyNote.delete({ where: { id: fn.id } });
    else
      await tx.gedcomFamilyNote.update({
        where: { id: fn.id },
        data: { familyId: keeperId },
      });
  }

  const loserFs = await tx.gedcomFamilySource.findMany({
    where: { familyId: loserId },
    select: { id: true, sourceId: true },
  });
  for (const fs of loserFs) {
    const dup = await tx.gedcomFamilySource.findFirst({
      where: { fileUuid, familyId: keeperId, sourceId: fs.sourceId },
      select: { id: true },
    });
    if (dup) await tx.gedcomFamilySource.delete({ where: { id: fs.id } });
    else
      await tx.gedcomFamilySource.update({
        where: { id: fs.id },
        data: { familyId: keeperId },
      });
  }

  const loserFsn = await tx.gedcomFamilySurname.findMany({
    where: { familyId: loserId },
    select: { id: true, surnameId: true },
  });
  for (const fs of loserFsn) {
    const dup = await tx.gedcomFamilySurname.findFirst({
      where: { fileUuid, familyId: keeperId, surnameId: fs.surnameId },
      select: { id: true },
    });
    if (dup) await tx.gedcomFamilySurname.delete({ where: { id: fs.id } });
    else
      await tx.gedcomFamilySurname.update({
        where: { id: fs.id },
        data: { familyId: keeperId },
      });
  }

  const loserFm = await tx.gedcomFamilyMedia.findMany({
    where: { familyId: loserId },
    select: { id: true, mediaId: true },
  });
  for (const fm of loserFm) {
    const dup = await tx.gedcomFamilyMedia.findFirst({
      where: { fileUuid, familyId: keeperId, mediaId: fm.mediaId },
      select: { id: true },
    });
    if (dup) await tx.gedcomFamilyMedia.delete({ where: { id: fm.id } });
    else
      await tx.gedcomFamilyMedia.update({
        where: { id: fm.id },
        data: { familyId: keeperId },
      });
  }

  await tx.gedcomFileObject.updateMany({
    where: { fileUuid, objectType: "FAM", objectUuid: loserId },
    data: { objectUuid: keeperId },
  });

  const [keeper, loser] = await Promise.all([
    tx.gedcomFamily.findUnique({
      where: { id: keeperId },
      select: {
        marriageDateId: true,
        marriagePlaceId: true,
        marriageDateDisplay: true,
        marriagePlaceDisplay: true,
        marriageYear: true,
        divorceDateId: true,
        divorcePlaceId: true,
        isDivorced: true,
        childrenCount: true,
      },
    }),
    tx.gedcomFamily.findUnique({
      where: { id: loserId },
      select: {
        marriageDateId: true,
        marriagePlaceId: true,
        marriageDateDisplay: true,
        marriagePlaceDisplay: true,
        marriageYear: true,
        divorceDateId: true,
        divorcePlaceId: true,
        isDivorced: true,
        childrenCount: true,
      },
    }),
  ]);
  if (!keeper || !loser) return;

  const patch = {};
  if (!keeper.marriageDateId && loser.marriageDateId) patch.marriageDateId = loser.marriageDateId;
  if (!keeper.marriagePlaceId && loser.marriagePlaceId) patch.marriagePlaceId = loser.marriagePlaceId;
  if (!keeper.marriageDateDisplay && loser.marriageDateDisplay)
    patch.marriageDateDisplay = loser.marriageDateDisplay;
  if (!keeper.marriagePlaceDisplay && loser.marriagePlaceDisplay)
    patch.marriagePlaceDisplay = loser.marriagePlaceDisplay;
  if (keeper.marriageYear == null && loser.marriageYear != null) patch.marriageYear = loser.marriageYear;
  if (!keeper.divorceDateId && loser.divorceDateId) patch.divorceDateId = loser.divorceDateId;
  if (!keeper.divorcePlaceId && loser.divorcePlaceId) patch.divorcePlaceId = loser.divorcePlaceId;
  if (!keeper.isDivorced && loser.isDivorced) patch.isDivorced = true;
  const kc = keeper.childrenCount ?? 0;
  const lc = loser.childrenCount ?? 0;
  patch.childrenCount = Math.max(kc, lc);

  if (Object.keys(patch).length > 0) {
    await tx.gedcomFamily.update({
      where: { id: keeperId },
      data: { ...patch, updatedAt: new Date() },
    });
  }

  await tx.gedcomFamily.delete({ where: { id: loserId } });
}

async function main() {
  const groups = await prisma.$queryRaw`
    SELECT file_uuid AS "fileUuid", husband_id AS "husbandId", wife_id AS "wifeId",
           array_agg(id ORDER BY created_at) AS ids
    FROM gedcom_families_v2
    WHERE husband_id IS NOT NULL AND wife_id IS NOT NULL
    GROUP BY file_uuid, husband_id, wife_id
    HAVING COUNT(*) > 1
  `;
  if (!groups.length) {
    console.log("No duplicate (file, husband, wife) family groups found.");
    return;
  }
  console.log(`Found ${groups.length} duplicate couple group(s).`);

  let mergedLosers = 0;
  for (const g of groups) {
    const ids = g.ids;
    const rows = await prisma.gedcomFamily.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        xref: true,
        createdAt: true,
        childrenCount: true,
        _count: { select: { familyChildren: true } },
      },
    });
    rows.sort((a, b) => {
      const ca = a._count.familyChildren;
      const cb = b._count.familyChildren;
      if (cb !== ca) return cb - ca;
      const da = a.childrenCount ?? 0;
      const db = b.childrenCount ?? 0;
      if (db !== da) return db - da;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    const keeper = rows[0];
    const losers = rows.slice(1);
    console.log(
      `  file=${g.fileUuid} keeper=${keeper.id} (${keeper.xref}) nChildren=${keeper._count.familyChildren}; losers=${losers.map((x) => x.id).join(", ")}`,
    );
    await prisma.$transaction(async (tx) => {
      for (const l of losers) {
        await mergeLoserFamilyIntoKeeper(tx, g.fileUuid, l.id, keeper.id);
        mergedLosers += 1;
      }
    });
  }
  console.log(`Done. Removed ${mergedLosers} duplicate family row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
