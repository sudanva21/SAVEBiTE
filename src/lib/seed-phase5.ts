// ==============================================
// SaveByte — Phase 5 AI Intelligence Demo Seed Data
// ==============================================
//
// Populates 14 days of realistic multi-shift operational data for:
// The Grand Taj Kitchen (org_taj)
//
// Establishes:
// 1. 14 historical operating days of production (430-500 kg) & recorded demand (415-450 kg)
// 2. Active food batches spanning all 5 urgency tiers:
//    - CRITICAL: 32 kg Cooked Rice & Dal (expires in 1h 40m)
//    - URGENT: 20 kg Mixed Vegetables (expires in 3h 15m)
//    - WATCH: 15 kg Fresh Bread & Roti (expires in 8h)
//    - SAFE: 50 kg Paneer Butter Masala (expires in 28h)
//    - EXPIRED: 10 kg Dairy Curd (expired 2 hours ago)
// 3. Historical surplus listings and completed recoveries showing ~68% recovery rate
// 4. Grounded foundation for SIH AI Demonstration
//

import { prisma } from './db';

export async function seedPhase5AIIntelligenceData() {
  console.log('--- Starting SaveByte Phase 5 AI Intelligence Seeding ---');

  // 1. Ensure The Grand Taj Kitchen organization exists
  let donorOrg = await prisma.organization.findFirst({
    where: { slug: 'the-grand-taj-kitchen' },
  });

  if (!donorOrg) {
    donorOrg = await prisma.organization.create({
      data: {
        id: 'org_taj',
        name: 'The Grand Taj Kitchen',
        slug: 'the-grand-taj-kitchen',
        type: 'HOTEL',
        description: 'Luxury hotel & banquet kitchen producing high-volume fresh meals',
        isVerified: true,
      },
    });
  }

  // 2. Ensure Primary Facility
  let facility = await prisma.facility.findFirst({
    where: { organizationId: donorOrg.id },
  });

  if (!facility) {
    facility = await prisma.facility.create({
      data: {
        id: 'fac_taj_central',
        organizationId: donorOrg.id,
        name: 'Central Banquet Kitchen',
        type: 'KITCHEN',
        address: 'Taj West End, Race Course Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        latitude: 12.983,
        longitude: 77.584,
        isPrimary: true,
      },
    });
  }

  // Ensure user usr_ngo_relief exists for recovery transactions
  let recipientUser = await prisma.user.findUnique({ where: { id: 'usr_ngo_relief' } });
  if (!recipientUser) {
    await prisma.user.create({
      data: {
        id: 'usr_ngo_relief',
        clerkUserId: 'clerk_usr_ngo_relief',
        displayName: 'Sister Ananya Relief Hub',
        email: 'ananya@ngorelief.org',
        isOnboarded: true,
      },
    });
  }

  // 3. Ensure Food Catalog Items
  const foodItems = [
    { id: 'item_rice_dal', name: 'Basmati Rice & Dal', category: 'PREPARED_MEALS', unit: 'meals' },
    { id: 'item_vegetables', name: 'Mixed Vegetable Sabzi', category: 'VEGETABLES', unit: 'kg' },
    { id: 'item_bread', name: 'Fresh Roti & Naan', category: 'BAKERY', unit: 'portions' },
    { id: 'item_paneer', name: 'Paneer Butter Masala', category: 'PREPARED_MEALS', unit: 'meals' },
    { id: 'item_dairy', name: 'Fresh Farm Curd', category: 'DAIRY', unit: 'kg' },
  ];

  for (const fi of foodItems) {
    const existing = await prisma.foodItem.findUnique({ where: { id: fi.id } });
    if (!existing) {
      await prisma.foodItem.create({
        data: {
          id: fi.id,
          organizationId: donorOrg.id,
          name: fi.name,
          category: fi.category,
          unit: fi.unit,
          storageRequirement: fi.category === 'DAIRY' ? 'REFRIGERATED' : 'AMBIENT',
          isActive: true,
        },
      });
    }
  }

  // 4. Seed 14 Days of Historical Production & Consumption Transactions
  // Example data pattern from requirements:
  // Production: 450, 470, 430, 500, 490, 460, 480, 440, 465, 435, 495, 480, 455, 475
  // Demand:     420, 440, 415, 435, 450, 425, 430, 410, 435, 415, 445, 430, 425, 435
  const historicalProd = [450, 470, 430, 500, 490, 460, 480, 440, 465, 435, 495, 480, 455, 475];
  const historicalDemand = [420, 440, 415, 435, 450, 425, 430, 410, 435, 415, 445, 430, 425, 435];

  const now = new Date();

  for (let i = 0; i < 14; i++) {
    const daysAgo = 14 - i;
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    date.setHours(8, 0, 0, 0);

    const prodQty = historicalProd[i];
    const demandQty = historicalDemand[i];
    const surplusQty = Math.max(0, prodQty - demandQty);
    const recoveredQty = Math.round(surplusQty * 0.7);
    const wastedQty = surplusQty - recoveredQty;

    // Create Historical Batch
    const batchId = `batch_hist_${i + 1}`;
    const existingBatch = await prisma.foodBatch.findUnique({ where: { id: batchId } });
    if (!existingBatch) {
      await prisma.foodBatch.create({
        data: {
          id: batchId,
          organizationId: donorOrg.id,
          facilityId: facility.id,
          foodItemId: 'item_rice_dal',
          batchNumber: `HIST-${100 + i}`,
          initialQuantity: prodQty,
          currentQuantity: 0,
          unit: 'meals',
          preparedAt: date,
          expiresAt: new Date(date.getTime() + 12 * 60 * 60 * 1000),
          storageCondition: 'ROOM_TEMP',
          qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
          status: 'DEPLETED',
          createdAt: date,
        },
      });

      // Production Ledger Entry
      await prisma.inventoryTransaction.create({
        data: {
          organizationId: donorOrg.id,
          facilityId: facility.id,
          batchId,
          foodItemId: 'item_rice_dal',
          type: 'PRODUCED',
          quantity: prodQty,
          unit: 'meals',
          createdAt: date,
        },
      });

      // Consumption Ledger Entry
      const consumeDate = new Date(date.getTime() + 5 * 60 * 60 * 1000);
      await prisma.inventoryTransaction.create({
        data: {
          organizationId: donorOrg.id,
          facilityId: facility.id,
          batchId,
          foodItemId: 'item_rice_dal',
          type: 'CONSUMED',
          quantity: demandQty,
          unit: 'meals',
          createdAt: consumeDate,
        },
      });

      // Surplus Listing (if surplus generated)
      if (surplusQty > 0) {
        const surplusDate = new Date(date.getTime() + 6 * 60 * 60 * 1000);
        const listingId = `surplus_hist_${i + 1}`;
        await prisma.surplusListing.create({
          data: {
            id: listingId,
            donorOrganizationId: donorOrg.id,
            facilityId: facility.id,
            foodItemId: 'item_rice_dal',
            batchId,
            title: `Surplus Banquet Meals #${i + 1}`,
            totalQuantity: surplusQty,
            allocatedQuantity: recoveredQty,
            availableQuantity: 0,
            unit: 'meals',
            status: 'COMPLETED',
            qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
            eligibleRecipientType: 'ALL',
            availableFrom: surplusDate,
            availableUntil: new Date(surplusDate.getTime() + 4 * 60 * 60 * 1000),
            pickupAddress: facility.address,
            createdAt: surplusDate,
          },
        });

        // Completed Recovery Transaction
        if (recoveredQty > 0) {
          await prisma.recoveryTransaction.create({
            data: {
              id: `rec_hist_${i + 1}`,
              donorOrganizationId: donorOrg.id,
              facilityId: facility.id,
              surplusListingId: listingId,
              foodItemId: 'item_rice_dal',
              batchId,
              recipientUserId: 'usr_ngo_relief',
              orderType: 'NGO_CLAIM',
              quantity: recoveredQty,
              unit: 'meals',
              status: 'COMPLETED',
              pickupAddress: facility.address,
              verificationPin: '123456',
              collectedAt: new Date(surplusDate.getTime() + 2 * 60 * 60 * 1000),
              deliveredAt: new Date(surplusDate.getTime() + 3 * 60 * 60 * 1000),
              completedAt: new Date(surplusDate.getTime() + 3 * 60 * 60 * 1000),
              createdAt: surplusDate,
            },
          });
        }

        // Recorded Waste Ledger Entry (if any went unrecovered)
        if (wastedQty > 0) {
          await prisma.inventoryTransaction.create({
            data: {
              organizationId: donorOrg.id,
              facilityId: facility.id,
              batchId,
              foodItemId: 'item_rice_dal',
              type: 'DISPOSED',
              quantity: wastedQty,
              unit: 'meals',
              notes: 'Unclaimed surplus after pickup window expired',
              createdAt: new Date(surplusDate.getTime() + 5 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
  }

  // 5. Seed Active Batches Across All 5 Urgency Tiers
  // Batch 1: CRITICAL (expires in 1h 40m = 100 minutes)
  const criticalExpiresAt = new Date(now.getTime() + 100 * 60 * 1000);
  const criticalBatchId = 'batch_taj_critical_01';
  let criticalBatch = await prisma.foodBatch.findUnique({ where: { id: criticalBatchId } });
  if (!criticalBatch) {
    criticalBatch = await prisma.foodBatch.create({
      data: {
        id: criticalBatchId,
        organizationId: donorOrg.id,
        facilityId: facility.id,
        foodItemId: 'item_rice_dal',
        batchNumber: 'BATCH-TAJ-CRITICAL-01',
        initialQuantity: 50,
        currentQuantity: 32,
        unit: 'meals',
        preparedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        expiresAt: criticalExpiresAt,
        storageCondition: 'HEATED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        status: 'ACTIVE',
        notes: '32 meals cooked basmati rice & yellow dal; urgent pickup required',
      },
    });

    // Post to surplus listing
    await prisma.surplusListing.create({
      data: {
        id: 'surplus_taj_critical_01',
        donorOrganizationId: donorOrg.id,
        facilityId: facility.id,
        foodItemId: 'item_rice_dal',
        batchId: criticalBatchId,
        title: '32 meals Cooked Basmati Rice & Dal',
        totalQuantity: 32,
        allocatedQuantity: 0,
        availableQuantity: 32,
        unit: 'meals',
        status: 'PUBLISHED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        eligibleRecipientType: 'ALL',
        availableFrom: now,
        availableUntil: criticalExpiresAt,
        pickupAddress: facility.address,
      },
    });
  }

  // Batch 2: URGENT (expires in 3 hours 15 mins = 195 minutes)
  const urgentExpiresAt = new Date(now.getTime() + 195 * 60 * 1000);
  const urgentBatchId = 'batch_taj_urgent_02';
  let urgentBatch = await prisma.foodBatch.findUnique({ where: { id: urgentBatchId } });
  if (!urgentBatch) {
    urgentBatch = await prisma.foodBatch.create({
      data: {
        id: urgentBatchId,
        organizationId: donorOrg.id,
        facilityId: facility.id,
        foodItemId: 'item_vegetables',
        batchNumber: 'BATCH-TAJ-URGENT-02',
        initialQuantity: 25,
        currentQuantity: 20,
        unit: 'kg',
        preparedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        expiresAt: urgentExpiresAt,
        storageCondition: 'HEATED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        status: 'ACTIVE',
        notes: '20 kg mixed seasonal vegetable sabzi',
      },
    });

    await prisma.surplusListing.create({
      data: {
        id: 'surplus_taj_urgent_02',
        donorOrganizationId: donorOrg.id,
        facilityId: facility.id,
        foodItemId: 'item_vegetables',
        batchId: urgentBatchId,
        title: '20 kg Mixed Vegetable Sabzi',
        totalQuantity: 20,
        allocatedQuantity: 0,
        availableQuantity: 20,
        unit: 'kg',
        status: 'PUBLISHED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        eligibleRecipientType: 'ALL',
        availableFrom: now,
        availableUntil: urgentExpiresAt,
        pickupAddress: facility.address,
      },
    });
  }

  // Batch 3: WATCH (expires in 8 hours)
  const watchExpiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const watchBatchId = 'batch_taj_watch_03';
  if (!await prisma.foodBatch.findUnique({ where: { id: watchBatchId } })) {
    await prisma.foodBatch.create({
      data: {
        id: watchBatchId,
        organizationId: donorOrg.id,
        facilityId: facility.id,
        foodItemId: 'item_bread',
        batchNumber: 'BATCH-TAJ-WATCH-03',
        initialQuantity: 30,
        currentQuantity: 15,
        unit: 'portions',
        preparedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        expiresAt: watchExpiresAt,
        storageCondition: 'ROOM_TEMP',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        status: 'ACTIVE',
        notes: '15 portions fresh baked roti and dinner rolls',
      },
    });

    await prisma.surplusListing.create({
      data: {
        id: 'surplus_taj_watch_03',
        donorOrganizationId: donorOrg.id,
        facilityId: facility.id,
        foodItemId: 'item_bread',
        batchId: watchBatchId,
        title: '15 portions Fresh Bread & Roti',
        totalQuantity: 15,
        allocatedQuantity: 0,
        availableQuantity: 15,
        unit: 'portions',
        status: 'PUBLISHED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        eligibleRecipientType: 'ALL',
        availableFrom: now,
        availableUntil: watchExpiresAt,
        pickupAddress: facility.address,
      },
    });
  }

  // Batch 4: SAFE (expires in 28 hours)
  const safeExpiresAt = new Date(now.getTime() + 28 * 60 * 60 * 1000);
  const safeBatchId = 'batch_taj_safe_04';
  if (!await prisma.foodBatch.findUnique({ where: { id: safeBatchId } })) {
    await prisma.foodBatch.create({
      data: {
        id: safeBatchId,
        organizationId: donorOrg.id,
        facilityId: facility.id,
        foodItemId: 'item_paneer',
        batchNumber: 'BATCH-TAJ-SAFE-04',
        initialQuantity: 50,
        currentQuantity: 50,
        unit: 'meals',
        preparedAt: now,
        expiresAt: safeExpiresAt,
        storageCondition: 'HEATED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        status: 'ACTIVE',
        notes: '50 meals Paneer Butter Masala (freshly cooked)',
      },
    });
  }

  // Batch 5: EXPIRED (expired 2 hours ago)
  const expiredAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const expiredBatchId = 'batch_taj_expired_05';
  if (!await prisma.foodBatch.findUnique({ where: { id: expiredBatchId } })) {
    await prisma.foodBatch.create({
      data: {
        id: expiredBatchId,
        organizationId: donorOrg.id,
        facilityId: facility.id,
        foodItemId: 'item_dairy',
        batchNumber: 'BATCH-TAJ-EXPIRED-05',
        initialQuantity: 10,
        currentQuantity: 10,
        unit: 'kg',
        preparedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
        expiresAt: expiredAt,
        storageCondition: 'COLD_STORAGE',
        qualityStatus: 'NOT_SUITABLE_FOR_HUMAN_CONSUMPTION',
        status: 'EXPIRED',
        notes: '10 kg dairy curd past freshness window (for composting)',
      },
    });
  }

  console.log('✓ Phase 5 AI Intelligence Operational Foundation Seeded Successfully');
  console.log('  - 14 Days Historical Production & Demand Series');
  console.log('  - 5 Operational Batches (Critical, Urgent, Watch, Safe, Expired)');
  console.log('  - Grounded Surplus & Recovery Records');
}
