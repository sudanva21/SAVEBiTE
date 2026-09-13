'use server';

import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { seedFinalDemoScenario } from '@/lib/seed-final-demo';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function grantPlatformAdminAction() {
  const authResult = await auth();
  const clerkUserId = authResult?.userId;

  if (!clerkUserId) {
    redirect('/sign-in?redirect_url=/admin');
  }

  let user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: { memberships: true },
  });

  if (!user) {
    const clerkUser = await clerkCurrentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || null;
    const name =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'Platform Admin';

    user = await prisma.user.create({
      data: {
        clerkUserId,
        email: primaryEmail,
        displayName: name,
        avatarUrl: clerkUser?.imageUrl || null,
        role: 'PLATFORM_ADMIN',
        isOnboarded: true,
      },
      include: { memberships: true },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'PLATFORM_ADMIN',
        isOnboarded: true,
      },
      include: { memberships: true },
    });
  }

  if (!user) {
    throw new Error('User creation failed');
  }

  const existingMembership = user.memberships?.find(
    (m) => m.role === 'PLATFORM_ADMIN' && m.status === 'ACTIVE'
  );

  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        role: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
        organizationId: null,
      },
    });
  }

  // Pre-seed canonical SIH demo data if empty
  try {
    const appCount = await prisma.organizationApplication.count();
    if (appCount === 0) {
      await seedFinalDemoScenario();
    }
  } catch (err) {
    console.warn('[Admin Action] Seed notice:', err);
  }

  revalidatePath('/admin', 'layout');
  redirect('/admin');
}
