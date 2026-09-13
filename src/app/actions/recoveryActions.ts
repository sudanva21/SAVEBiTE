'use server';

// ==============================================
// SaveByte — Recovery & Fulfillment Actions (Phase 3)
// ==============================================

import { revalidatePath } from 'next/cache';
import { recoveryService } from '@/services/recoveryService';

/**
 * Initiates an individual "Buy for Me" reservation.
 */
export async function buyForMeAction(formData: FormData) {
  const surplusListingId = formData.get('surplusListingId') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const notes = (formData.get('notes') as string) || '';

  const recovery = await recoveryService.initiateBuyForMe({
    surplusListingId,
    quantity,
    notes,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/buy-for-me');
  revalidatePath('/dashboard/recovery');
  return { success: true, recovery };
}

/**
 * Initiates a "Sponsor a Meal" community donation.
 */
export async function sponsorMealAction(formData: FormData) {
  const surplusListingId = formData.get('surplusListingId') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const sponsorNotes = (formData.get('sponsorNotes') as string) || '';

  const recovery = await recoveryService.initiateSponsorMeal({
    surplusListingId,
    quantity,
    sponsorNotes,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sponsor');
  revalidatePath('/dashboard/recovery');
  return { success: true, recovery };
}

/**
 * Confirms pickup using the secure 6-digit verification PIN.
 */
export async function confirmPickupAction(recoveryId: string, verificationPin: string) {
  const recovery = await recoveryService.confirmPickup(recoveryId, verificationPin);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/recovery');
  return { success: true, recovery };
}

/**
 * Confirms delivery or handover to destination.
 */
export async function confirmDeliveryAction(recoveryId: string, notes?: string) {
  const recovery = await recoveryService.confirmDeliveryOrHandover(recoveryId, notes);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/recovery');
  return { success: true, recovery };
}

/**
 * Completes the food recovery lifecycle.
 */
export async function completeRecoveryAction(recoveryId: string, notes?: string) {
  const recovery = await recoveryService.completeRecovery(recoveryId, notes);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/recovery');
  return { success: true, recovery };
}

/**
 * Cancels a recovery order.
 */
export async function cancelRecoveryAction(recoveryId: string, reason: string) {
  const recovery = await recoveryService.cancelRecovery(recoveryId, reason);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/recovery');
  return { success: true, recovery };
}

/**
 * Lists recovery transactions according to the caller's role context.
 */
export async function listRecoveriesAction(filters?: any) {
  const recoveries = await recoveryService.listRecoveries(filters);
  return { success: true, recoveries };
}

/**
 * Retrieves details for a specific recovery transaction.
 */
export async function getRecoveryAction(recoveryId: string) {
  const recovery = await recoveryService.getRecovery(recoveryId);
  return { success: true, recovery };
}

