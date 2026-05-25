#!/usr/bin/env node
/**
 * Set Adam Flores (@I1037@) birthday to 11 Jan 1987.
 * Creates GedcomDate, updates individual, adds BIRT event (events required).
 * Run: node scripts/add-adam-flores-birth.js
 */
import './load-env.js';
import { createHash } from 'crypto';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';
const ADAM_XREF = '@I1037@';
const BIRTH_ORIGINAL = '11 JAN 1987';

function dateHash(original) {
  return createHash('sha256').update(String(original).trim()).digest('hex');
}

async function ensureDate(client, fileUuid, original, year, month, day) {
  const hash = dateHash(original);
  const r = await client.query(
    `SELECT id FROM gedcom_dates_v2 WHERE file_uuid = $1 AND hash = $2`,
    [fileUuid, hash]
  );
  if (r.rows[0]) return r.rows[0].id;
  const ins = await client.query(
    `INSERT INTO gedcom_dates_v2 (id, file_uuid, original, date_type, calendar, year, month, day, hash)
     VALUES (gen_random_uuid(), $1, $2, 'EXACT', 'GREGORIAN', $3, $4, $5, $6)
     RETURNING id`,
    [fileUuid, original, year, month, day, hash]
  );
  return ins.rows[0].id;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adam = await client.query(
      `SELECT id FROM gedcom_individuals_v2 WHERE file_uuid = $1 AND xref = $2`,
      [FILE_UUID, ADAM_XREF]
    );
    if (!adam.rows[0]) throw new Error('Adam Flores (@I1037@) not found');
    const adamId = adam.rows[0].id;

    const birthDateId = await ensureDate(client, FILE_UUID, BIRTH_ORIGINAL, 1987, 1, 11);

    await client.query(
      `UPDATE gedcom_individuals_v2
       SET birth_date_id = $1, birth_date_display = $2, birth_year = 1987
       WHERE file_uuid = $3 AND xref = $4`,
      [birthDateId, BIRTH_ORIGINAL, FILE_UUID, ADAM_XREF]
    );

    const eventId = crypto.randomUUID();
    await client.query(
      `INSERT INTO gedcom_events_v2 (id, file_uuid, event_type, date_id, sort_order)
       VALUES ($1, $2, 'BIRT', $3, 0)`,
      [eventId, FILE_UUID, birthDateId]
    );
    await client.query(
      `INSERT INTO gedcom_individual_events_v2 (id, file_uuid, individual_id, event_id, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'principal')`,
      [FILE_UUID, adamId, eventId]
    );

    await client.query('COMMIT');
    console.log('Done. Adam /Flores/', ADAM_XREF, 'birth date set to 11 JAN 1987.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
