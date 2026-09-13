// ==============================================
// SaveByte — Phase 3 Demo & Seed Data Script
// ==============================================
//
// Implements the canonical 13-step demonstration scenario:
// 1. Approved Industry: The Grand Taj Kitchen (org_grand_taj)
// 2. Production Batch: 100 kg Prepared Basmati Rice & Dal Meals
// 3. Surplus Identification: 30 kg identified as surplus
// 4. Surplus Posting: 30 kg posted with pickup window
// 5. Approved NGO: Annapoorna Food Relief (org_annapoorna)
// 6. Food Request: NGO requests 20 kg
// 7. Donor Acceptance: Grand Taj accepts request
// 8. Allocation & Pin: 20 kg reserved, remaining surplus 10 kg
// 9. Individual User: Aarav Patel (usr_aarav_patel)
// 10. Buy for Me: 5 kg reserved
// 11. Sponsor a Meal: 5 kg sponsored for community shelter
// 12. Handover & PIN: Handover verified using 6-digit PIN
// 13. Completion: All 30 kg recovered, audit trail recorded
//

import { prisma } from './db';
import { auditService } from '../services/auditService';

export async function seedPhase3OperationalData() {
  console.log('--- Starting SaveByte Phase 3 Operational Ecosystem Seeding ---');

  // 1. Ensure Industry Organization exists
  let industryOrg = await prisma.organization.findFirst({
    where: { slug: 'the-grand-taj-kitchen' },
  });

  if (!industryOrg) {
    industryOrg = await prisma.organization.create({
      data: {
        id: 'org_grand_taj',
        name: 'The Grand Taj Kitchen',
        slug: 'the-grand-taj-kitchen',
        type: 'HOTEL',
        description: 'Luxury hotel & banquet operational kitchen with daily fresh food service.',
        email: 'kitchen@grandtaj.com',
        phone: '+91 98765 43210',
        isVerified: true,
      },
    });
  }

  // Ensure Industry Facility exists
  let industryFacility = await prisma.facility.findFirst({
    where: { organizationId: industryOrg.id },
  });

  if (!industryFacility) {
    industryFacility = await prisma.facility.create({
      data: {
        id: 'fac_taj_main',
        organizationId: industryOrg.id,
        name: 'Central Banquet Kitchen',
        type: 'KITCHEN',
        address: 'Taj Palace Complex, M.G. Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        latitude: 12.9716,
        longitude: 77.5946,
        operatingStatus: 'ACTIVE',
        isPrimary: true,
      },
    });
  }

  // Ensure Industry Chef / Donor Manager User
  let donorUser = await prisma.user.findFirst({
    where: { OR: [{ id: 'usr_chef_ramesh' }, { clerkUserId: 'clerk_chef_ramesh' }] },
  });

  if (!donorUser) {
    donorUser = await prisma.user.create({
      data: {
        id: 'usr_chef_ramesh',
        clerkUserId: 'clerk_chef_ramesh',
        displayName: 'Chef Ramesh Kumar',
        email: 'ramesh@grandtaj.com',
        isOnboarded: true,
      },
    });

    await prisma.membership.create({
      data: {
        userId: donorUser.id,
        organizationId: industryOrg.id,
        role: 'DONOR_MANAGER',
        status: 'ACTIVE',
      },
    });
  }

  // 2. Ensure Food Catalog Item exists
  let foodItem = await prisma.foodItem.findFirst({
    where: { organizationId: industryOrg.id, name: 'Prepared Basmati Rice & Dal' },
  });

  if (!foodItem) {
    foodItem = await prisma.foodItem.create({
      data: {
        id: 'food_rice_dal',
        organizationId: industryOrg.id,
        name: 'Prepared Basmati Rice & Dal',
        category: 'PREPARED_MEALS',
        description: 'Nutritious hot cooked Basmati rice with yellow lentil dal and mild cumin seasoning.',
        unit: 'kg',
        storageRequirement: 'WARM',
        dietaryFlags: 'VEG, JAIN',
        isActive: true,
      },
    });
  }

  // 3. Ensure Production Batch exists: 100 kg
  let batch = await prisma.foodBatch.findFirst({
    where: { foodItemId: foodItem.id },
  });

  if (!batch) {
    batch = await prisma.foodBatch.create({
      data: {
        id: 'batch_taj_rice_100',
        organizationId: industryOrg.id,
        facilityId: industryFacility.id,
        foodItemId: foodItem.id,
        batchNumber: 'BATCH-TAJ-2026-001',
        initialQuantity: 100,
        currentQuantity: 70, // 30 kg allocated to surplus
        unit: 'kg',
        preparedAt: new Date(Date.now() - 3600000), // 1 hour ago
        expiresAt: new Date(Date.now() + 28800000), // 8 hours in future
        storageCondition: 'HEATED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        status: 'ACTIVE',
        notes: 'Morning banquet service preparation surplus',
      },
    });

    // Record initial production ledger
    await prisma.inventoryTransaction.create({
      data: {
        organizationId: industryOrg.id,
        facilityId: industryFacility.id,
        batchId: batch.id,
        foodItemId: foodItem.id,
        type: 'PRODUCED',
        quantity: 100,
        unit: 'kg',
        referenceType: 'PRODUCTION',
        actorId: donorUser.id,
        notes: 'Initial banquet batch produced: 100 kg',
      },
    });

    // Record surplus allocation ledger
    await prisma.inventoryTransaction.create({
      data: {
        organizationId: industryOrg.id,
        facilityId: industryFacility.id,
        batchId: batch.id,
        foodItemId: foodItem.id,
        type: 'SURPLUS_ALLOCATED',
        quantity: 30,
        unit: 'kg',
        referenceType: 'SURPLUS_POSTING',
        actorId: donorUser.id,
        notes: 'Allocated 30 kg to surplus recovery listing',
      },
    });
  }

  // 4. Ensure Surplus Listing exists: 30 kg posted
  let surplusListing = await prisma.surplusListing.findFirst({
    where: { batchId: batch.id },
  });

  if (!surplusListing) {
    surplusListing = await prisma.surplusListing.create({
      data: {
        id: 'surp_taj_rice_30',
        donorOrganizationId: industryOrg.id,
        facilityId: industryFacility.id,
        foodItemId: foodItem.id,
        batchId: batch.id,
        title: '30 kg Fresh Basmati Rice & Dal Meals',
        description: 'Hot banquet meals packaged in food-grade thermal containers. Ready for immediate pickup.',
        totalQuantity: 30,
        availableQuantity: 0, // 20 kg claimed by NGO + 5 kg Buy for Me + 5 kg Sponsor = 0 remaining
        unit: 'kg',
        status: 'RECOVERED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        eligibleRecipientType: 'ALL',
        availableFrom: new Date(Date.now() - 3600000),
        availableUntil: new Date(Date.now() + 21600000), // 6 hours
        pickupAddress: 'Taj Palace Complex Dock #2, M.G. Road',
        pickupCity: 'Bangalore',
        pickupWindow: '13:00 - 16:30',
        storageCondition: 'HEATED',
        isFreeDonation: true,
        pricePerUnit: 0,
      },
    });
  }

  // 5. Ensure NGO Organization exists ("Annapoorna Relief Trust")
  let ngoOrg = await prisma.organization.findFirst({
    where: { slug: 'annapoorna-food-relief' },
  });

  if (!ngoOrg) {
    ngoOrg = await prisma.organization.create({
      data: {
        id: 'org_annapoorna',
        name: 'Annapoorna Food Relief Trust',
        slug: 'annapoorna-food-relief',
        type: 'NGO',
        description: 'Registered NGO serving hot meals to vulnerable communities and children shelters.',
        email: 'relief@annapoorna.org',
        phone: '+91 98450 12345',
        isVerified: true,
      },
    });
  }

  // NGO Coordinator User
  let ngoUser = await prisma.user.findFirst({
    where: { OR: [{ id: 'usr_priya_ngo' }, { clerkUserId: 'clerk_ngo_priya' }] },
  });

  if (!ngoUser) {
    ngoUser = await prisma.user.create({
      data: {
        id: 'usr_priya_ngo',
        clerkUserId: 'clerk_ngo_priya',
        displayName: 'Priya Sharma (NGO Lead)',
        email: 'priya@annapoorna.org',
        isOnboarded: true,
      },
    });

    await prisma.membership.create({
      data: {
        userId: ngoUser.id,
        organizationId: ngoOrg.id,
        role: 'NGO_COORDINATOR',
        status: 'ACTIVE',
      },
    });
  }

  // 6 & 7. Ensure NGO Request exists and is ACCEPTED (20 kg)
  const ngoRequest = await prisma.foodRequest.upsert({
    where: { id: 'req_annapoorna_20kg' },
    update: {
      requesterUserId: ngoUser.id,
      requesterOrganizationId: ngoOrg.id,
      surplusListingId: surplusListing.id,
      foodCategory: 'PREPARED_MEALS',
      requestedQuantity: 20,
      unit: 'kg',
      status: 'ACCEPTED',
      intendedUse: 'Direct distribution at Shanti Children Shelter',
      beneficiaryCount: 85,
      urgency: 'HIGH',
      notes: 'Recovery van dispatched with thermal crates',
    },
    create: {
      id: 'req_annapoorna_20kg',
      requesterUserId: ngoUser.id,
      requesterOrganizationId: ngoOrg.id,
      surplusListingId: surplusListing.id,
      foodCategory: 'PREPARED_MEALS',
      requestedQuantity: 20,
      unit: 'kg',
      status: 'ACCEPTED',
      intendedUse: 'Direct distribution at Shanti Children Shelter',
      beneficiaryCount: 85,
      urgency: 'HIGH',
      notes: 'Recovery van dispatched with thermal crates',
    },
  });

  // 8 & 11. Ensure NGO Recovery Transaction exists (20 kg, COMPLETED with PIN)
  const ngoRecovery = await prisma.recoveryTransaction.upsert({
    where: { id: 'rec_annapoorna_20kg' },
    update: {
      foodRequestId: ngoRequest.id,
      surplusListingId: surplusListing.id,
      status: 'COMPLETED',
    },
    create: {
      id: 'rec_annapoorna_20kg',
      donorOrganizationId: industryOrg.id,
      facilityId: industryFacility.id,
      surplusListingId: surplusListing.id,
      foodItemId: foodItem.id,
      batchId: batch.id,
      foodRequestId: ngoRequest.id,
      recipientUserId: ngoUser.id,
      recipientOrganizationId: ngoOrg.id,
      orderType: 'NGO_CLAIM',
      quantity: 20,
      unit: 'kg',
      status: 'COMPLETED',
      pickupAddress: surplusListing.pickupAddress,
      pickupWindow: surplusListing.pickupWindow,
      verificationPin: '482910',
      collectedAt: new Date(Date.now() - 1800000), // 30m ago
      deliveredAt: new Date(Date.now() - 600000), // 10m ago
      completedAt: new Date(),
      notes: 'Handover verified via PIN 482910. 20 kg delivered to Shanti Children Shelter.',
    },
  });

  // 9. Ensure Individual User exists ("Aarav Patel")
  let individualUser = await prisma.user.findFirst({
    where: { OR: [{ id: 'usr_aarav_patel' }, { clerkUserId: 'clerk_aarav_patel' }, { clerkUserId: 'user_aarav_individual' }] },
  });

  if (!individualUser) {
    individualUser = await prisma.user.create({
      data: {
        id: 'usr_aarav_patel',
        clerkUserId: 'clerk_aarav_patel',
        displayName: 'Aarav Patel',
        email: 'aarav.patel@gmail.com',
        isOnboarded: true,
      },
    });

    await prisma.membership.create({
      data: {
        userId: individualUser.id,
        organizationId: null,
        role: 'INDIVIDUAL_USER',
        status: 'ACTIVE',
      },
    });
  }

  // 10. Buy for Me Transaction (5 kg, COMPLETED)
  const buyForMeTx = await prisma.recoveryTransaction.upsert({
    where: { id: 'rec_aarav_buy_5kg' },
    update: {
      surplusListingId: surplusListing.id,
      status: 'COMPLETED',
    },
    create: {
      id: 'rec_aarav_buy_5kg',
      donorOrganizationId: industryOrg.id,
      facilityId: industryFacility.id,
      surplusListingId: surplusListing.id,
      foodItemId: foodItem.id,
      batchId: batch.id,
      recipientUserId: individualUser.id,
      recipientOrganizationId: null,
      orderType: 'BUY_FOR_ME',
      quantity: 5,
      unit: 'kg',
      status: 'COMPLETED',
      pickupAddress: surplusListing.pickupAddress,
      pickupWindow: surplusListing.pickupWindow,
      verificationPin: '739104',
      collectedAt: new Date(Date.now() - 1200000),
      deliveredAt: new Date(Date.now() - 300000),
      completedAt: new Date(),
      notes: 'Personal meal rescue via Buy for Me',
    },
  });

  // 11. Sponsor a Meal Transaction (5 kg, COMPLETED)
  const sponsorTx = await prisma.recoveryTransaction.upsert({
    where: { id: 'rec_aarav_sponsor_5kg' },
    update: {
      surplusListingId: surplusListing.id,
      status: 'COMPLETED',
    },
    create: {
      id: 'rec_aarav_sponsor_5kg',
      donorOrganizationId: industryOrg.id,
      facilityId: industryFacility.id,
      surplusListingId: surplusListing.id,
      foodItemId: foodItem.id,
      batchId: batch.id,
      recipientUserId: individualUser.id,
      recipientOrganizationId: null,
      sponsorUserId: individualUser.id,
      sponsorNotes: 'Sponsoring 5 kg of hot meals for the evening street distribution',
      orderType: 'SPONSORED_MEAL',
      quantity: 5,
      unit: 'kg',
      status: 'COMPLETED',
      pickupAddress: surplusListing.pickupAddress,
      pickupWindow: surplusListing.pickupWindow,
      verificationPin: '915283',
      collectedAt: new Date(Date.now() - 900000),
      deliveredAt: new Date(Date.now() - 100000),
      completedAt: new Date(),
      notes: 'Community sponsored meal dispatch completed successfully.',
    },
  });

  // 12 & 13. Audit logs for the complete lifecycle
  await auditService.log({
    actorId: donorUser.id,
    action: 'demo.scenario_executed',
    entity: 'SurplusListing',
    entityId: surplusListing.id,
    newState: {
      step: '1-13_COMPLETE',
      totalSurplus: 30,
      ngoClaimed: 20,
      buyForMe: 5,
      sponsored: 5,
      status: 'RECOVERED',
    },
    reason: 'Phase 3 demonstration vertical slice seeded successfully',
  });

  console.log('✓ Phase 3 Operational Ecosystem Seeded Successfully:');
  console.log(`  - Donor Kitchen: ${industryOrg.name} (${industryFacility.name})`);
  console.log(`  - Food Batch: 100 kg ${foodItem.name} (${batch.batchNumber})`);
  console.log(`  - Surplus Listing: 30 kg (${surplusListing.id})`);
  console.log(`  - NGO Claim: 20 kg by ${ngoOrg.name} (PIN: 482910) -> COMPLETED`);
  console.log(`  - Buy for Me: 5 kg by ${individualUser.displayName} (PIN: 739104) -> COMPLETED`);
  console.log(`  - Sponsor a Meal: 5 kg by ${individualUser.displayName} (PIN: 915283) -> COMPLETED`);
  console.log(`  - Total Surplus Recovered: 30 / 30 kg (100% Zero Food Waste)`);

  return {
    industryOrg,
    industryFacility,
    donorUser,
    ngoOrg,
    ngoUser,
    individualUser,
    foodItem,
    batch,
    surplusListing,
    ngoRequest,
    ngoRecovery,
    buyForMeTx,
    sponsorTx,
  };
}

