import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { prisma } from '../src/lib/db';

async function testConnection() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 30)}...` : 'NONE');
  
  try {
    const userCount = await prisma.user.count();
    console.log('Current user count:', userCount);

    // Create demo seed user if 0
    const demoUser = await prisma.user.upsert({
      where: { clerkUserId: 'user_sudanva_admin' },
      update: {},
      create: {
        id: 'usr_sudanva_platform_admin',
        clerkUserId: 'user_sudanva_admin',
        email: 'sudanva7@gmail.com',
        displayName: 'Sudanva (Platform Admin)',
        isOnboarded: true,
      },
    });
    console.log('Upserted demo user:', demoUser.email);

    const updatedCount = await prisma.user.count();
    console.log('Updated user count in Neon:', updatedCount);
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await prisma.$disconnect?.();
  }
}

testConnection();
