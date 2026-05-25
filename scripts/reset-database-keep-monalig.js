#!/usr/bin/env node
/**
 * Reset database: Keep only the monalig user, delete everything else.
 * Run: node scripts/reset-database-keep-monalig.js
 * Requires: DATABASE_URL in .env or .env.local
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PrismaClient } from '@ligneous/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found. Set it in .env.local or .env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const kept = await prisma.user.findUnique({ where: { username: 'monalig' } });
  if (!kept) {
    throw new Error('User monalig not found. Run "npm run db:seed" first.');
  }
  console.log(`✓ Keeping user: monalig (${kept.id})`);

  console.log('\n🗑️  Resetting database...');

  await prisma.$transaction(async (tx) => {
    // 1. Break tree -> gedcom_file link
    await tx.$executeRawUnsafe('UPDATE trees SET gedcom_file_id = NULL');
    // 2. Delete GEDCOM tags and event types (can have null file_uuid)
    await tx.$executeRawUnsafe('DELETE FROM gedcom_tags');
    await tx.$executeRawUnsafe('DELETE FROM event_types');
    // 3. Delete all GEDCOM data (gedcom_files cascades to gedcom_*)
    await tx.$executeRawUnsafe('DELETE FROM gedcom_files');
    // 4. Delete trees (cascades to tree_owners, stories, permissions, etc.)
    await tx.$executeRawUnsafe('DELETE FROM trees');
    // 5. Delete session-related (not user-specific cascade)
    await tx.$executeRawUnsafe('DELETE FROM sessions');
    await tx.$executeRawUnsafe('DELETE FROM password_reset_tokens');
    // 6. Delete tag-related
    await tx.$executeRawUnsafe('DELETE FROM tagged_items');
    await tx.$executeRawUnsafe('DELETE FROM tags');
    // 7. Delete invitation link data
    await tx.$executeRawUnsafe('DELETE FROM invitation_link_uses');
    await tx.$executeRawUnsafe('DELETE FROM invitation_links');
    // 8. Discussion/collaboration (treeId nullable - delete all)
    await tx.$executeRawUnsafe('DELETE FROM entity_likes');
    await tx.$executeRawUnsafe('DELETE FROM discussion_posts');
    await tx.$executeRawUnsafe('DELETE FROM discussion_thread_entities');
    await tx.$executeRawUnsafe('DELETE FROM discussion_threads');
    await tx.$executeRawUnsafe('DELETE FROM comments');
    await tx.$executeRawUnsafe('DELETE FROM suggestions');
    await tx.$executeRawUnsafe('DELETE FROM access_requests');
    await tx.$executeRawUnsafe('DELETE FROM permissions');
    await tx.$executeRawUnsafe('DELETE FROM user_individual_links');
    await tx.$executeRawUnsafe('DELETE FROM tree_maintainers');
    await tx.$executeRawUnsafe('DELETE FROM tree_contributors');
    await tx.$executeRawUnsafe('DELETE FROM tree_owners');
    await tx.$executeRawUnsafe('DELETE FROM private_data');
    // 9. User-scoped content (messages before message_groups - FK)
    await tx.$executeRawUnsafe('DELETE FROM content_likes');
    await tx.$executeRawUnsafe('DELETE FROM content_comments');
    await tx.$executeRawUnsafe('DELETE FROM content_shares');
    await tx.$executeRawUnsafe('DELETE FROM user_feeds');
    await tx.$executeRawUnsafe('DELETE FROM user_content');
    await tx.$executeRawUnsafe('DELETE FROM notifications');
    await tx.$executeRawUnsafe('DELETE FROM activities');
    await tx.$executeRawUnsafe('DELETE FROM media_attachments');
    await tx.$executeRawUnsafe('DELETE FROM messages');
    await tx.$executeRawUnsafe('DELETE FROM albums');
    await tx.$executeRawUnsafe('DELETE FROM album_media');
    await tx.$executeRawUnsafe('DELETE FROM album_shares');
    await tx.$executeRawUnsafe('DELETE FROM user_profiles');
    await tx.$executeRawUnsafe('DELETE FROM follows');
    await tx.$executeRawUnsafe('DELETE FROM notebooks');
    await tx.$executeRawUnsafe('DELETE FROM research_notes');
    await tx.$executeRawUnsafe('DELETE FROM research_todo_items');
    await tx.$executeRawUnsafe('DELETE FROM research_links');
    await tx.$executeRawUnsafe('DELETE FROM message_groups');
    await tx.$executeRawUnsafe('DELETE FROM story_subjects');
    await tx.$executeRawUnsafe('DELETE FROM stories');

    // 9. Delete all users except monalig
    await tx.user.deleteMany({ where: { username: { not: 'monalig' } } });
  });

  console.log('✅ Database reset complete. Only monalig remains.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
