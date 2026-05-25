#!/usr/bin/env node
import './load-env.js';
import { createHash } from 'crypto';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';
const XREF = '@I968@';
const NEW_DATE_ORIGINAL = '1 MAR 2007';
const NEW_YEAR = 2007;
const NEW_HASH = createHash('sha256').update(NEW_DATE_ORIGINAL.trim()).digest('hex');

const ind = await pool.query(
  `SELECT birth_date_id FROM gedcom_individuals_v2 WHERE file_uuid = $1 AND xref = $2`,
  [FILE_UUID, XREF]
);
if (ind.rows.length === 0) throw new Error('Kalena not found');
const birth_date_id = ind.rows[0].birth_date_id;

if (birth_date_id) {
  await pool.query(
    `UPDATE gedcom_dates_v2 SET year = $1, original = $2, hash = $3 WHERE id = $4`,
    [NEW_YEAR, NEW_DATE_ORIGINAL, NEW_HASH, birth_date_id]
  );
  console.log('gedcom_dates_v2: 1 row updated');
}

await pool.query(
  `UPDATE gedcom_individuals_v2 SET birth_year = $1, birth_date_display = $2 WHERE file_uuid = $3 AND xref = $4`,
  [NEW_YEAR, NEW_DATE_ORIGINAL, FILE_UUID, XREF]
);
console.log('gedcom_individuals_v2: 1 row updated');
console.log('Done. Kalena @I968@ birth year 2005 -> 2007 (1 MAR 2007).');
await pool.end();
