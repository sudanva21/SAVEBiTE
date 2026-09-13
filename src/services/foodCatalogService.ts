// ==============================================
// SaveByte — Food Catalog Service (Phase 3)
// ==============================================
//
// Manages the reusable food items produced or handled by organizations.
// Enforces strict tenant isolation: an organization can only view and modify
// its own food catalog items.
//

import { prisma } from '@/lib/db';
import { authorizationService } from './authorizationService';
import { auditService } from './auditService';
import { FoodItem } from '@/generated/prisma';
import { CreateFoodItemInput } from '@/types';

export const foodCatalogService = {
  /**
   * Creates a new FoodItem in the catalog for the active organization.
   */
  async createFoodItem(
    input: CreateFoodItemInput,
    explicitOrgId?: string | null
  ): Promise<FoodItem> {
    const { context, organization } = await authorizationService.requirePermission(
      'food:create',
      explicitOrgId
    );

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Validation Error: Food item name is required');
    }

    if (!input.unit || input.unit.trim().length === 0) {
      throw new Error('Validation Error: Unit of measurement is required');
    }

    const item = await prisma.foodItem.create({
      data: {
        organizationId: organization.id,
        name: input.name.trim(),
        category: input.category || 'OTHER',
        description: input.description?.trim() || null,
        unit: input.unit.trim().toLowerCase(),
        storageRequirement: input.storageRequirement || 'AMBIENT',
        dietaryFlags: input.dietaryFlags || null,
        isActive: true,
      },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'food.created',
      entity: 'FoodItem',
      entityId: item.id,
      newState: item,
      reason: 'Created catalog food item',
      context: { organizationId: organization.id },
    });

    return item;
  },

  /**
   * Retrieves a single FoodItem ensuring it belongs to the caller's organization.
   */
  async getFoodItem(
    id: string,
    explicitOrgId?: string | null
  ): Promise<FoodItem> {
    const { organization } = await authorizationService.requirePermission(
      'food:view',
      explicitOrgId
    );

    const item = await prisma.foodItem.findUnique({
      where: { id },
      include: { batches: true },
    });

    if (!item) {
      throw new Error(`Food item with ID ${id} was not found`);
    }

    // Tenant isolation check
    if (item.organizationId !== organization.id) {
      throw new Error('Access Denied: You cannot view food items belonging to another organization');
    }

    return item;
  },

  /**
   * Lists all food items belonging to the caller's organization.
   */
  async listFoodItems(
    filters?: { category?: string; isActive?: boolean },
    explicitOrgId?: string | null
  ): Promise<FoodItem[]> {
    const { organization } = await authorizationService.requirePermission(
      'food:view',
      explicitOrgId
    );

    const where: Record<string, any> = {
      organizationId: organization.id,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.foodItem.findMany({
      where,
      include: { batches: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Updates an existing food catalog item with tenant verification.
   */
  async updateFoodItem(
    id: string,
    data: Partial<CreateFoodItemInput & { isActive: boolean }>,
    explicitOrgId?: string | null
  ): Promise<FoodItem> {
    const { context, organization } = await authorizationService.requirePermission(
      'food:edit',
      explicitOrgId
    );

    const existing = await prisma.foodItem.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Food item with ID ${id} was not found`);
    }

    if (existing.organizationId !== organization.id) {
      throw new Error('Access Denied: You cannot modify food items belonging to another organization');
    }

    const updated = await prisma.foodItem.update({
      where: { id },
      data: {
        name: data.name?.trim() ?? existing.name,
        category: data.category ?? existing.category,
        description: data.description !== undefined ? data.description?.trim() || null : existing.description,
        unit: data.unit?.trim().toLowerCase() ?? existing.unit,
        storageRequirement: data.storageRequirement ?? existing.storageRequirement,
        dietaryFlags: data.dietaryFlags !== undefined ? data.dietaryFlags : existing.dietaryFlags,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'food.updated',
      entity: 'FoodItem',
      entityId: id,
      previousState: existing,
      newState: updated,
      reason: 'Updated catalog food item',
      context: { organizationId: organization.id },
    });

    return updated;
  },

  /**
   * Soft-deletes or deactivates a food item.
   */
  async deleteFoodItem(
    id: string,
    explicitOrgId?: string | null
  ): Promise<FoodItem> {
    const { context, organization } = await authorizationService.requirePermission(
      'food:delete',
      explicitOrgId
    );

    const existing = await prisma.foodItem.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Food item with ID ${id} was not found`);
    }

    if (existing.organizationId !== organization.id) {
      throw new Error('Access Denied: You cannot delete food items belonging to another organization');
    }

    const deleted = await prisma.foodItem.update({
      where: { id },
      data: { isActive: false },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'food.deleted',
      entity: 'FoodItem',
      entityId: id,
      previousState: existing,
      newState: deleted,
      reason: 'Deactivated catalog food item',
      context: { organizationId: organization.id },
    });

    return deleted;
  },
};
