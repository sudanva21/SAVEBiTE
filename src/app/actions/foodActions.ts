'use server';

// ==============================================
// SaveByte — Food & Inventory Server Actions (Phase 3)
// ==============================================

import { revalidatePath } from 'next/cache';
import { foodCatalogService } from '@/services/foodCatalogService';
import { inventoryService } from '@/services/inventoryService';

/**
 * Creates a new food catalog item.
 */
export async function createFoodItemAction(formData: FormData) {
  const name = formData.get('name') as string;
  const category = (formData.get('category') as string) || 'OTHER';
  const description = (formData.get('description') as string) || '';
  const unit = (formData.get('unit') as string) || 'kg';
  const storageRequirement = (formData.get('storageRequirement') as string) || 'AMBIENT';
  const dietaryFlags = (formData.get('dietaryFlags') as string) || '';

  const item = await foodCatalogService.createFoodItem({
    name,
    category,
    description,
    unit,
    storageRequirement,
    dietaryFlags,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/inventory');
  return { success: true, item };
}

/**
 * Creates a new batch of food and records initial inventory.
 */
export async function createFoodBatchAction(formData: FormData) {
  const facilityId = formData.get('facilityId') as string;
  const foodItemId = formData.get('foodItemId') as string;
  const batchNumber = formData.get('batchNumber') as string;
  const initialQuantity = parseFloat(formData.get('initialQuantity') as string);
  const unit = formData.get('unit') as string;
  const preparedAt = (formData.get('preparedAt') as string) || new Date().toISOString();
  const expiresAt = formData.get('expiresAt') as string;
  const storageCondition = (formData.get('storageCondition') as string) || 'ROOM_TEMP';
  const qualityStatus = (formData.get('qualityStatus') as string) || 'SUITABLE_FOR_HUMAN_RECOVERY';
  const notes = formData.get('notes') as string;

  const batch = await inventoryService.createBatch({
    facilityId,
    foodItemId,
    batchNumber,
    initialQuantity,
    unit,
    preparedAt,
    expiresAt,
    storageCondition,
    qualityStatus,
    notes,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/inventory');
  return { success: true, batch };
}

/**
 * Adjusts inventory for an existing batch.
 */
export async function adjustInventoryAction(formData: FormData) {
  const batchId = formData.get('batchId') as string;
  const quantityDelta = parseFloat(formData.get('quantityDelta') as string);
  const reason = (formData.get('reason') as string) || 'Operational stock adjustment';

  const updatedBatch = await inventoryService.adjustInventory(batchId, quantityDelta, reason);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/inventory');
  return { success: true, batch: updatedBatch };
}

/**
 * Lists food catalog items for caller's organization.
 */
export async function listFoodItemsAction() {
  const items = await foodCatalogService.listFoodItems();
  return { success: true, items };
}

/**
 * Lists food production batches for caller's organization.
 */
export async function listBatchesAction(filters?: { facilityId?: string; foodItemId?: string; status?: string }) {
  const batches = await inventoryService.listBatches(filters);
  return { success: true, batches };
}

