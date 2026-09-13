'use server';

// ==============================================
// SaveByte — Facility Server Actions
// ==============================================

import { revalidatePath } from 'next/cache';
import { authorizationService } from '@/services/authorizationService';
import { facilityService } from '@/services/facilityService';
import { FacilityType } from '@/types';

/**
 * Creates a new facility under the caller's active organization.
 */
export async function createFacilityAction(formData: FormData) {
  const { organization, membership } =
    await authorizationService.requirePermission('facility:create');

  const name = formData.get('name') as string;
  const type = (formData.get('type') as FacilityType) || 'WAREHOUSE';
  const address = formData.get('address') as string;
  const city = (formData.get('city') as string) || '';
  const state = (formData.get('state') as string) || '';
  const postalCode = (formData.get('postalCode') as string) || '';

  if (!name || !address) {
    throw new Error('Facility name and physical address are required');
  }

  const facility = await facilityService.createFacility(membership, organization.id, {
    name,
    type,
    address,
    city,
    state,
    postalCode,
    isPrimary: false,
    operatingStatus: 'ACTIVE',
  });

  revalidatePath('/dashboard');
  revalidatePath('/profile');
  return { success: true, facility };
}
