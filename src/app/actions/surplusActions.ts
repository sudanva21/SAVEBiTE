'use server';

// ==============================================
// SaveByte — Surplus Server Actions (Phase 3)
// ==============================================

import { revalidatePath } from 'next/cache';
import { surplusService } from '@/services/surplusService';

/**
 * Creates and publishes a surplus food listing from an inventory batch.
 */
export async function createSurplusListingAction(formData: FormData) {
  const facilityId = formData.get('facilityId') as string;
  const foodItemId = formData.get('foodItemId') as string;
  const batchId = formData.get('batchId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const unit = formData.get('unit') as string;
  const eligibleRecipientType = (formData.get('eligibleRecipientType') as any) || 'ALL';
  const availableUntil = formData.get('availableUntil') as string;
  const pickupAddress = formData.get('pickupAddress') as string;
  const pickupCity = formData.get('pickupCity') as string;
  const pickupWindow = formData.get('pickupWindow') as string;
  const storageCondition = formData.get('storageCondition') as string;
  const isFreeDonation = formData.get('isFreeDonation') !== 'false';
  const pricePerUnit = parseFloat((formData.get('pricePerUnit') as string) || '0');

  const listing = await surplusService.createSurplusListing({
    facilityId,
    foodItemId,
    batchId,
    title,
    description,
    quantity,
    unit,
    eligibleRecipientType,
    availableUntil,
    pickupAddress,
    pickupCity,
    pickupWindow,
    storageCondition,
    isFreeDonation,
    pricePerUnit,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/surplus');
  revalidatePath('/dashboard/matching');
  revalidatePath('/dashboard/buy-for-me');
  revalidatePath('/dashboard/sponsor');
  return { success: true, listing };
}

/**
 * Updates status of a surplus food listing.
 */
export async function updateSurplusStatusAction(
  listingId: string,
  status: string,
  reason?: string
) {
  const updated = await surplusService.updateSurplusStatus(listingId, status, reason);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/surplus');
  revalidatePath('/dashboard/matching');
  return { success: true, listing: updated };
}

/**
 * Lists surplus postings for caller's donor organization.
 */
export async function listMySurplusAction() {
  const listings = await surplusService.listMySurplus();
  return { success: true, listings };
}

/**
 * Discovers available surplus food.
 */
export async function discoverSurplusAction(filters: any = {}, callerType: 'NGO' | 'INDIVIDUAL' | 'ALL' = 'ALL') {
  const result = await surplusService.discoverSurplus(filters, callerType);
  return { success: true, ...result };
}

