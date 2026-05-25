#!/usr/bin/env node
/**
 * End-to-end check: load first GedcomFile from Postgres, build EnrichedDocument
 * (same as tree export API), pipe JSON to ligneous-gedcom-lib/cmd/gedcomstdin.
 *
 * Usage (from repo):
 *   cd gonsalves-genealogy/ligneous-frontend
 *   # ensure DATABASE_URL (e.g. copy from the-gonsalves-family-admin/.env.local)
 *   npm run test:export-db
 *
 * Writes GEDCOM to /apps/tmp/gedcom-export-<fileUuid>.ged (overwrites on same id).
 *
 * By default exports the Tree1.ged row: GedcomFile where originalFilename is
 * `tree1.ged` (seed name: "Gonsalves Family Tree", Tree.gedcomFileId matches).
 * Override with GEDCOM_EXPORT_FILE_UUID=<gedcom_files.id>.
 *
 * Requires: Postgres reachable, prisma generate, Go toolchain for gedcomstdin.
 */

import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(__dirname, '..');

for (const p of [
  resolve(frontendRoot, '.env.local'),
  resolve(frontendRoot, '.env'),
  resolve(frontendRoot, '../the-gonsalves-family-admin/.env.local'),
  resolve(frontendRoot, '../the-gonsalves-family-admin/.env'),
]) {
  config({ path: p });
}

if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Add it to ligneous-frontend/.env.local or the-gonsalves-family-admin/.env.local, then retry.',
  );
  process.exit(1);
}

const { prisma } = await import('../lib/database/prisma.js');
const { buildEnrichedDocumentFromDB } = await import('../lib/export/gedcom-export.js');

const fileUuid = process.env.GEDCOM_EXPORT_FILE_UUID?.trim();
const file = fileUuid
  ? await prisma.gedcomFile.findUnique({
      where: { id: fileUuid },
      select: {
        id: true,
        name: true,
        originalFilename: true,
        gedcomPath: true,
        _count: {
          select: { individuals: true, families: true, events: true, gedcomMedia: true },
        },
      },
    })
  : await prisma.gedcomFile.findFirst({
      where: { originalFilename: 'tree1.ged' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        originalFilename: true,
        gedcomPath: true,
        _count: {
          select: { individuals: true, families: true, events: true, gedcomMedia: true },
        },
      },
    });

if (!file) {
  console.error(
    fileUuid
      ? `No GedcomFile with id ${fileUuid}.`
      : 'No gedcom_files row with originalFilename "tree1.ged" — nothing to export. Set GEDCOM_EXPORT_FILE_UUID to export another file.',
  );
  await prisma.$disconnect();
  process.exit(fileUuid ? 1 : 0);
}

console.error(
  `Using GedcomFile ${file.id} (${file.originalFilename || 'no filename'}) "${file.name}" — ${file._count.individuals} indi, ${file._count.families} fam, ${file._count.events} events, ${file._count.gedcomMedia} media`,
);

const enriched = await buildEnrichedDocumentFromDB(file.id);
const payload = JSON.stringify({
  enriched,
  format: 'gedcom',
  filename: 'db-export-test',
});

const gedcomLib = resolve(frontendRoot, '../ligneous-gedcom-lib');
const r = spawnSync('go', ['run', './cmd/gedcomstdin'], {
  cwd: gedcomLib,
  input: payload,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

await prisma.$disconnect();

if (r.error) {
  console.error('go run failed:', r.error.message);
  process.exit(1);
}
if (r.status !== 0) {
  console.error('gedcomstdin stderr:', r.stderr);
  process.exit(r.status ?? 1);
}

const ged = r.stdout;
const lines = ged.split('\n').filter(Boolean);
console.error(`GEDCOM output: ${lines.length} non-empty lines, ${ged.length} bytes`);

const checks = [
  ['HEAD', ged.includes('0 HEAD')],
  ['TRLR', ged.includes('0 TRLR')],
  ['INDI', ged.includes(' INDI')],
];
for (const [name, ok] of checks) {
  if (!ok) console.error(`WARNING: expected ${name} in output`);
}

const eventMedia = enriched.EventMedia?.length ?? 0;
const eventSources = enriched.EventSources?.length ?? 0;
console.error(`Payload: EventMedia=${eventMedia}, EventSources=${eventSources}`);

if (eventMedia > 0 && !ged.includes(' OBJE')) {
  console.error('WARNING: EventMedia rows present but no OBJE line in GEDCOM');
}

const outDir = '/apps/tmp';
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `gedcom-export-${file.id}.ged`);
writeFileSync(outPath, ged, 'utf8');
console.error(`Wrote ${outPath}`);

process.exit(0);
