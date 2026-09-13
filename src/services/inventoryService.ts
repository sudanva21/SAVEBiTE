// ==============================================
// SaveByte — Operational Inventory & Batch Service (Phase 3)
// ==============================================
//
// Manages food batches and ledger-style inventory transactions.
// Enforces:
// 1. Facility & FoodItem organization ownership verification
// 2. Strict non-negative inventory constraints
// 3. Expiry date validation (expiry must be after preparation)
// 4. Traceable append-only inventory transactions
// 5. Cross-organization isolation
//

import { prisma } from '@/lib/db';
import { authorizationService } from './authorizationService';
import { auditService } from './auditService';
import { FoodBatch, InventoryTransaction } from '@/generated/prisma';
import { CreateFoodBatchInput } from '@/types';

export const inventoryService = {
  /**
   * Creates a new production/preparation batch with an initial inventory transaction.
   */
  async createBatch(
    input: CreateFoodBatchInput,
    explicitOrgId?: string | null
  ): Promise<FoodBatch> {
    const { context, organization } = await authorizationService.requirePermission(
      'inventory:manage',
      explicitOrgId
    );

    // Quantity validation
    if (typeof input.initialQuantity !== 'number' || input.initialQuantity <= 0 || isNaN(input.initialQuantity)) {
      throw new Error('Validation Error: Batch initial quantity must be a positive number greater than 0');
    }

    // Facility verification & isolation
    const facility = await prisma.facility.findUnique({
      where: { id: input.facilityId },
    });
    if (!facility) {
      throw new Error(`Facility with ID ${input.facilityId} was not found`);
    }
    if (facility.organizationId !== organization.id) {
      throw new Error('Access Denied: The specified facility does not belong to your organization');
    }

    // Food item verification & isolation
    const foodItem = await prisma.foodItem.findUnique({
      where: { id: input.foodItemId },
    });
    if (!foodItem) {
      throw new Error(`Food item with ID ${input.foodItemId} was not found`);
    }
    if (foodItem.organizationId !== organization.id) {
      throw new Error('Access Denied: The specified food item does not belong to your organization');
    }

    // Expiry & preparation date validation
    const preparedAt = input.preparedAt ? new Date(input.preparedAt) : new Date();
    const expiresAt = new Date(input.expiresAt);

    if (isNaN(expiresAt.getTime())) {
      throw new Error('Validation Error: Invalid expiry date specified');
    }

    if (expiresAt.getTime() <= preparedAt.getTime()) {
      throw new Error('Validation Error: Expiry date and time must be strictly after the preparation time');
    }

    const batchNumber =
      input.batchNumber?.trim() ||
      `BATCH-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const unit = input.unit || foodItem.unit;

    // Transactional creation of batch and initial ledger entry
    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.foodBatch.create({
        data: {
          organizationId: organization.id,
          facilityId: facility.id,
          foodItemId: foodItem.id,
          batchNumber,
          initialQuantity: input.initialQuantity,
          currentQuantity: input.initialQuantity,
          unit,
          preparedAt,
          expiresAt,
          storageCondition: input.storageCondition || 'ROOM_TEMP',
          qualityStatus: input.qualityStatus || 'SUITABLE_FOR_HUMAN_RECOVERY',
          status: 'ACTIVE',
          notes: input.notes?.trim() || null,
        },
        include: {
          foodItem: true,
          facility: true,
        },
      });

      // Append ledger transaction
      await tx.inventoryTransaction.create({
        data: {
          organizationId: organization.id,
          facilityId: facility.id,
          batchId: createdBatch.id,
          foodItemId: foodItem.id,
          type: 'PRODUCED',
          quantity: input.initialQuantity,
          unit,
          referenceType: 'INITIAL_BATCH',
          referenceId: createdBatch.id,
          actorId: context.user.id,
          notes: `Batch produced: ${input.initialQuantity} ${unit}`,
        },
      });

      return createdBatch;
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'batch.created',
      entity: 'FoodBatch',
      entityId: batch.id,
      newState: batch,
      reason: 'Created food batch and recorded inventory',
      context: { organizationId: organization.id, facilityId: facility.id },
    });

    return batch;
  },

  /**
   * Adjusts batch inventory, recording an immutable inventory ledger transaction.
   * Strictly prevents negative inventory.
   */
  async adjustInventory(
    batchId: string,
    quantityDelta: number,
    reason: string,
    referenceType?: string,
    referenceId?: string,
    explicitOrgId?: string | null
  ): Promise<FoodBatch> {
    const { context, organization } = await authorizationService.requirePermission(
      'inventory:manage',
      explicitOrgId
    );

    if (typeof quantityDelta !== 'number' || isNaN(quantityDelta) || quantityDelta === 0) {
      throw new Error('Validation Error: Adjustment quantity cannot be zero or invalid');
    }

    const batch = await prisma.foodBatch.findUnique({
      where: { id: batchId },
      include: { foodItem: true },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${batchId} was not found`);
    }

    if (batch.organizationId !== organization.id) {
      throw new Error('Access Denied: You cannot adjust batches belonging to another organization');
    }

    const newQuantity = batch.currentQuantity + quantityDelta;

    if (newQuantity < 0) {
      throw new Error(
        `Inventory Constraint Violation: Cannot reduce quantity by ${Math.abs(quantityDelta)} ${batch.unit}. Current stock is only ${batch.currentQuantity} ${batch.unit}`
      );
    }

    const txType = quantityDelta > 0 ? 'ADJUSTED' : 'CONSUMED';
    const newStatus = newQuantity === 0 ? 'DEPLETED' : batch.status === 'DEPLETED' ? 'ACTIVE' : batch.status;

    const updatedBatch = await prisma.$transaction(async (tx) => {
      const updated = await tx.foodBatch.update({
        where: { id: batchId },
        data: {
          currentQuantity: newQuantity,
          status: newStatus,
        },
        include: {
          foodItem: true,
          facility: true,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          organizationId: organization.id,
          facilityId: batch.facilityId,
          batchId: batch.id,
          foodItemId: batch.foodItemId,
          type: txType,
          quantity: Math.abs(quantityDelta),
          unit: batch.unit,
          referenceType: referenceType || 'MANUAL_ADJUSTMENT',
          referenceId: referenceId || null,
          actorId: context.user.id,
          notes: reason || `Inventory adjusted by ${quantityDelta} ${batch.unit}`,
        },
      });

      return updated;
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'inventory.adjusted',
      entity: 'FoodBatch',
      entityId: batchId,
      previousState: { currentQuantity: batch.currentQuantity, status: batch.status },
      newState: { currentQuantity: updatedBatch.currentQuantity, status: updatedBatch.status },
      reason: reason || 'Inventory adjustment',
      context: { organizationId: organization.id, quantityDelta },
    });

    return updatedBatch;
  },

  /**
   * Retrieves a single batch verifying organization isolation.
   */
  async getBatch(
    id: string,
    explicitOrgId?: string | null
  ): Promise<FoodBatch> {
    const { organization } = await authorizationService.requirePermission(
      'inventory:view',
      explicitOrgId
    );

    const batch = await prisma.foodBatch.findUnique({
      where: { id },
      include: {
        foodItem: true,
        facility: true,
        inventoryTransactions: { orderBy: { createdAt: 'desc' } },
        surplusListings: true,
      },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${id} was not found`);
    }

    if (batch.organizationId !== organization.id) {
      throw new Error('Access Denied: You cannot view batches belonging to another organization');
    }

    return batch;
  },

  /**
   * Lists batches for the active organization with optional filters.
   */
  async listBatches(
    filters?: { facilityId?: string; foodItemId?: string; status?: string },
    explicitOrgId?: string | null
  ): Promise<FoodBatch[]> {
    const { organization } = await authorizationService.requirePermission(
      'inventory:view',
      explicitOrgId
    );

    const where: Record<string, any> = {
      organizationId: organization.id,
    };

    if (filters?.facilityId) {
      where.facilityId = filters.facilityId;
    }
    if (filters?.foodItemId) {
      where.foodItemId = filters.foodItemId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.foodBatch.findMany({
      where,
      include: {
        foodItem: true,
        facility: true,
        surplusListings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Retrieves the inventory transaction history for a batch or organization.
   */
  async listTransactions(
    batchId?: string,
    explicitOrgId?: string | null
  ): Promise<InventoryTransaction[]> {
    const { organization } = await authorizationService.requirePermission(
      'inventory:view',
      explicitOrgId
    );

    const where: Record<string, any> = {
      organizationId: organization.id,
    };

    if (batchId) {
      const batch = await prisma.foodBatch.findUnique({ where: { id: batchId } });
      if (!batch || batch.organizationId !== organization.id) {
        throw new Error('Access Denied: Cannot access inventory transactions for an external batch');
      }
      where.batchId = batchId;
    }

    return prisma.inventoryTransaction.findMany({
      where,
      include: {
        foodItem: true,
        facility: true,
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
