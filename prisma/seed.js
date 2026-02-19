// Seed script to create initial data
// Run with: npx prisma db seed

import { config } from 'dotenv';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth.js';

// Load .env.local explicitly
config({ path: '.env.local' });

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('   Please set DATABASE_URL in .env.local');
  process.exit(1);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if website owner already exists
  const existingOwner = await prisma.user.findFirst({
    where: { isWebsiteOwner: true },
  });

  if (existingOwner) {
    console.log('✅ Website owner already exists:', existingOwner.username);
    return;
  }

  // Create website owner
  const passwordHash = await hashPassword('Oscar890!');
  
  const websiteOwner = await prisma.user.create({
    data: {
      username: 'monalig',
      email: 'monalig@ligneous.local',
      passwordHash,
      name: 'Website Owner',
      isWebsiteOwner: true,
    },
  });

  console.log('✅ Created website owner:');
  console.log('   Username:', websiteOwner.username);
  console.log('   Email:', websiteOwner.email);
  console.log('   ID:', websiteOwner.id);
  console.log('   Password: Oscar890!');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

