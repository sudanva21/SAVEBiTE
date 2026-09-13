'use server';

// ==============================================
// SaveByte — Matching Server Actions (Phase 4)
// ==============================================

import { revalidatePath } from 'next/cache';
import { matchingService } from '@/services/matchingService';
import { authorizationService } from '@/services/authorizationService';
import { prisma } from '@/lib/db';

/**
 * Discovers and evaluates ranked recipient matches for a surplus listing.
 */
export async function getMatchesForSurplusAction(surplusListingId: string) {
  try {
    const matches = await matchingService.findMatchesForSurplus(surplusListingId);
    return { success: true, matches };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to evaluate matches' };
  }
}

/**
 * Lists match recommendations where the current user/organization is the recipient.
 */
export async function listRecipientMatchesAction() {
  try {
    const context = await authorizationService.requireContext();
    const orgId = context.activeOrganization?.id;
    const matches = await prisma.matchRecommendation.findMany({
      where: orgId ? { recipientOrganizationId: orgId } : { recipientUserId: context.user.id },
      include: {
        surplusListing: { include: { foodItem: true, donorOrganization: true } },
        foodRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, matches };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to list recipient matches' };
  }
}

/**
 * Accepts a match recommendation, transactionally allocating surplus,
 * creating a RecoveryTransaction and an initial DeliveryRoute.
 */
export async function acceptMatchAction(recommendationId: string, customQuantity?: number) {
  try {
    const result = await matchingService.acceptMatch(recommendationId, customQuantity);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/matching');
    revalidatePath('/dashboard/surplus');
    revalidatePath('/dashboard/recovery');
    revalidatePath('/dashboard/routes');

    return {
      success: true,
      recommendation: result.match,
      recoveryTransaction: result.recoveryTransaction,
      deliveryRoute: result.deliveryRoute,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to accept match' };
  }
}

/**
 * Rejects a match recommendation with an optional reason.
 */
export async function rejectMatchAction(recommendationId: string, reason?: string) {
  try {
    const recommendation = await matchingService.rejectMatch(recommendationId, reason);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/matching');

    return { success: true, recommendation };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reject match' };
  }
}
