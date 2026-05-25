#!/usr/bin/env node
/**
 * Seed script to create tree records from GEDCOM files
 *
 * Uses ligneous-gedcom-lib-api (parse-validate-enrich) then imports
 * into the frontend database - same flow as the upload UI.
 *
 * 1. Send each GEDCOM file to lib-api for parse + validate + enrich
 * 2. Import enriched data into the database
 * 3. Create Tree + TreeOwner records for monalig
 */

import './load-env.js';
import { PrismaClient } from '@ligneous/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { config } from '../config/index.js';
import { importEnrichedDocument } from '../lib/import/gedcom-import.js';

const pool = new pg.Pool({ connectionString: config.database.url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LIB_API_URL = config.api.libApi.baseURL;
const TESTDATA_DIR = '/apps/temp-family-tree-code/gedcom-go/testdata';

const FILES_TO_UPLOAD = [
  { filename: 'royal92.ged', name: 'European Royal Families', description: 'European royal family genealogy data', isPublic: true },
  { filename: 'tree1.ged', name: 'Gonsalves Family Tree', description: 'Gonsalves family genealogy', isPublic: true },
  { filename: 'xavier.ged', name: 'Xavier Family Tree', description: 'Xavier family genealogy', isPublic: true },
  { filename: 'gracis.ged', name: 'Gracis Family Tree', description: 'Gracis family genealogy', isPublic: true },
  { filename: 'pres2020.ged', name: 'US Presidents', description: 'United States Presidents genealogy data', isPublic: true },
];

async function processWithLibApi(filePath, name) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await fetch(`${LIB_API_URL}/api/v1/parse-validate-enrich?generateIds=true`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Lib API failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('🌳 GEDCOM Tree Seeding Script (lib-api flow)');
  console.log('='.repeat(50));
  console.log(`Lib API: ${LIB_API_URL}`);
  console.log('');

  try {
    const superuser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'monalig' },
          { isWebsiteOwner: true },
        ],
      },
    });

    if (!superuser) {
      throw new Error('Superuser not found! Run "npm run db:seed" first.');
    }
    console.log(`✓ Found superuser: ${superuser.username} (${superuser.id})\n`);

    const existingTrees = await prisma.tree.findMany({ select: { name: true } });
    const existingNames = new Set(existingTrees.map((t) => t.name));
    console.log(`Found ${existingTrees.length} existing trees\n`);

    for (const fileConfig of FILES_TO_UPLOAD) {
      const filePath = path.join(TESTDATA_DIR, fileConfig.filename);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠ Skipping ${fileConfig.filename} - file not found`);
        continue;
      }

      if (existingNames.has(fileConfig.name)) {
        console.log(`⚠ Skipping ${fileConfig.name} - tree already exists`);
        continue;
      }

      console.log(`📁 Processing: ${fileConfig.filename}`);

      try {
        console.log(`  Sending to lib-api (parse-validate-enrich)...`);
        const result = await processWithLibApi(filePath, fileConfig.name);

        const validation = result.validation || {};
        if (validation.valid === false) {
          const errors = (validation.errors || []).filter((e) => e.severity === 'error');
          if (errors.length > 0) {
            console.error(`  ❌ Validation errors: ${errors.length}`);
            continue;
          }
        }

        const enriched = result.enriched;
        const stats = result.stats || {};

        console.log(`  Importing into database...`);
        const { gedcomFile, fileId, familiesImported } = await importEnrichedDocument(enriched, stats, {
          name: fileConfig.name,
          originalFilename: fileConfig.filename,
          fileSize: fs.statSync(filePath).size,
        });

        const tree = await prisma.tree.create({
          data: {
            fileId,
            gedcomFileId: gedcomFile.id,
            name: fileConfig.name,
            description: fileConfig.description,
            isPublic: fileConfig.isPublic,
          },
        });

        await prisma.treeOwner.create({
          data: {
            treeId: tree.id,
            userId: superuser.id,
            isPrimary: true,
            addedBy: superuser.id,
          },
        });

        console.log(`  ✓ ${fileConfig.name} - ${stats.individuals || 0} individuals, ${familiesImported} families`);
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
      }
    }

    const finalTrees = await prisma.tree.findMany({
      include: { owners: { include: { user: { select: { username: true } } } } },
    });

    console.log('\n' + '='.repeat(50));
    console.log(`Total trees: ${finalTrees.length}`);
    for (const tree of finalTrees) {
      const owners = tree.owners.map((o) => o.user.username).join(', ');
      console.log(`  - ${tree.name} - Owners: ${owners}`);
    }
    console.log('\n✅ Seeding complete!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
