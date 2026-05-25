#!/usr/bin/env node
/**
 * Upload the 5 valid GEDCOM testdata files using Path B (POST /api/trees/upload).
 * Requires the Next.js app to be running (e.g. npm run dev on port 4000)
 * and valid credentials (default: monalig / from env).
 *
 * Usage:
 *   node scripts/upload-testdata-path-b.js
 *   BASE_URL=http://localhost:4000 SEED_USERNAME=monalig SEED_PASSWORD=... node scripts/upload-testdata-path-b.js
 */

import fs from 'fs';
import path from 'path';

const TESTDATA_DIR = '/apps/temp-family-tree-code/gedcom-go/testdata';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const USERNAME = process.env.SEED_USERNAME || 'monalig';
const PASSWORD = process.env.SEED_PASSWORD || (process.env.SEED_PASSWORD_FILE
  ? fs.readFileSync(process.env.SEED_PASSWORD_FILE, 'utf8').trim()
  : 'Oscar890!');

const FILES_TO_UPLOAD = [
  { filename: 'gracis.ged', name: 'Gracis Family Tree', description: 'Gracis family genealogy', isPublic: true },
  { filename: 'pres2020.ged', name: 'US Presidents', description: 'United States Presidents genealogy data', isPublic: true },
  { filename: 'royal92.ged', name: 'European Royal Families', description: 'European royal family genealogy data', isPublic: true },
  { filename: 'tree1.ged', name: 'Gonsalves Family Tree', description: 'Gonsalves family genealogy', isPublic: true },
  { filename: 'xavier.ged', name: 'Xavier Family Tree', description: 'Xavier family genealogy', isPublic: true },
];

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Login failed: ${res.status}`);
  }
  const data = await res.json();
  return data.token;
}

async function uploadTree(token, filePath, name, description, isPublic) {
  const buf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buf]), path.basename(filePath));
  form.append('name', name);
  form.append('description', description || '');
  form.append('isPublic', String(isPublic));

  const res = await fetch(`${BASE_URL}/api/trees/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

async function main() {
  console.log('🌳 Upload testdata via Path B (POST /api/trees/upload)');
  console.log('   Base URL:', BASE_URL);
  console.log('   User:', USERNAME);
  console.log('');

  let token;
  try {
    console.log('🔐 Logging in...');
    token = await login();
    console.log('   ✓ Logged in\n');
  } catch (e) {
    console.error('❌ Login failed:', e.message);
    process.exit(1);
  }

  for (const fileConfig of FILES_TO_UPLOAD) {
    const filePath = path.join(TESTDATA_DIR, fileConfig.filename);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skip ${fileConfig.filename} (file not found)`);
      continue;
    }

    try {
      console.log(`📤 Uploading ${fileConfig.filename} as "${fileConfig.name}"...`);
      const result = await uploadTree(
        token,
        filePath,
        fileConfig.name,
        fileConfig.description,
        fileConfig.isPublic
      );
      console.log(`   ✓ Tree ID: ${result.tree?.id ?? result.tree?.id}`);
      if (result.tree?.individualsCount != null) {
        console.log(`   📊 ${result.tree.individualsCount} individuals, ${result.tree.familiesCount ?? '?'} families`);
      }
      console.log('');
    } catch (e) {
      console.error(`   ❌ ${e.message}\n`);
    }
  }

  console.log('✅ Done.');
}

main();
