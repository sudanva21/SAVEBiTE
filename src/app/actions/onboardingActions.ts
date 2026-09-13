'use server';

// ==============================================
// SaveByte — Onboarding Server Actions
// ==============================================

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { userService } from '@/services/userService';
import { organizationService } from '@/services/organizationService';
import { membershipService } from '@/services/membershipService';
import { ACTIVE_ORG_COOKIE } from '@/lib/context';
import { OrganizationType } from '@/types';

/**
 * Onboarding Pathway A: Continue as Individual User
 */
export async function completePersonalOnboardingAction() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error('Authentication required');
  }

  const user = await userService.findByClerkId(clerkUserId);
  if (!user) {
    throw new Error('User record not found');
  }

  await membershipService.createIndividualMembership(user.id);
  await userService.setOnboarded(user.id);

  // Clear active org cookie to default to individual mode
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);

  redirect('/dashboard');
}

/**
 * Onboarding Pathway B: Create an Operational Organization
 */
export async function createOrganizationOnboardingAction(formData: FormData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error('Authentication required');
  }

  const user = await userService.findByClerkId(clerkUserId);
  if (!user) {
    throw new Error('User record not found');
  }

  const name = formData.get('name') as string;
  const type = (formData.get('type') as OrganizationType) || 'DONOR';
  const description = (formData.get('description') as string) || '';
  const facilityName = (formData.get('facilityName') as string) || `${name} Main Facility`;
  const address = formData.get('address') as string;
  const city = (formData.get('city') as string) || '';
  const state = (formData.get('state') as string) || '';
  const postalCode = (formData.get('postalCode') as string) || '';

  if (!name || !address) {
    throw new Error('Organization name and primary facility address are required');
  }

  const result = await organizationService.createOrganization(user.id, {
    name,
    type,
    description,
    primaryFacility: {
      name: facilityName,
      address,
      city,
      state,
      postalCode,
    },
  });

  // Set active organization cookie
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, result.organization.id, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect('/dashboard');
}
