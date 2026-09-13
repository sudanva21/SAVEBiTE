// ==============================================
// SaveByte — Surplus Food Management & Discovery Service (Phase 3)
// ==============================================
//
// Manages surplus food postings from donors, inventory deduction,
// and public discovery for NGOs and individual consumers.
//
// Invariants enforced:
// 1. Surplus cannot exceed available batch quantity.
// 2. Allocating surplus decrements batch inventory atomically.
// 3. Cancelling surplus returns unreserved quantity back to batch.
// 4. Discovery filters out expired, depleted, or recipient-ineligible listings.
// 5. Cross-organization donor management is strictly blocked.
//

import { prisma } from '@/lib/db';
import { authorizationService } from './authorizationService';
import { auditService } from './auditService';
import { SurplusListing } from '@/generated/prisma';
import { CreateSurplusListingInput, SurplusFilterOptions } from '@/types';

export const surplusService = {
  /**
   * Posts surplus food for an approved donor organization.
   * Atomically decrements batch operational inventory to prevent double-counting.
   */
  async createSurplusListing(
    input: CreateSurplusListingInput,
    explicitOrgId?: string | null
  ): Promise<SurplusListing> {
    const { context, organization } = await authorizationService.requirePermission(
      'surplus:publish',
      explicitOrgId
    );

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Validation Error: Listing title is required');
    }

    if (typeof input.quantity !== 'number' || input.quantity <= 0 || isNaN(input.quantity)) {
      throw new Error('Validation Error: Surplus quantity must be a positive number greater than 0');
    }

    const availableUntil = new Date(input.availableUntil);
    if (isNaN(availableUntil.getTime()) || availableUntil.getTime() <= Date.now()) {
      throw new Error('Validation Error: Available-until time must be in the future');
    }

    // Verify batch and organization tenant isolation
    const batch = await prisma.foodBatch.findUnique({
      where: { id: input.batchId },
      include: { foodItem: true, facility: true },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${input.batchId} was not found`);
    }

    if (batch.organizationId !== organization.id) {
      throw new Error('Access Denied: You cannot post surplus from a batch belonging to another organization');
    }

    // Surplus quantity cannot exceed available batch stock
    if (input.quantity > batch.currentQuantity) {
      throw new Error(
        `Quantity Error: Cannot post surplus of ${input.quantity} ${batch.unit}. Batch currently has only ${batch.currentQuantity} ${batch.unit} in stock`
      );
    }

    // Verify facility matches batch facility
    const facilityId = input.facilityId || batch.facilityId;
    if (facilityId !== batch.facilityId) {
      throw new Error('Validation Error: Specified facility does not match batch location');
    }

    const pickupAddress = input.pickupAddress?.trim() || batch.facility?.address || 'Donor Facility';
    const pickupCity = input.pickupCity?.trim() || batch.facility?.city || null;
    const unit = input.unit || batch.unit;

    // Transactional allocation
    const listing = await prisma.$transaction(async (tx) => {
      // 1. Decrement current batch quantity
      const remainingBatchQty = batch.currentQuantity - input.quantity;
      await tx.foodBatch.update({
        where: { id: batch.id },
        data: {
          currentQuantity: remainingBatchQty,
          status: remainingBatchQty === 0 ? 'SURPLUS_POSTED' : batch.status,
        },
      });

      // 2. Append ledger transaction
      await tx.inventoryTransaction.create({
        data: {
          organizationId: organization.id,
          facilityId: batch.facilityId,
          batchId: batch.id,
          foodItemId: batch.foodItemId,
          type: 'SURPLUS_ALLOCATED',
          quantity: input.quantity,
          unit,
          referenceType: 'SURPLUS_POSTING',
          actorId: context.user.id,
          notes: `Allocated to surplus listing: ${input.title.trim()}`,
        },
      });

      // 3. Create surplus listing
      const newListing = await tx.surplusListing.create({
        data: {
          donorOrganizationId: organization.id,
          facilityId: batch.facilityId,
          foodItemId: batch.foodItemId,
          batchId: batch.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          totalQuantity: input.quantity,
          availableQuantity: input.quantity,
          unit,
          status: 'PUBLISHED',
          qualityStatus: input.qualityStatus || batch.qualityStatus || 'SUITABLE_FOR_HUMAN_RECOVERY',
          eligibleRecipientType: input.eligibleRecipientType || 'ALL',
          availableFrom: input.availableFrom ? new Date(input.availableFrom) : new Date(),
          availableUntil,
          pickupAddress,
          pickupCity,
          pickupWindow: input.pickupWindow?.trim() || 'Standard Hours (10:00 - 18:00)',
          storageCondition: input.storageCondition || batch.storageCondition || 'AMBIENT',
          isFreeDonation: input.isFreeDonation !== undefined ? input.isFreeDonation : true,
          pricePerUnit: input.pricePerUnit || 0,
        },
        include: {
          foodItem: true,
          facility: true,
          donorOrganization: true,
        },
      });

      return newListing;
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'surplus.published',
      entity: 'SurplusListing',
      entityId: listing.id,
      newState: listing,
      reason: 'Published surplus food listing',
      context: { organizationId: organization.id, batchId: batch.id, quantity: input.quantity },
    });

    return listing;
  },

  /**
   * Discovers available surplus food for NGOs or individual users.
   * Enforces status, quantity, expiry, and recipient eligibility filters.
   */
  async discoverSurplus(
    filters: SurplusFilterOptions = {},
    callerType: 'NGO' | 'INDIVIDUAL' | 'ALL' = 'ALL'
  ): Promise<{ listings: SurplusListing[]; total: number }> {
    const now = new Date();
    const where: Record<string, any> = {
      status: 'PUBLISHED',
      availableQuantity: { gt: 0 },
      availableUntil: { gte: now },
    };

    // Recipient eligibility
    if (callerType === 'NGO') {
      where.eligibleRecipientType = { in: ['ALL', 'NGO_ONLY'] };
    } else if (callerType === 'INDIVIDUAL') {
      where.eligibleRecipientType = { in: ['ALL', 'INDIVIDUAL_ONLY'] };
    }

    if (filters.qualityStatus) {
      where.qualityStatus = filters.qualityStatus;
    } else {
      // Default to human recovery suitable
      where.qualityStatus = 'SUITABLE_FOR_HUMAN_RECOVERY';
    }

    if (filters.city) {
      where.pickupCity = { contains: filters.city };
    }

    const allListings = await prisma.surplusListing.findMany({
      where,
      include: {
        foodItem: true,
        facility: true,
        donorOrganization: true,
        batch: true,
      },
      orderBy: { availableUntil: 'asc' }, // urgency first
    });

    // Filter by food category if requested
    let filtered = allListings;
    if (filters.category) {
      filtered = filtered.filter(l => l.foodItem?.category === filters.category);
    }
    if (filters.minQuantity) {
      filtered = filtered.filter(l => l.availableQuantity >= (filters.minQuantity || 0));
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const paged = filtered.slice(skip, skip + limit);

    return {
      listings: paged,
      total: filtered.length,
    };
  },

  /**
   * Retrieves a single surplus listing by ID.
   */
  async getSurplusListing(id: string): Promise<SurplusListing> {
    const listing = await prisma.surplusListing.findUnique({
      where: { id },
      include: {
        foodItem: true,
        facility: true,
        donorOrganization: true,
        batch: true,
        requests: { include: { requesterUser: true, requesterOrganization: true } },
      },
    });

    if (!listing) {
      throw new Error(`Surplus listing with ID ${id} was not found`);
    }

    return listing;
  },

  /**
   * Lists surplus postings belonging to the active donor organization.
   */
  async listMySurplus(
    filters?: { status?: string },
    explicitOrgId?: string | null
  ): Promise<SurplusListing[]> {
    const { organization } = await authorizationService.requirePermission(
      'surplus:publish',
      explicitOrgId
    );

    const where: Record<string, any> = {
      donorOrganizationId: organization.id,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.surplusListing.findMany({
      where,
      include: {
        foodItem: true,
        facility: true,
        batch: true,
        requests: true,
        recoveryOrders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Updates status of a surplus listing (e.g., cancel, archive).
   * If cancelled, remaining unallocated quantity is restored back to the batch.
   */
  async updateSurplusStatus(
    id: string,
    newStatus: string,
    reason?: string,
    explicitOrgId?: string | null
  ): Promise<SurplusListing> {
    const { context, organization } = await authorizationService.requirePermission(
      'surplus:publish',
      explicitOrgId
    );

    const listing = await prisma.surplusListing.findUnique({
      where: { id },
      include: { batch: true },
    });

    if (!listing) {
      throw new Error(`Surplus listing with ID ${id} was not found`);
    }

    if (listing.donorOrganizationId !== organization.id) {
      throw new Error('Access Denied: You cannot modify a surplus listing belonging to another organization');
    }

    if (listing.status === 'RECOVERED' && newStatus === 'CANCELLED') {
      throw new Error('Invalid Transition: Cannot cancel a listing that has already been recovered');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If cancelling, restore availableQuantity back to batch
      if (newStatus === 'CANCELLED' && listing.availableQuantity > 0 && listing.batchId) {
        const batch = await tx.foodBatch.findUnique({ where: { id: listing.batchId } });
        if (batch) {
          const restoredQty = batch.currentQuantity + listing.availableQuantity;
          await tx.foodBatch.update({
            where: { id: batch.id },
            data: { currentQuantity: restoredQty, status: 'ACTIVE' },
          });

          await tx.inventoryTransaction.create({
            data: {
              organizationId: organization.id,
              facilityId: listing.facilityId,
              batchId: batch.id,
              foodItemId: listing.foodItemId,
              type: 'ADJUSTED',
              quantity: listing.availableQuantity,
              unit: listing.unit,
              referenceType: 'SURPLUS_CANCELLATION',
              referenceId: listing.id,
              actorId: context.user.id,
              notes: `Surplus cancelled. Restored ${listing.availableQuantity} ${listing.unit} to batch.`,
            },
          });
        }
      }

      const updatedListing = await tx.surplusListing.update({
        where: { id },
        data: {
          status: newStatus,
          availableQuantity: newStatus === 'CANCELLED' ? 0 : listing.availableQuantity,
        },
        include: {
          foodItem: true,
          facility: true,
          donorOrganization: true,
          batch: true,
        },
      });

      return updatedListing;
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'surplus.status_updated',
      entity: 'SurplusListing',
      entityId: id,
      previousState: { status: listing.status, availableQuantity: listing.availableQuantity },
      newState: { status: updated.status, availableQuantity: updated.availableQuantity },
      reason: reason || `Updated surplus status to ${newStatus}`,
      context: { organizationId: organization.id },
    });

    return updated;
  },
};
