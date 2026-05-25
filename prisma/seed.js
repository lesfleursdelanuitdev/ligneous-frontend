// Seed script to create initial data
// Run with: npx prisma db seed

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PrismaClient } from '@ligneous/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { seedGedcomRegistry } from './seed-gedcom-registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('   Please set DATABASE_URL in .env.local or .env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  await seedGedcomRegistry(prisma);

  let user = await prisma.user.findFirst({
    where: { isWebsiteOwner: true },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash('Oscar890!', 10);
    user = await prisma.user.create({
      data: {
        username: 'monalig',
        email: 'monalig@ligneous.local',
        passwordHash,
        name: 'Website Owner',
        isWebsiteOwner: true,
      },
    });
    console.log('✅ Created website owner:', user.username);
    console.log('   Password: Oscar890!');
    console.log('⚠️  Change the password after first login!');
  } else {
    console.log('✅ Website owner already exists:', user.username);
  }

  let tree = await prisma.tree.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!tree) {
    tree = await prisma.tree.create({
      data: {
        fileId: 'seed-dummy-tree',
        name: 'Seed Tree',
        description: 'Tree created by seed for development.',
        isPublic: false,
      },
    });
    await prisma.treeOwner.create({
      data: { treeId: tree.id, userId: user.id, isPrimary: true },
    });
    console.log('✅ Created seed tree:', tree.name);
  } else {
    console.log('✅ Using existing tree:', tree.name);
  }

  // Trees that don't have any most_wanted threads yet (so we add dummy data for each)
  const treesWithMostWanted = await prisma.discussionThread.findMany({
    where: { category: 'most_wanted' },
    select: { treeId: true },
    distinct: ['treeId'],
  });
  const treeIdsWithData = new Set(treesWithMostWanted.map((t) => t.treeId));
  const allTrees = await prisma.tree.findMany({ select: { id: true, name: true } });
  const treesToSeed = allTrees.filter((t) => !treeIdsWithData.has(t.id));

  if (treesToSeed.length === 0) {
    console.log('✅ All trees already have most-wanted dummy data; skipping.');
    return;
  }

  for (const treeRecord of treesToSeed) {
    const treeId = treeRecord.id;
    const t1 = await prisma.discussionThread.create({
      data: {
        treeId,
        category: 'most_wanted',
        title: 'Augustino Gracis – where was he originally from?',
        description: 'Trying to trace origins; possible links to Madeira or Italy.',
        createdBy: user.id,
        isClosed: false,
      },
    });
    const t2 = await prisma.discussionThread.create({
      data: {
        treeId,
        category: 'most_wanted',
        title: 'Mary Jones – maiden name and parents',
        description: 'Need to confirm parents and birth parish in Wales.',
        createdBy: user.id,
        isClosed: true,
      },
    });
    const t3 = await prisma.discussionThread.create({
      data: {
        treeId,
        category: 'most_wanted',
        title: 'William Smith – immigration 1909',
        description: 'Cross-reference UK outbound with NY arrival.',
        createdBy: user.id,
        isClosed: false,
      },
    });

    const post1a = await prisma.discussionPost.create({
      data: { threadId: t1.id, userId: user.id, content: 'Possible link to Madeira – found a record in Funchal.' },
    });
    const post1b = await prisma.discussionPost.create({
      data: { threadId: t1.id, userId: user.id, content: 'I found someone else in Italy with the same last name – could be related.' },
    });
    const post2a = await prisma.discussionPost.create({
      data: { threadId: t2.id, userId: user.id, content: 'Cardiff parish registers – checking St Mary\'s.' },
    });
    const post3a = await prisma.discussionPost.create({
      data: { threadId: t3.id, userId: user.id, content: 'Ellis Island manifest matches; looking for UK departure.' },
    });

    await prisma.comment.create({
      data: {
        entityType: 'discussion_post',
        entityId: post1a.id,
        treeId,
        userId: user.id,
        content: 'That Funchal record looks promising. Can you share the source?',
      },
    });
    await prisma.comment.create({
      data: {
        entityType: 'discussion_post',
        entityId: post1a.id,
        treeId,
        userId: user.id,
        content: 'Will add the citation this week.',
      },
    });
    await prisma.comment.create({
      data: {
        entityType: 'discussion_post',
        entityId: post1b.id,
        treeId,
        userId: user.id,
        content: 'Worth building a timeline for both to compare.',
      },
    });

    await prisma.discussionThreadEntity.createMany({
      data: [
        { threadId: t1.id, entityType: 'individual', entityId: 'I1' },
        { threadId: t1.id, entityType: 'family', entityId: 'F1' },
        { threadId: t2.id, entityType: 'individual', entityId: 'I2' },
        { threadId: t3.id, entityType: 'individual', entityId: 'I3' },
      ],
    });
  }

  console.log('✅ Created most-wanted dummy data for', treesToSeed.length, 'tree(s): 3 threads, topic posts, comments, and thread–entity links each.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
