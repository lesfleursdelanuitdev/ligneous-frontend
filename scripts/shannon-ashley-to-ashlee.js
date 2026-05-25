#!/usr/bin/env node
/**
 * Shannon Ashley Ann Gonsalves → Shannon Ashlee Ann Gonsalves.
 * Updates full_name on individual and the given-name link from "Ashley" to "Ashlee".
 */
import './load-env.js';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';
const XREF = '@I0151@';
const NEW_FULL_NAME = 'Shannon Ashlee Ann /Gonsalves/';
const NEW_FULL_NAME_LOWER = 'shannon ashlee ann /gonsalves/';
const ASHLEY_GIVEN_LOWER = 'ashley';
const ASHLEE_GIVEN = 'Ashlee';
const ASHLEE_GIVEN_LOWER = 'ashlee';

// 1. Get or create "Ashlee" in gedcom_given_names_v2
const gn = await pool.query(
  `INSERT INTO gedcom_given_names_v2 (id, file_uuid, given_name, given_name_lower, frequency)
   VALUES (gen_random_uuid(), $1, $2, $3, 0)
   ON CONFLICT (file_uuid, given_name_lower) DO UPDATE SET given_name = EXCLUDED.given_name
   RETURNING id`,
  [FILE_UUID, ASHLEE_GIVEN, ASHLEE_GIVEN_LOWER]
);
const ashlee_given_name_id = gn.rows[0].id;

// 2. Get Ashley's given_name id
const ashleyRow = await pool.query(
  `SELECT id FROM gedcom_given_names_v2 WHERE file_uuid = $1 AND given_name_lower = $2`,
  [FILE_UUID, ASHLEY_GIVEN_LOWER]
);
const ashley_given_name_id = ashleyRow.rows[0]?.id;
if (!ashley_given_name_id) throw new Error('Ashley given name not found');

// 3. Update name-form links: where this individual's name forms use Ashley, point to Ashlee
const nameForms = await pool.query(
  `SELECT id FROM gedcom_individual_name_forms WHERE file_uuid = $1 AND individual_id = (SELECT id FROM gedcom_individuals_v2 WHERE file_uuid = $1 AND xref = $2)`,
  [FILE_UUID, XREF]
);
for (const nf of nameForms.rows) {
  await pool.query(
    `UPDATE gedcom_name_form_given_names SET given_name_id = $1
     WHERE name_form_id = $2 AND given_name_id = $3`,
    [ashlee_given_name_id, nf.id, ashley_given_name_id]
  );
}
console.log('gedcom_name_form_given_names: updated', nameForms.rows.length, 'form(s) to Ashlee');

// 4. Update individual full_name and full_name_lower
await pool.query(
  `UPDATE gedcom_individuals_v2 SET full_name = $1, full_name_lower = $2 WHERE file_uuid = $3 AND xref = $4`,
  [NEW_FULL_NAME, NEW_FULL_NAME_LOWER, FILE_UUID, XREF]
);
console.log('gedcom_individuals_v2: full_name →', NEW_FULL_NAME);

console.log('Done. Shannon Ashley Ann → Shannon Ashlee Ann Gonsalves (@I0151@).');
await pool.end();
