#!/usr/bin/env node
/**
 * Seed script to upload GEDCOM files and create tree records
 * 
 * This script:
 * 1. Uploads GEDCOM files to the Go API
 * 2. Creates tree records in the frontend database
 * 3. Associates them with the superuser (monalig)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { config } from '../config/index.js';

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: config.database.url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Configuration
const GO_API_URL = config.api.libApi.baseURL;
const TESTDATA_DIR = '/apps/gedcom-go/testdata';

// Files to upload with display names
const FILES_TO_UPLOAD = [
  { filename: 'royal92.ged', name: 'European Royal Families', description: 'European royal family genealogy data', isPublic: true },
  { filename: 'tree1.ged', name: 'Gonsalves Family Tree', description: 'Gonsalves family genealogy', isPublic: true },
  { filename: 'xavier.ged', name: 'Xavier Family Tree', description: 'Xavier family genealogy', isPublic: true },
  { filename: 'gracis.ged', name: 'Gracis Family Tree', description: 'Gracis family genealogy', isPublic: true },
  { filename: 'pres2020.ged', name: 'US Presidents', description: 'United States Presidents genealogy data', isPublic: true },
];

async function uploadToGoAPI(filePath, name) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('name', name);

  console.log(`  Uploading to Go API: ${path.basename(filePath)}...`);
  
  const response = await fetch(`${GO_API_URL}/api/v1/files`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Go API upload failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data.data; // Contains file_id, metadata, etc.
}

async function main() {
  console.log('🌳 GEDCOM Tree Seeding Script');
  console.log('='.repeat(50));

  try {
    // 1. Find the superuser (monalig)
    console.log('\n📋 Finding superuser (monalig)...');
    const superuser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'monalig' },
          { isWebsiteOwner: true },
        ],
      },
    });

    if (!superuser) {
      throw new Error('Superuser not found! Please run the database seed first.');
    }
    console.log(`  ✓ Found superuser: ${superuser.username} (${superuser.id})`);

    // 2. Check existing trees to avoid duplicates
    console.log('\n📋 Checking existing trees...');
    const existingTrees = await prisma.tree.findMany({
      select: { fileId: true, name: true },
    });
    const existingFileIds = new Set(existingTrees.map(t => t.fileId));
    console.log(`  Found ${existingTrees.length} existing trees`);

    // 3. Upload each file
    console.log('\n📤 Uploading GEDCOM files...');
    
    for (const fileConfig of FILES_TO_UPLOAD) {
      const filePath = path.join(TESTDATA_DIR, fileConfig.filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️ Skipping ${fileConfig.filename} - file not found`);
        continue;
      }

      console.log(`\n📁 Processing: ${fileConfig.filename}`);
      
      try {
        // Upload to Go API
        const goApiResult = await uploadToGoAPI(filePath, fileConfig.name);
        const fileId = goApiResult.file_id;
        
        console.log(`  ✓ Go API upload complete. File ID: ${fileId}`);

        // Check if tree already exists in frontend DB
        if (existingFileIds.has(fileId)) {
          console.log(`  ⚠️ Tree with fileId ${fileId} already exists in database, skipping...`);
          continue;
        }

        // Create tree record in frontend database
        console.log(`  Creating tree record in frontend database...`);
        const tree = await prisma.tree.create({
          data: {
            fileId: fileId,
            name: fileConfig.name,
            description: fileConfig.description,
            isPublic: fileConfig.isPublic,
          },
        });
        console.log(`  ✓ Tree created: ${tree.id}`);

        // Create tree owner record for superuser
        console.log(`  Assigning ownership to ${superuser.username}...`);
        await prisma.treeOwner.create({
          data: {
            treeId: tree.id,
            userId: superuser.id,
            isPrimary: true,
          },
        });
        console.log(`  ✓ Ownership assigned`);

        // Get some stats from the Go API
        const statsResponse = await fetch(`${GO_API_URL}/api/v1/files/${fileId}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const stats = statsData.data;
          console.log(`  📊 Stats: ${stats.individuals_count || 'N/A'} individuals, ${stats.families_count || 'N/A'} families`);
        }

        console.log(`  ✅ ${fileConfig.name} - Complete!`);
        
      } catch (err) {
        console.error(`  ❌ Error processing ${fileConfig.filename}:`, err.message);
      }
    }

    // 4. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary');
    
    const finalTrees = await prisma.tree.findMany({
      include: {
        owners: {
          include: { user: { select: { username: true } } },
        },
      },
    });
    
    console.log(`\nTotal trees in database: ${finalTrees.length}`);
    for (const tree of finalTrees) {
      const owners = tree.owners.map(o => o.user.username).join(', ');
      console.log(`  - ${tree.name} (${tree.isPublic ? 'Public' : 'Private'}) - Owners: ${owners}`);
    }

    console.log('\n✅ Seeding complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

