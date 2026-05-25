#!/usr/bin/env node
/**
 * Change Lucas Peter Gonsalves → Lucas Peter Ferreira (surname correction).
 * Updates gedcom_individuals_v2 fullName/fullNameLower and the name-form surname to Ferreira.
 * Run from ligneous-frontend: node scripts/lucas-gonsalves-to-ferreira.js
 */

import './load-env.js';
import { PrismaClient } from '@ligneous/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const OLD_FULL_NAME = 'Lucas Peter /Gonsalves/';
const OLD_FULL_NAME_LOWER = 'lucas peter /gonsalves/';
const NEW_FULL_NAME = 'Lucas Peter Ferreira';
const NEW_FULL_NAME_LOWER = 'lucas peter ferreira';
const OLD_SURNAME_LOWER = 'gonsalves';
const NEW_SURNAME = 'Ferreira';
const NEW_SURNAME_LOWER = 'ferreira';

async function main() {
  if (!config.database?.url && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Use .env.local in ligneous-frontend.');
  }

  const individual = await prisma.gedcomIndividual.findFirst({
    where: {
      OR: [
        { fullName: OLD_FULL_NAME },
        { fullNameLower: OLD_FULL_NAME_LOWER },
      ],
    },
    select: { id: true, fileUuid: true, fullName: true, xref: true },
  });

  if (!individual) {
    console.log('No individual found with name "' + OLD_FULL_NAME + '". Nothing to do.');
    return;
  }

  const { id: individualId, fileUuid } = individual;
  console.log('Found:', individual.fullName, individual.xref, 'fileUuid:', fileUuid);

  const gonsalvesSurname = await prisma.gedcomSurname.findFirst({
    where: { fileUuid, surnameLower: OLD_SURNAME_LOWER },
    select: { id: true },
  });

  if (!gonsalvesSurname) {
    console.log('No surname "Gonsalves" found in this file. Updating only fullName on individual.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.gedcomIndividual.update({
      where: { id: individualId },
      data: {
        fullName: NEW_FULL_NAME,
        fullNameLower: NEW_FULL_NAME_LOWER,
      },
    });

    if (gonsalvesSurname) {
      const nameForms = await tx.gedcomIndividualNameForm.findMany({
        where: { fileUuid, individualId },
        select: { id: true },
      });
      const nameFormIds = nameForms.map((nf) => nf.id);

      const linksToUpdate = await tx.gedcomNameFormSurname.findMany({
        where: {
          nameFormId: { in: nameFormIds },
          surnameId: gonsalvesSurname.id,
        },
        select: { id: true },
      });

      if (linksToUpdate.length > 0) {
        const ferreiraSurname = await tx.gedcomSurname.upsert({
          where: { fileUuid_surnameLower: { fileUuid, surnameLower: NEW_SURNAME_LOWER } },
          create: { fileUuid, surname: NEW_SURNAME, surnameLower: NEW_SURNAME_LOWER, frequency: 0 },
          update: {},
          select: { id: true },
        });

        for (const link of linksToUpdate) {
          await tx.gedcomNameFormSurname.update({
            where: { id: link.id },
            data: { surnameId: ferreiraSurname.id },
          });
        }
        console.log('Updated', linksToUpdate.length, 'name-form surname link(s) to Ferreira.');
      }
    }
  });

  console.log('Done. "' + OLD_FULL_NAME + '" → "' + NEW_FULL_NAME + '" (surname Ferreira).');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
