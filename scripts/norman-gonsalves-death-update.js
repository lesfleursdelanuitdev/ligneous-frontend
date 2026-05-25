#!/usr/bin/env node
/**
 * Add death event for Norman Peter Gonsalves (@I0087@): 10 NOV 2022, Concord, California.
 * Run: node scripts/norman-gonsalves-death-update.js
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
const NORMAN_XREF = '@I0087@';
const DEATH_ORIGINAL = '10 NOV 2022';
const DEATH_PLACE_ORIGINAL = 'Concord, California';

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
  if (!tree?.gedcomFileId) throw new Error('Tree "' + TREE_NAME + '" not found');
  return tree.gedcomFileId;
}

async function main() {
  if (!config.database?.url && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Use .env.local in ligneous-frontend.');
  }

  const fileUuid = await getFileUuid();
  const norman = await prisma.gedcomIndividual.findFirst({
    where: { fileUuid, xref: NORMAN_XREF },
    select: { id: true, fullName: true, deathDateId: true },
  });
  if (!norman) throw new Error('Norman ' + NORMAN_XREF + ' not found in this tree');
  if (norman.deathDateId) {
    console.log('Norman already has a death date set. Exiting.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    const placeKey = 'Concord';
    const hashPlace = placeHash(DEATH_PLACE_ORIGINAL);
    let placeId = (await tx.gedcomPlace.findUnique({
      where: { fileUuid_hash: { fileUuid, hash: hashPlace } },
      select: { id: true },
    }))?.id;
    if (!placeId) {
      placeId = randomUUID();
      await tx.gedcomPlace.create({
        data: {
          id: placeId,
          fileUuid,
          original: DEATH_PLACE_ORIGINAL,
          name: placeKey,
          state: 'California',
          country: 'USA',
          hash: hashPlace,
        },
      });
    }

    const hashDate = dateHash(DEATH_ORIGINAL);
    let dateId = (await tx.gedcomDate.findUnique({
      where: { fileUuid_hash: { fileUuid, hash: hashDate } },
      select: { id: true },
    }))?.id;
    if (!dateId) {
      dateId = randomUUID();
      await tx.gedcomDate.create({
        data: {
          id: dateId,
          fileUuid,
          original: DEATH_ORIGINAL,
          dateType: 'EXACT',
          calendar: 'GREGORIAN',
          year: 2022,
          month: 11,
          day: 10,
          hash: hashDate,
        },
      });
    }

    const eventId = randomUUID();
    await tx.gedcomEvent.create({
      data: {
        id: eventId,
        fileUuid,
        eventType: 'DEAT',
        dateId,
        placeId,
        sortOrder: 0,
      },
    });

    await tx.gedcomIndividualEvent.create({
      data: { fileUuid, individualId: norman.id, eventId, role: 'principal' },
    });

    await tx.gedcomIndividual.update({
      where: { id: norman.id },
      data: {
        deathDateId: dateId,
        deathPlaceId: placeId,
        deathDateDisplay: DEATH_ORIGINAL,
        deathPlaceDisplay: DEATH_PLACE_ORIGINAL,
        deathYear: 2022,
        isLiving: false,
      },
    });
  });

  console.log('Done. Norman Peter Gonsalves (@I0087@) death added: 10 NOV 2022, Concord, California.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
