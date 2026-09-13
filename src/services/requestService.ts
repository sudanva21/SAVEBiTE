// ==============================================
// SaveByte — Food Request & Allocation Service (Phase 3)
// ==============================================
//
// Manages food recovery requests from NGOs and individual consumers,
// and the donor acceptance/allocation workflow.
//
// Invariants enforced:
// 1. Only eligible recipients can claim a surplus listing.
// 2. Request quantity must be positive.
// 3. Expired or unlisted food cannot be requested.
// 4. Accepting a request atomically allocates quantity and generates a RecoveryTransaction with a verification PIN.
// 5. Allocation cannot exceed remaining available surplus quantity (prevents oversubscription).
// 6. Cross-organization IDOR is blocked (only donor can accept/reject requests on their surplus).
//

import { prisma } from '@/lib/db';
import { authorizationService } from './authorizationService';
import { auditService } from './auditService';
import { FoodRequest, RecoveryTransaction } from '@/generated/prisma';
import { CreateFoodRequestInput } from '@/types';

export const requestService = {
  /**
   * Creates a food request from an NGO organization or an individual user.
   */
  async createRequest(
    input: CreateFoodRequestInput,
    explicitOrgId?: string | null
  ): Promise<FoodRequest> {
    const context = await authorizationService.requireContext(explicitOrgId);

    // Quantity validation
    if (typeof input.requestedQuantity !== 'number' || input.requestedQuantity <= 0 || isNaN(input.requestedQuantity)) {
      throw new Error('Validation Error: Requested quantity must be a positive number greater than 0');
    }

    let requesterOrgId: string | null = null;
    let isNgo = false;

    // Check if requester is acting within an active organization (NGO context)
    if (context.activeOrganization && context.activeMembership) {
      if (context.activeMembership.status !== 'ACTIVE') {
        throw new Error(`Access Denied: Your membership is ${context.activeMembership.status}`);
      }
      authorizationService.can(context.activeMembership, 'request:create');
      requesterOrgId = context.activeOrganization.id;
      isNgo = true;
    } else {
      // Individual user mode
      const activeMem = context.activeMembership || context.memberships.find(m => m.status === 'ACTIVE');
      if (!activeMem || !authorizationService.can(activeMem, 'request:create')) {
        throw new Error('Access Denied: You do not have permission to create food requests');
      }
    }

    let foodCategory = input.foodCategory || 'OTHER';
    let unit = input.unit || 'kg';

    // If requesting a specific surplus listing, validate it exists and is available
    if (input.surplusListingId) {
      const listing = await prisma.surplusListing.findUnique({
        where: { id: input.surplusListingId },
        include: { foodItem: true },
      });

      if (!listing) {
        throw new Error(`Surplus listing with ID ${input.surplusListingId} was not found`);
      }

      if (listing.status !== 'PUBLISHED') {
        throw new Error(`Availability Error: Surplus listing is currently ${listing.status} and cannot be requested`);
      }

      if (new Date(listing.availableUntil).getTime() <= Date.now()) {
        throw new Error('Availability Error: This surplus listing has expired and cannot be requested');
      }

      if (listing.availableQuantity <= 0) {
        throw new Error('Availability Error: This surplus listing is completely depleted');
      }

      if (input.requestedQuantity > listing.availableQuantity) {
        throw new Error(
          `Allocation Error: Requested quantity (${input.requestedQuantity} ${listing.unit}) exceeds remaining available surplus (${listing.availableQuantity} ${listing.unit})`
        );
      }

      // Check recipient eligibility
      if (listing.eligibleRecipientType === 'NGO_ONLY' && !isNgo) {
        throw new Error('Eligibility Error: This food listing is reserved exclusively for registered NGOs');
      }

      if (listing.eligibleRecipientType === 'INDIVIDUAL_ONLY' && isNgo) {
        throw new Error('Eligibility Error: This food listing is reserved exclusively for individual consumers');
      }

      foodCategory = listing.foodItem?.category || foodCategory;
      unit = listing.unit || unit;
    }

    const request = await prisma.foodRequest.create({
      data: {
        requesterUserId: context.user.id,
        requesterOrganizationId: requesterOrgId,
        surplusListingId: input.surplusListingId || null,
        foodCategory,
        requestedQuantity: input.requestedQuantity,
        unit,
        status: 'PENDING',
        intendedUse: input.intendedUse?.trim() || null,
        beneficiaryCount: input.beneficiaryCount || null,
        urgency: input.urgency || 'STANDARD',
        requiredByDate: input.requiredByDate ? new Date(input.requiredByDate) : null,
        deliveryLocation: input.deliveryLocation?.trim() || null,
        notes: input.notes?.trim() || null,
      },
      include: {
        requesterUser: true,
        requesterOrganization: true,
        surplusListing: { include: { foodItem: true, facility: true } },
      },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'request.created',
      entity: 'FoodRequest',
      entityId: request.id,
      newState: request,
      reason: 'Created food recovery request',
      context: { requesterOrgId, surplusListingId: input.surplusListingId, quantity: input.requestedQuantity },
    });

    return request;
  },

  /**
   * Lists requests received by the caller's donor organization across all its posted surplus.
   */
  async listRequestsForDonor(
    explicitOrgId?: string | null
  ): Promise<FoodRequest[]> {
    const { organization } = await authorizationService.requirePermission(
      'request:view',
      explicitOrgId
    );

    // Fetch all listings for this donor
    const myListings = await prisma.surplusListing.findMany({
      where: { donorOrganizationId: organization.id },
    });

    const listingIds = myListings.map(l => l.id);
    if (listingIds.length === 0) {
      return [];
    }

    return prisma.foodRequest.findMany({
      where: {
        surplusListingId: { in: listingIds },
      },
      include: {
        requesterUser: true,
        requesterOrganization: true,
        surplusListing: { include: { foodItem: true, facility: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Lists requests submitted by the caller (or caller's organization).
   */
  async listRequestsForRequester(
    explicitOrgId?: string | null
  ): Promise<FoodRequest[]> {
    const context = await authorizationService.requireContext(explicitOrgId);

    const where: Record<string, any> = {};
    if (context.activeOrganization) {
      where.requesterOrganizationId = context.activeOrganization.id;
    } else {
      where.requesterUserId = context.user.id;
      where.requesterOrganizationId = null;
    }

    return prisma.foodRequest.findMany({
      where,
      include: {
        surplusListing: { include: { foodItem: true, facility: true, donorOrganization: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Accepts a food request, allocating surplus inventory and creating a RecoveryTransaction.
   */
  async acceptRequest(
    requestId: string,
    allocatedQuantity?: number,
    explicitOrgId?: string | null
  ): Promise<{ request: FoodRequest; recovery: RecoveryTransaction }> {
    const { context, organization } = await authorizationService.requirePermission(
      'request:accept',
      explicitOrgId
    );

    const request = await prisma.foodRequest.findUnique({
      where: { id: requestId },
      include: { surplusListing: { include: { foodItem: true, facility: true } } },
    });

    if (!request) {
      throw new Error(`Food request with ID ${requestId} was not found`);
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Invalid Request State: Request is currently ${request.status} and cannot be accepted`);
    }

    if (!request.surplusListingId || !request.surplusListing) {
      throw new Error('Fulfillment Error: Request is not linked to a specific surplus listing');
    }

    const listing = request.surplusListing;

    // Tenant isolation: Donor must own the surplus listing
    if (listing.donorOrganizationId !== organization.id) {
      throw new Error('Access Denied: You cannot accept requests for another organization\'s surplus food');
    }

    const quantityToAllocate = allocatedQuantity !== undefined ? allocatedQuantity : request.requestedQuantity;
    if (quantityToAllocate <= 0 || isNaN(quantityToAllocate)) {
      throw new Error('Validation Error: Allocated quantity must be greater than 0');
    }

    if (quantityToAllocate > listing.availableQuantity) {
      throw new Error(
        `Allocation Error: Cannot allocate ${quantityToAllocate} ${listing.unit}. Only ${listing.availableQuantity} ${listing.unit} remains available.`
      );
    }

    // Generate secure 6-character numeric verification PIN
    const verificationPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Transactional allocation and recovery creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement available surplus
      const remainingListingQty = listing.availableQuantity - quantityToAllocate;
      const listingStatus = remainingListingQty === 0 ? 'RESERVED' : listing.status;

      await tx.surplusListing.update({
        where: { id: listing.id },
        data: {
          availableQuantity: remainingListingQty,
          status: listingStatus,
        },
      });

      // 2. Mark request as ACCEPTED
      const updatedRequest = await tx.foodRequest.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' },
        include: {
          requesterUser: true,
          requesterOrganization: true,
          surplusListing: true,
        },
      });

      // 3. Create Recovery Transaction
      const recovery = await tx.recoveryTransaction.create({
        data: {
          donorOrganizationId: organization.id,
          facilityId: listing.facilityId,
          surplusListingId: listing.id,
          foodItemId: listing.foodItemId,
          batchId: listing.batchId,
          foodRequestId: request.id,
          recipientUserId: request.requesterUserId,
          recipientOrganizationId: request.requesterOrganizationId,
          orderType: request.requesterOrganizationId ? 'NGO_CLAIM' : 'BUY_FOR_ME',
          quantity: quantityToAllocate,
          unit: listing.unit,
          status: 'RESERVED',
          pickupAddress: listing.pickupAddress,
          pickupWindow: listing.pickupWindow,
          pickupLatitude: listing.pickupLatitude,
          pickupLongitude: listing.pickupLongitude,
          verificationPin,
          scheduledPickupTime: new Date(Date.now() + 7200000), // default +2 hours
          notes: `Request accepted by donor ${organization.name}`,
        },
        include: {
          donorOrganization: true,
          facility: true,
          surplusListing: true,
          foodItem: true,
          recipientUser: true,
          recipientOrganization: true,
        },
      });

      return { request: updatedRequest, recovery };
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'request.accepted',
      entity: 'FoodRequest',
      entityId: requestId,
      previousState: { status: 'PENDING' },
      newState: { status: 'ACCEPTED', recoveryId: result.recovery.id, allocatedQuantity: quantityToAllocate },
      reason: 'Donor accepted food request',
      context: { donorOrgId: organization.id, requestId, recoveryId: result.recovery.id },
    });

    return result;
  },

  /**
   * Rejects a food request with an optional reason.
   */
  async rejectRequest(
    requestId: string,
    reason: string,
    explicitOrgId?: string | null
  ): Promise<FoodRequest> {
    const { context, organization } = await authorizationService.requirePermission(
      'request:accept',
      explicitOrgId
    );

    const request = await prisma.foodRequest.findUnique({
      where: { id: requestId },
      include: { surplusListing: true },
    });

    if (!request) {
      throw new Error(`Food request with ID ${requestId} was not found`);
    }

    if (request.surplusListing?.donorOrganizationId !== organization.id) {
      throw new Error('Access Denied: You cannot reject requests for another organization\'s surplus food');
    }

    const updated = await prisma.foodRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', notes: reason?.trim() || 'Request rejected by donor' },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'request.rejected',
      entity: 'FoodRequest',
      entityId: requestId,
      previousState: { status: request.status },
      newState: { status: 'REJECTED' },
      reason: reason || 'Donor rejected request',
      context: { donorOrgId: organization.id },
    });

    return updated;
  },

  /**
   * Cancels a food request by the requester.
   */
  async cancelRequest(requestId: string): Promise<FoodRequest> {
    const context = await authorizationService.requireContext();

    const request = await prisma.foodRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Food request with ID ${requestId} was not found`);
    }

    // Must be the requester
    if (request.requesterUserId !== context.user.id) {
      throw new Error('Access Denied: You cannot cancel a request submitted by another user');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Invalid Request State: Cannot cancel request in ${request.status} status`);
    }

    const updated = await prisma.foodRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'request.cancelled',
      entity: 'FoodRequest',
      entityId: requestId,
      previousState: { status: request.status },
      newState: { status: 'CANCELLED' },
      reason: 'Requester cancelled request',
      context: { userId: context.user.id },
    });

    return updated;
  },
};
