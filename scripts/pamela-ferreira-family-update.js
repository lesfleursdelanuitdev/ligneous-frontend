#!/usr/bin/env node
/**
 * Pamela Ferreira family update - implements docs/pamela-ferreira-family-update-plan.
 * Run from ligneous-frontend: node scripts/pamela-ferreira-family-update.js
 */

import './load-env.js';
import { createHash, randomUUID } from 'crypto';
import { PrismaClient } from '@ligneous/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TREE_NAME = 'Gonsalves Family Tree';
const PAMELA_XREF = '@I0143@';

function placeHash(original) {
  return createHash('sha256').update(original.trim().toLowerCase()).digest('hex');
}
function dateHash(original) {
  return createHash('sha256').update(original.trim()).digest('hex');
}

async function getFileUuid() {
  const tree = await prisma.tree.findFirst({
    where: { name: TREE_NAME },
    select: { gedcomFileId: true },
  });
  if (!tree?.gedcomFileId) throw new Error('Tree "' + TREE_NAME + '" not found or has no GEDCOM file');
  return tree.gedcomFileId;
}

/** Returns the next N xrefs for the given prefix (e.g. nextXrefs(tx, fileUuid, 'I', 3) => ['@I0144@','@I0145@','@I0146@']). */
async function nextXrefs(prismaClient, fileUuid, prefix, count = 1) {
  const table = prefix === 'I' ? 'gedcomIndividual' : 'gedcomFamily';
  const list = await prismaClient[table].findMany({
    where: { fileUuid },
    select: { xref: true },
  });
  const nums = list
    .map((r) => {
      const m = r.xref.match(/@([IF])(\d+)@/);
      return m && m[1] === prefix ? parseInt(m[2], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = nums.length ? Math.max(...nums) : 0;
  const out = [];
  for (let i = 1; i <= count; i++) out.push('@' + prefix + String(max + i).padStart(4, '0') + '@');
  return count === 1 ? out[0] : out;
}

async function ensureGivenName(tx, fileUuid, value) {
  const lower = value.trim().toLowerCase();
  const existing = await tx.gedcomGivenName.findUnique({
    where: { fileUuid_givenNameLower: { fileUuid, givenNameLower: lower } },
  });
  if (existing) return existing.id;
  const id = randomUUID();
  await tx.gedcomGivenName.create({
    data: { id, fileUuid, givenName: value.trim(), givenNameLower: lower, frequency: 0 },
  });
  return id;
}

async function ensureSurname(tx, fileUuid, value) {
  const lower = value.trim().toLowerCase();
  const existing = await tx.gedcomSurname.findUnique({
    where: { fileUuid_surnameLower: { fileUuid, surnameLower: lower } },
  });
  if (existing) return existing.id;
  const id = randomUUID();
  await tx.gedcomSurname.create({
    data: { id, fileUuid, surname: value.trim(), surnameLower: lower, frequency: 0 },
  });
  return id;
}

async function main() {
  if (!config.database?.url && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Use .env.local in ligneous-frontend.');
  }

  const fileUuid = await getFileUuid();
  console.log('File UUID:', fileUuid);

  const pamela = await prisma.gedcomIndividual.findFirst({
    where: { fileUuid, xref: PAMELA_XREF },
    select: { id: true, xref: true },
  });
  if (!pamela) throw new Error('Pamela ' + PAMELA_XREF + ' not found in this tree');

  const alreadyJoseph = await prisma.gedcomIndividual.findFirst({
    where: { fileUuid, fullNameLower: 'joseph /ferreira/' },
    select: { id: true },
  });
  if (alreadyJoseph) {
    console.log('Update already applied (Joseph Ferreira exists). Exiting.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    const placeOriginals = ['Brentwood, California', 'Walnut Creek, California', 'Richmond, California'];
    const placeIds = {};
    for (const orig of placeOriginals) {
      const key = orig.split(',')[0].trim();
      const hash = placeHash(orig);
      const existing = await tx.gedcomPlace.findUnique({
        where: { fileUuid_hash: { fileUuid, hash } },
      });
      if (existing) placeIds[key] = existing.id;
      else {
        const id = randomUUID();
        await tx.gedcomPlace.create({
          data: { id, fileUuid, original: orig, name: key, state: 'California', country: 'USA', hash },
        });
        placeIds[key] = id;
      }
    }
    console.log('Places:', Object.keys(placeIds));

    const dateSpecs = [
      { key: 'marriage', original: '29 APR 2017', year: 2017, month: 4, day: 29 },
      { key: 'josephBirth', original: '7 APR 1987', year: 1987, month: 4, day: 7 },
      { key: 'oliviaBirth', original: '9 MAR 2019', year: 2019, month: 3, day: 9 },
      { key: 'lucasBirth', original: '26 NOV 2020', year: 2020, month: 11, day: 26 },
    ];
    const dateIds = {};
    for (const d of dateSpecs) {
      const hash = dateHash(d.original);
      const existing = await tx.gedcomDate.findUnique({ where: { fileUuid_hash: { fileUuid, hash } } });
      if (existing) dateIds[d.key] = existing.id;
      else {
        const id = randomUUID();
        await tx.gedcomDate.create({
          data: { id, fileUuid, original: d.original, dateType: 'EXACT', calendar: 'GREGORIAN', year: d.year, month: d.month, day: d.day, hash },
        });
        dateIds[d.key] = id;
      }
    }
    console.log('Dates:', Object.keys(dateIds));

    const [josephXref, oliviaXref, lucasXref] = await nextXrefs(tx, fileUuid, 'I', 3);
    const josephId = randomUUID();
    const oliviaId = randomUUID();
    const lucasId = randomUUID();

    await tx.gedcomIndividual.createMany({
      data: [
        { id: josephId, fileUuid, xref: josephXref, fullName: 'Joseph /Ferreira/', fullNameLower: 'joseph /ferreira/', sex: 'M', isLiving: true, hasSpouse: true, hasChildren: true, birthDateId: dateIds.josephBirth, birthPlaceId: placeIds.Richmond, birthDateDisplay: '7 APR 1987', birthPlaceDisplay: 'Richmond, California', birthYear: 1987 },
        { id: oliviaId, fileUuid, xref: oliviaXref, fullName: 'Olivia Paige /Ferreira/', fullNameLower: 'olivia paige /ferreira/', sex: 'F', isLiving: true, hasParents: true, birthDateId: dateIds.oliviaBirth, birthPlaceId: placeIds['Walnut Creek'], birthDateDisplay: '9 MAR 2019', birthPlaceDisplay: 'Walnut Creek, California', birthYear: 2019 },
        { id: lucasId, fileUuid, xref: lucasXref, fullName: 'Lucas Peter /Gonsalves/', fullNameLower: 'lucas peter /gonsalves/', sex: 'M', isLiving: true, hasParents: true, birthDateId: dateIds.lucasBirth, birthPlaceId: placeIds['Walnut Creek'], birthDateDisplay: '26 NOV 2020', birthPlaceDisplay: 'Walnut Creek, California', birthYear: 2020 },
      ],
    });

    const givenJoseph = await ensureGivenName(tx, fileUuid, 'Joseph');
    const givenOlivia = await ensureGivenName(tx, fileUuid, 'Olivia');
    const givenPaige = await ensureGivenName(tx, fileUuid, 'Paige');
    const givenLucas = await ensureGivenName(tx, fileUuid, 'Lucas');
    const givenPeter = await ensureGivenName(tx, fileUuid, 'Peter');
    const surnameFerreira = await ensureSurname(tx, fileUuid, 'Ferreira');
    const surnameGonsalves = await ensureSurname(tx, fileUuid, 'Gonsalves');

    const nameFormJoseph = randomUUID();
    await tx.gedcomIndividualNameForm.create({ data: { id: nameFormJoseph, fileUuid, individualId: josephId, nameType: 'birth', isPrimary: true, sortOrder: 0 } });
    await tx.gedcomNameFormGivenName.create({ data: { fileUuid, nameFormId: nameFormJoseph, givenNameId: givenJoseph, position: 1 } });
    await tx.gedcomNameFormSurname.create({ data: { fileUuid, nameFormId: nameFormJoseph, surnameId: surnameFerreira, position: 1 } });

    const nameFormOlivia = randomUUID();
    await tx.gedcomIndividualNameForm.create({ data: { id: nameFormOlivia, fileUuid, individualId: oliviaId, nameType: 'birth', isPrimary: true, sortOrder: 0 } });
    await tx.gedcomNameFormGivenName.create({ data: { fileUuid, nameFormId: nameFormOlivia, givenNameId: givenOlivia, position: 1 } });
    await tx.gedcomNameFormGivenName.create({ data: { fileUuid, nameFormId: nameFormOlivia, givenNameId: givenPaige, position: 2 } });
    await tx.gedcomNameFormSurname.create({ data: { fileUuid, nameFormId: nameFormOlivia, surnameId: surnameFerreira, position: 1 } });

    const nameFormLucas = randomUUID();
    await tx.gedcomIndividualNameForm.create({ data: { id: nameFormLucas, fileUuid, individualId: lucasId, nameType: 'birth', isPrimary: true, sortOrder: 0 } });
    await tx.gedcomNameFormGivenName.create({ data: { fileUuid, nameFormId: nameFormLucas, givenNameId: givenLucas, position: 1 } });
    await tx.gedcomNameFormGivenName.create({ data: { fileUuid, nameFormId: nameFormLucas, givenNameId: givenPeter, position: 2 } });
    await tx.gedcomNameFormSurname.create({ data: { fileUuid, nameFormId: nameFormLucas, surnameId: surnameGonsalves, position: 1 } });

    await tx.gedcomIndividual.update({ where: { id: pamela.id }, data: { hasSpouse: true, hasChildren: true } });
    const givenPamela = await ensureGivenName(tx, fileUuid, 'Pamela');
    const marriedNameFormId = randomUUID();
    await tx.gedcomIndividualNameForm.create({ data: { id: marriedNameFormId, fileUuid, individualId: pamela.id, nameType: 'married', isPrimary: false, sortOrder: 1 } });
    await tx.gedcomNameFormGivenName.create({ data: { fileUuid, nameFormId: marriedNameFormId, givenNameId: givenPamela, position: 1 } });
    await tx.gedcomNameFormSurname.create({ data: { fileUuid, nameFormId: marriedNameFormId, surnameId: surnameFerreira, position: 1 } });

    const familyXref = await nextXrefs(tx, fileUuid, 'F', 1);
    const familyId = randomUUID();
    await tx.gedcomFamily.create({
      data: { id: familyId, fileUuid, xref: familyXref, husbandId: josephId, wifeId: pamela.id, husbandXref: josephXref, wifeXref: PAMELA_XREF, marriageDateId: dateIds.marriage, marriagePlaceId: placeIds.Brentwood, marriageDateDisplay: '29 APR 2017', marriagePlaceDisplay: 'Brentwood, California', marriageYear: 2017, childrenCount: 2, isDivorced: false },
    });

    const eventMarr = randomUUID();
    const eventBirtJoseph = randomUUID();
    const eventBirtOlivia = randomUUID();
    const eventBirtLucas = randomUUID();
    await tx.gedcomEvent.createMany({
      data: [
        { id: eventMarr, fileUuid, eventType: 'MARR', dateId: dateIds.marriage, placeId: placeIds.Brentwood, sortOrder: 0 },
        { id: eventBirtJoseph, fileUuid, eventType: 'BIRT', dateId: dateIds.josephBirth, placeId: placeIds.Richmond, sortOrder: 0 },
        { id: eventBirtOlivia, fileUuid, eventType: 'BIRT', dateId: dateIds.oliviaBirth, placeId: placeIds['Walnut Creek'], sortOrder: 0 },
        { id: eventBirtLucas, fileUuid, eventType: 'BIRT', dateId: dateIds.lucasBirth, placeId: placeIds['Walnut Creek'], sortOrder: 0 },
      ],
    });

    await tx.gedcomFamilyEvent.create({ data: { fileUuid, familyId, eventId: eventMarr } });
    await tx.gedcomIndividualEvent.createMany({
      data: [
        { fileUuid, individualId: josephId, eventId: eventBirtJoseph, role: 'principal' },
        { fileUuid, individualId: oliviaId, eventId: eventBirtOlivia, role: 'principal' },
        { fileUuid, individualId: lucasId, eventId: eventBirtLucas, role: 'principal' },
      ],
    });

    await tx.gedcomFamilyChild.createMany({
      data: [
        { fileUuid, familyId, childId: oliviaId, childXref: oliviaXref, birthOrder: 1 },
        { fileUuid, familyId, childId: lucasId, childXref: lucasXref, birthOrder: 2 },
      ],
    });

    await tx.gedcomParentChild.createMany({
      data: [
        { fileUuid, parentId: josephId, childId: oliviaId, familyId, parentType: 'father', relationshipType: 'biological' },
        { fileUuid, parentId: pamela.id, childId: oliviaId, familyId, parentType: 'mother', relationshipType: 'biological' },
        { fileUuid, parentId: josephId, childId: lucasId, familyId, parentType: 'father', relationshipType: 'biological' },
        { fileUuid, parentId: pamela.id, childId: lucasId, familyId, parentType: 'mother', relationshipType: 'biological' },
      ],
    });

    await tx.gedcomSpouse.createMany({
      data: [
        { fileUuid, individualId: josephId, spouseId: pamela.id, familyId },
        { fileUuid, individualId: pamela.id, spouseId: josephId, familyId },
      ],
    });

    await tx.gedcomFileObject.createMany({
      data: [
        { fileUuid, xref: josephXref, objectType: 'INDI', objectUuid: josephId },
        { fileUuid, xref: oliviaXref, objectType: 'INDI', objectUuid: oliviaId },
        { fileUuid, xref: lucasXref, objectType: 'INDI', objectUuid: lucasId },
        { fileUuid, xref: familyXref, objectType: 'FAM', objectUuid: familyId },
      ],
    });
  });

  console.log('Done. Pamela updated; Joseph, Olivia, Lucas and family created with events.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
