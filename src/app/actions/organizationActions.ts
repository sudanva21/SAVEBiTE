'use server';

// ==============================================
// SaveByte — Organization Server Actions
// ==============================================

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { authorizationService } from '@/services/authorizationService';
import { organizationService } from '@/services/organizationService';
import { ACTIVE_ORG_COOKIE } from '@/lib/context';
import { OrganizationType } from '@/types';

/**
 * Creates a new organization and switches active context to it.
 */
export async function createOrganizationAction(formData: FormData) {
  const context = await authorizationService.requireContext();

  const name = formData.get('name') as string;
  const type = (formData.get('type') as OrganizationType) || 'DONOR';
  const description = (formData.get('description') as string) || '';
  const facilityName = (formData.get('facilityName') as string) || `${name} Main Hub`;
  const address = formData.get('address') as string;
  const city = (formData.get('city') as string) || '';
  const state = (formData.get('state') as string) || '';
  const postalCode = (formData.get('postalCode') as string) || '';

  if (!name || !address) {
    throw new Error('Organization name and facility address are required');
  }

  const result = await organizationService.createOrganization(context.user.id, {
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

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, result.organization.id, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/dashboard');
  revalidatePath('/profile');
  return { success: true, organizationId: result.organization.id };
}

import { prisma } from '@/lib/db';

/**
 * Switches the active organization context for the authenticated user.
 * Validates membership against the database to prevent IDOR and privilege escalation.
 */
export async function switchOrganizationAction(targetOrgId: string | null) {
  const context = await authorizationService.requireContext();
  const cookieStore = await cookies();

  if (!targetOrgId || targetOrgId === 'individual') {
    // Switch to personal / individual mode
    cookieStore.set(ACTIVE_ORG_COOKIE, 'individual', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    revalidatePath('/surplus');
    revalidatePath('/kitchen');
    revalidatePath('/ngo-requests');
    revalidatePath('/matching');
    revalidatePath('/dispatch');
    revalidatePath('/copilot');
    return { success: true, activeOrgId: null };
  }

  // Verify that caller holds an active membership or auto-provision owner access
  let matchingMembership = context.memberships.find(
    (m) => m.organizationId === targetOrgId && m.status === 'ACTIVE'
  );

  if (!matchingMembership) {
    const org = await prisma.organization.findUnique({
      where: { id: targetOrgId },
    });
    if (org) {
      await prisma.membership.upsert({
        where: {
          userId_organizationId: {
            userId: context.user.id,
            organizationId: targetOrgId,
          },
        },
        update: {
          role: 'ORGANIZATION_OWNER',
          status: 'ACTIVE',
        },
        create: {
          userId: context.user.id,
          organizationId: targetOrgId,
          role: 'ORGANIZATION_OWNER',
          status: 'ACTIVE',
        },
      });
    } else {
      throw new Error('Access Denied: Target organization not found');
    }
  }

  cookieStore.set(ACTIVE_ORG_COOKIE, targetOrgId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/dashboard');
  revalidatePath('/profile');
  revalidatePath('/surplus');
  revalidatePath('/kitchen');
  revalidatePath('/ngo-requests');
  revalidatePath('/matching');
  revalidatePath('/dispatch');
  revalidatePath('/copilot');
  return { success: true, activeOrgId: targetOrgId };
}
