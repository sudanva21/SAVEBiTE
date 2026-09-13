'use server';

// ==============================================
// SaveByte — Request Server Actions (Phase 3)
// ==============================================

import { revalidatePath } from 'next/cache';
import { requestService } from '@/services/requestService';

/**
 * Creates a food request for surplus food.
 */
export async function createFoodRequestAction(formData: FormData) {
  const surplusListingId = (formData.get('surplusListingId') as string) || null;
  const foodCategory = formData.get('foodCategory') as string;
  const requestedQuantity = parseFloat(formData.get('requestedQuantity') as string);
  const unit = formData.get('unit') as string;
  const intendedUse = formData.get('intendedUse') as string;
  const beneficiaryCount = formData.get('beneficiaryCount')
    ? parseInt(formData.get('beneficiaryCount') as string, 10)
    : null;
  const urgency = (formData.get('urgency') as any) || 'STANDARD';
  const deliveryLocation = formData.get('deliveryLocation') as string;
  const notes = formData.get('notes') as string;

  const request = await requestService.createRequest({
    surplusListingId,
    foodCategory,
    requestedQuantity,
    unit,
    intendedUse,
    beneficiaryCount,
    urgency,
    deliveryLocation,
    notes,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/matching');
  revalidatePath('/dashboard/requests');
  return { success: true, request };
}

/**
 * Accepts a food request, allocating surplus inventory.
 */
export async function acceptFoodRequestAction(
  requestId: string,
  allocatedQuantity?: number
) {
  const result = await requestService.acceptRequest(requestId, allocatedQuantity);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard/surplus');
  revalidatePath('/dashboard/recovery');
  return { success: true, ...result };
}

/**
 * Rejects a food request.
 */
export async function rejectFoodRequestAction(requestId: string, reason: string) {
  const request = await requestService.rejectRequest(requestId, reason);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/requests');
  return { success: true, request };
}

/**
 * Cancels a pending food request.
 */
export async function cancelFoodRequestAction(requestId: string) {
  const request = await requestService.cancelRequest(requestId);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/matching');
  revalidatePath('/dashboard/requests');
  return { success: true, request };
}

/**
 * Lists incoming requests for the caller's donor organization.
 */
export async function listIncomingRequestsAction() {
  const requests = await requestService.listRequestsForDonor();
  return { success: true, requests };
}

/**
 * Lists requests submitted by the caller.
 */
export async function listMyRequestsAction() {
  const requests = await requestService.listRequestsForRequester();
  return { success: true, requests };
}

