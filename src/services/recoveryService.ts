// ==============================================
// SaveByte — Recovery, Fulfillment & Handover Service (Phase 3)
// ==============================================
//
// Manages the complete physical handover lifecycle:
// RESERVED → READY_FOR_PICKUP → PICKUP_ASSIGNED → COLLECTED → DELIVERED → COMPLETED
//
// Features:
// 1. "Buy for Me" individual purchase reservation
// 2. "Sponsor a Meal" community direct sponsorship
// 3. 6-digit secure handover PIN verification
// 4. Traceable handover timeline (scheduled → collected → delivered → completed)
// 5. Automatic surplus completion check
// 6. Strict cross-party access control
//

import { prisma } from '@/lib/db';
import { authorizationService } from './authorizationService';
import { auditService } from './auditService';
import { RecoveryTransaction } from '@/generated/prisma';
import {
  InitiateBuyForMeInput,
  InitiateSponsorMealInput,
  RecoveryFilterOptions,
} from '@/types';

export const recoveryService = {
  /**
   * Initiates a "Buy for Me" reservation for an individual consumer.
   */
  async initiateBuyForMe(
    input: InitiateBuyForMeInput
  ): Promise<RecoveryTransaction> {
    const { context } = await authorizationService.requireUserPermission('buyer:purchase');

    if (typeof input.quantity !== 'number' || input.quantity <= 0 || isNaN(input.quantity)) {
      throw new Error('Validation Error: Purchase quantity must be a positive number greater than 0');
    }

    const listing = await prisma.surplusListing.findUnique({
      where: { id: input.surplusListingId },
      include: { foodItem: true, facility: true, donorOrganization: true },
    });

    if (!listing) {
      throw new Error(`Surplus listing with ID ${input.surplusListingId} was not found`);
    }

    if (listing.status !== 'PUBLISHED') {
      throw new Error(`Availability Error: Surplus listing is currently ${listing.status} and cannot be reserved`);
    }

    if (new Date(listing.availableUntil).getTime() <= Date.now()) {
      throw new Error('Availability Error: This surplus listing has expired');
    }

    if (listing.eligibleRecipientType === 'NGO_ONLY') {
      throw new Error('Eligibility Error: This food listing is reserved exclusively for registered NGOs');
    }

    if (input.quantity > listing.availableQuantity) {
      throw new Error(
        `Quantity Error: Requested quantity (${input.quantity} ${listing.unit}) exceeds available stock (${listing.availableQuantity} ${listing.unit})`
      );
    }

    const verificationPin = Math.floor(100000 + Math.random() * 900000).toString();

    const recovery = await prisma.$transaction(async (tx) => {
      // 1. Decrement available quantity
      const remainingQty = listing.availableQuantity - input.quantity;
      const listingStatus = remainingQty === 0 ? 'RESERVED' : listing.status;

      await tx.surplusListing.update({
        where: { id: listing.id },
        data: {
          availableQuantity: remainingQty,
          status: listingStatus,
        },
      });

      // 2. Create recovery transaction
      return tx.recoveryTransaction.create({
        data: {
          donorOrganizationId: listing.donorOrganizationId,
          facilityId: listing.facilityId,
          surplusListingId: listing.id,
          foodItemId: listing.foodItemId,
          batchId: listing.batchId,
          recipientUserId: context.user.id,
          recipientOrganizationId: null,
          orderType: 'BUY_FOR_ME',
          quantity: input.quantity,
          unit: listing.unit,
          status: 'RESERVED',
          pickupAddress: listing.pickupAddress,
          pickupWindow: listing.pickupWindow,
          pickupLatitude: listing.pickupLatitude,
          pickupLongitude: listing.pickupLongitude,
          verificationPin,
          scheduledPickupTime: new Date(Date.now() + 3600000), // 1 hour
          notes: input.notes?.trim() || 'Reserved via Buy for Me',
        },
        include: {
          donorOrganization: true,
          facility: true,
          surplusListing: true,
          foodItem: true,
          recipientUser: true,
        },
      });
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'recovery.created',
      entity: 'RecoveryTransaction',
      entityId: recovery.id,
      newState: recovery,
      reason: 'User initiated Buy for Me reservation',
      context: { orderType: 'BUY_FOR_ME', listingId: listing.id, quantity: input.quantity },
    });

    return recovery;
  },

  /**
   * Initiates a "Sponsor a Meal" transaction for community food relief.
   */
  async initiateSponsorMeal(
    input: InitiateSponsorMealInput
  ): Promise<RecoveryTransaction> {
    const { context } = await authorizationService.requireUserPermission('sponsorship:create');

    if (typeof input.quantity !== 'number' || input.quantity <= 0 || isNaN(input.quantity)) {
      throw new Error('Validation Error: Sponsorship quantity must be a positive number greater than 0');
    }

    const listing = await prisma.surplusListing.findUnique({
      where: { id: input.surplusListingId },
      include: { foodItem: true, facility: true, donorOrganization: true },
    });

    if (!listing) {
      throw new Error(`Surplus listing with ID ${input.surplusListingId} was not found`);
    }

    if (listing.status !== 'PUBLISHED') {
      throw new Error(`Availability Error: Surplus listing is currently ${listing.status} and cannot be sponsored`);
    }

    if (new Date(listing.availableUntil).getTime() <= Date.now()) {
      throw new Error('Availability Error: This surplus listing has expired');
    }

    if (input.quantity > listing.availableQuantity) {
      throw new Error(
        `Quantity Error: Sponsorship quantity (${input.quantity} ${listing.unit}) exceeds available stock (${listing.availableQuantity} ${listing.unit})`
      );
    }

    const verificationPin = Math.floor(100000 + Math.random() * 900000).toString();

    const recovery = await prisma.$transaction(async (tx) => {
      const remainingQty = listing.availableQuantity - input.quantity;
      const listingStatus = remainingQty === 0 ? 'RESERVED' : listing.status;

      await tx.surplusListing.update({
        where: { id: listing.id },
        data: {
          availableQuantity: remainingQty,
          status: listingStatus,
        },
      });

      return tx.recoveryTransaction.create({
        data: {
          donorOrganizationId: listing.donorOrganizationId,
          facilityId: listing.facilityId,
          surplusListingId: listing.id,
          foodItemId: listing.foodItemId,
          batchId: listing.batchId,
          recipientUserId: context.user.id, // linked sponsor/recovery liaison
          recipientOrganizationId: null,
          sponsorUserId: context.user.id,
          sponsorNotes: input.sponsorNotes?.trim() || null,
          orderType: 'SPONSORED_MEAL',
          quantity: input.quantity,
          unit: listing.unit,
          status: 'READY_FOR_PICKUP',
          pickupAddress: listing.pickupAddress,
          pickupWindow: listing.pickupWindow,
          pickupLatitude: listing.pickupLatitude,
          pickupLongitude: listing.pickupLongitude,
          verificationPin,
          scheduledPickupTime: new Date(Date.now() + 7200000), // 2 hours
          notes: `Sponsored meal: ${input.quantity} ${listing.unit}`,
        },
        include: {
          donorOrganization: true,
          facility: true,
          surplusListing: true,
          foodItem: true,
          sponsorUser: true,
        },
      });
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'sponsorship.created',
      entity: 'RecoveryTransaction',
      entityId: recovery.id,
      newState: recovery,
      reason: 'User sponsored meal for recovery',
      context: { orderType: 'SPONSORED_MEAL', listingId: listing.id, quantity: input.quantity },
    });

    return recovery;
  },

  /**
   * Retrieves a single RecoveryTransaction with access control verification.
   */
  async getRecovery(id: string): Promise<RecoveryTransaction> {
    const context = await authorizationService.requireContext();

    const recovery = await prisma.recoveryTransaction.findUnique({
      where: { id },
      include: {
        donorOrganization: true,
        facility: true,
        surplusListing: true,
        foodItem: true,
        batch: true,
        recipientUser: true,
        recipientOrganization: true,
        sponsorUser: true,
      },
    });

    if (!recovery) {
      throw new Error(`Recovery transaction with ID ${id} was not found`);
    }

    // Access control check: user must be recipient, sponsor, or member of donor/recipient org, or admin
    const isAdmin = context.memberships.some(m => m.role === 'PLATFORM_ADMIN' && m.status === 'ACTIVE');
    const isDonor = context.memberships.some(m => m.organizationId === recovery.donorOrganizationId && m.status === 'ACTIVE');
    const isRecipientOrg = recovery.recipientOrganizationId
      ? context.memberships.some(m => m.organizationId === recovery.recipientOrganizationId && m.status === 'ACTIVE')
      : false;
    const isDirectParty = recovery.recipientUserId === context.user.id || recovery.sponsorUserId === context.user.id;

    if (!isAdmin && !isDonor && !isRecipientOrg && !isDirectParty) {
      throw new Error('Access Denied: You are not authorized to view this recovery transaction');
    }

    return recovery;
  },

  /**
   * Lists recoveries based on active role context.
   */
  async listRecoveries(
    filters?: RecoveryFilterOptions,
    explicitOrgId?: string | null
  ): Promise<RecoveryTransaction[]> {
    const context = await authorizationService.requireContext(explicitOrgId);

    const where: Record<string, any> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (context.activeOrganization) {
      // Organization view: donor or recipient
      const orgId = context.activeOrganization.id;
      if (context.activeOrganization.type === 'DONOR' || context.activeOrganization.type === 'RESTAURANT' || context.activeOrganization.type === 'HOTEL') {
        where.donorOrganizationId = orgId;
      } else {
        where.recipientOrganizationId = orgId;
      }
    } else {
      // Individual user view
      where.OR = [
        { recipientUserId: context.user.id },
        { sponsorUserId: context.user.id },
      ];
    }

    return prisma.recoveryTransaction.findMany({
      where,
      include: {
        donorOrganization: true,
        facility: true,
        surplusListing: true,
        foodItem: true,
        recipientUser: true,
        recipientOrganization: true,
        sponsorUser: true,
        deliveryRoute: {
          include: {
            vehicle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Confirms food pickup at the donor facility using the 6-digit verification PIN.
   */
  async confirmPickup(
    recoveryId: string,
    verificationPin: string,
    _explicitOrgId?: string | null
  ): Promise<RecoveryTransaction> {
    const { context } = await authorizationService.requireUserPermission('recovery:manage');

    const recovery = await prisma.recoveryTransaction.findUnique({
      where: { id: recoveryId },
      include: { surplusListing: true },
    });

    if (!recovery) {
      throw new Error(`Recovery transaction with ID ${recoveryId} was not found`);
    }

    // State validation
    if (recovery.status !== 'RESERVED' && recovery.status !== 'READY_FOR_PICKUP' && recovery.status !== 'PICKUP_ASSIGNED') {
      throw new Error(`Invalid State: Recovery is currently ${recovery.status} and pickup cannot be confirmed`);
    }

    // PIN Verification
    const inputPin = verificationPin.trim();
    if (recovery.verificationPin !== inputPin) {
      throw new Error('Verification Error: Invalid pickup verification PIN. Please check the code provided by recipient');
    }

    const updated = await prisma.recoveryTransaction.update({
      where: { id: recoveryId },
      data: {
        status: 'COLLECTED',
        collectedAt: new Date(),
      },
      include: {
        donorOrganization: true,
        facility: true,
        surplusListing: true,
        foodItem: true,
        recipientUser: true,
      },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'recovery.pickup_confirmed',
      entity: 'RecoveryTransaction',
      entityId: recoveryId,
      previousState: { status: recovery.status },
      newState: { status: 'COLLECTED', collectedAt: updated.collectedAt },
      reason: 'Handover verification PIN validated. Pickup confirmed.',
      context: { recoveryId },
    });

    return updated;
  },

  /**
   * Confirms delivery or handover to destination.
   */
  async confirmDeliveryOrHandover(
    recoveryId: string,
    notes?: string,
    _explicitOrgId?: string | null
  ): Promise<RecoveryTransaction> {
    const { context } = await authorizationService.requireUserPermission('recovery:manage');

    const recovery = await prisma.recoveryTransaction.findUnique({
      where: { id: recoveryId },
    });

    if (!recovery) {
      throw new Error(`Recovery transaction with ID ${recoveryId} was not found`);
    }

    if (recovery.status !== 'COLLECTED' && recovery.status !== 'PICKUP_ASSIGNED') {
      throw new Error(`Invalid State: Recovery must be in COLLECTED state to confirm delivery (currently ${recovery.status})`);
    }

    const updated = await prisma.recoveryTransaction.update({
      where: { id: recoveryId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        notes: notes ? `${recovery.notes ? recovery.notes + '\n' : ''}${notes.trim()}` : recovery.notes,
      },
      include: {
        donorOrganization: true,
        facility: true,
        surplusListing: true,
        foodItem: true,
        recipientUser: true,
      },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'recovery.delivery_confirmed',
      entity: 'RecoveryTransaction',
      entityId: recoveryId,
      previousState: { status: recovery.status },
      newState: { status: 'DELIVERED', deliveredAt: updated.deliveredAt },
      reason: notes || 'Food delivery / handover completed to recipient location',
      context: { recoveryId },
    });

    return updated;
  },

  /**
   * Finalizes the recovery transaction as COMPLETED.
   * Checks whether the parent surplus listing is fully recovered.
   */
  async completeRecovery(
    recoveryId: string,
    notes?: string,
    _explicitOrgId?: string | null
  ): Promise<RecoveryTransaction> {
    const { context } = await authorizationService.requireUserPermission('recovery:manage');

    const recovery = await prisma.recoveryTransaction.findUnique({
      where: { id: recoveryId },
      include: { surplusListing: true },
    });

    if (!recovery) {
      throw new Error(`Recovery transaction with ID ${recoveryId} was not found`);
    }

    if (recovery.status !== 'DELIVERED' && recovery.status !== 'COLLECTED') {
      throw new Error(`Invalid State: Recovery must be COLLECTED or DELIVERED to complete (currently ${recovery.status})`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const completedTx = await tx.recoveryTransaction.update({
        where: { id: recoveryId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          notes: notes ? `${recovery.notes ? recovery.notes + '\n' : ''}${notes.trim()}` : recovery.notes,
        },
        include: {
          donorOrganization: true,
          facility: true,
          surplusListing: true,
          foodItem: true,
          recipientUser: true,
          recipientOrganization: true,
          sponsorUser: true,
        },
      });

      // Check if parent surplus listing can be marked as RECOVERED
      if (recovery.surplusListingId) {
        const listing = await tx.surplusListing.findUnique({
          where: { id: recovery.surplusListingId },
          include: { recoveryOrders: true },
        });

        if (listing && listing.availableQuantity === 0) {
          const allOrdersCompleted = (listing.recoveryOrders || []).every(
            (o) => o.id === recoveryId || o.status === 'COMPLETED' || o.status === 'CANCELLED'
          );

          if (allOrdersCompleted) {
            await tx.surplusListing.update({
              where: { id: listing.id },
              data: { status: 'RECOVERED' },
            });
          }
        }
      }

      return completedTx;
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'recovery.completed',
      entity: 'RecoveryTransaction',
      entityId: recoveryId,
      previousState: { status: recovery.status },
      newState: { status: 'COMPLETED', completedAt: updated.completedAt },
      reason: notes || 'Food recovery verified and completed successfully',
      context: { recoveryId, quantity: updated.quantity, unit: updated.unit },
    });

    return updated;
  },

  /**
   * Cancels a reservation/recovery order and returns quantity back to surplus listing.
   */
  async cancelRecovery(
    recoveryId: string,
    reason: string,
    _explicitOrgId?: string | null
  ): Promise<RecoveryTransaction> {
    const { context } = await authorizationService.requireUserPermission('recovery:manage');

    const recovery = await prisma.recoveryTransaction.findUnique({
      where: { id: recoveryId },
      include: { surplusListing: true },
    });

    if (!recovery) {
      throw new Error(`Recovery transaction with ID ${recoveryId} was not found`);
    }

    if (recovery.status === 'COMPLETED') {
      throw new Error('Invalid Transition: Cannot cancel an already completed recovery transaction');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Restore quantity back to surplus listing if not already collected
      if (recovery.status === 'RESERVED' || recovery.status === 'READY_FOR_PICKUP' || recovery.status === 'PICKUP_ASSIGNED') {
        const listing = await tx.surplusListing.findUnique({ where: { id: recovery.surplusListingId } });
        if (listing) {
          const restoredQty = listing.availableQuantity + recovery.quantity;
          await tx.surplusListing.update({
            where: { id: listing.id },
            data: {
              availableQuantity: restoredQty,
              status: listing.status === 'RESERVED' ? 'PUBLISHED' : listing.status,
            },
          });
        }
      }

      return tx.recoveryTransaction.update({
        where: { id: recoveryId },
        data: {
          status: 'CANCELLED',
          notes: reason ? `${recovery.notes ? recovery.notes + '\n' : ''}Cancelled: ${reason}` : recovery.notes,
        },
        include: {
          donorOrganization: true,
          facility: true,
          surplusListing: true,
          foodItem: true,
        },
      });
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'recovery.cancelled',
      entity: 'RecoveryTransaction',
      entityId: recoveryId,
      previousState: { status: recovery.status },
      newState: { status: 'CANCELLED' },
      reason: reason || 'Recovery transaction cancelled',
      context: { recoveryId },
    });

    return updated;
  },
};
