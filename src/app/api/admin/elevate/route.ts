// ==============================================
// SaveByte — Developer & Evaluator Admin Elevation Route
// ==============================================
// Accessing /api/admin/elevate grants the currently authenticated
// Clerk user the PLATFORM_ADMIN role and redirects directly to /admin.

import { NextResponse } from 'next/server';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { seedFinalDemoScenario } from '@/lib/seed-final-demo';

export async function GET(request: Request) {
  const authResult = await auth();
  const clerkUserId = authResult?.userId;

  if (!clerkUserId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', '/admin');
    return NextResponse.redirect(signInUrl);
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
        status: 'ACTIVE',
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

  // Ensure active PLATFORM_ADMIN membership exists
  const existingAdminMembership = user.memberships?.find(
    (m) => m.role === 'PLATFORM_ADMIN' && m.status === 'ACTIVE'
  );

  if (!existingAdminMembership) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        role: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
        organizationId: null,
      },
    });
  }

  // Ensure canonical demo scenario is seeded so admin panel has rich real-time data
  try {
    const appCount = await prisma.organizationApplication.count();
    if (appCount === 0) {
      await seedFinalDemoScenario();
    }
  } catch (err) {
    console.warn('[Elevate] Seed demo notice:', err);
  }

  const adminUrl = new URL('/admin', request.url);
  return NextResponse.redirect(adminUrl);
}
