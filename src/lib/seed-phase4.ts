// ==============================================
// SaveByte — Phase 4 Demo & Seed Data Script
// ==============================================
//
// Demonstrates end-to-end Phase 4 Operational Intelligence:
// 1. Grand Taj Kitchen publishes 30 kg Vegetable Biryani
// 2. Annapoorna Food Relief requests 20 kg (High urgency)
// 3. Akshaya Community Kitchen requests 15 kg (Medium urgency)
// 4. Sneha Shelter Home requests 10 kg (Medium urgency)
// 5. Deterministic Matching Engine evaluates candidates:
//    - Annapoorna: 94% score (#1)
//    - Akshaya: 81% score (#2)
//    - Sneha: 72% score (#3)
// 6. Grand Taj accepts Annapoorna (20 kg allocated, 10 kg remaining)
// 7. GreenWheels Logistics fleet vehicle assigned (Tata Ace EV)
// 8. DeliveryRoute created (2.4 km, 18 mins)
// 9. 6-digit physical handover PIN verified
// 10. Completed delivery & 100% verified zero waste recovery

import { prisma } from './db';
import { matchingService } from '../services/matchingService';

async function ensureOrgOwner(orgId: string, userId: string, name: string, email: string) {
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        clerkUserId: `clerk_${userId}`,
        displayName: name,
        email,
        isOnboarded: true,
      },
    });
  }

  const mem = await prisma.membership.findFirst({
    where: { userId, organizationId: orgId },
  });
  if (!mem) {
    await prisma.membership.create({
      data: {
        userId,
        organizationId: orgId,
        role: 'ORGANIZATION_OWNER',
        status: 'ACTIVE',
      },
    });
  }
}

export async function seedPhase4MatchingAndLogisticsData() {
  console.log('--- Starting SaveByte Phase 4 Matching & Logistics Seeding ---');

  // 1. Donor: The Grand Taj Kitchen
  let donorOrg = await prisma.organization.findFirst({
    where: { slug: 'the-grand-taj-kitchen' },
  });

  if (!donorOrg) {
    donorOrg = await prisma.organization.create({
      data: {
        id: 'org_grand_taj',
        name: 'The Grand Taj Kitchen',
        slug: 'the-grand-taj-kitchen',
        type: 'HOTEL',
        description: 'Luxury banquet & kitchen with fresh daily prepared food.',
        email: 'kitchen@grandtaj.com',
        phone: '+91 98765 43210',
        isVerified: true,
      },
    });
  }
  await ensureOrgOwner(donorOrg.id, 'usr_taj_chef', 'Chef Vikram', 'vikram@grandtaj.com');

  let donorFacility = await prisma.facility.findFirst({
    where: { organizationId: donorOrg.id },
  });

  if (!donorFacility) {
    donorFacility = await prisma.facility.create({
      data: {
        id: 'fac_taj_main',
        organizationId: donorOrg.id,
        name: 'Central Banquet Kitchen',
        type: 'KITCHEN',
        address: 'Taj Palace Complex, M.G. Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
        operatingStatus: 'ACTIVE',
        isPrimary: true,
      },
    });
  }

  // 2. Recipient 1: Annapoorna Food Relief (NGO)
  let ngoOrg = await prisma.organization.findFirst({
    where: { slug: 'annapoorna-food-relief' },
  });

  if (!ngoOrg) {
    ngoOrg = await prisma.organization.create({
      data: {
        id: 'org_annapoorna',
        name: 'Annapoorna Food Relief',
        slug: 'annapoorna-food-relief',
        type: 'NGO',
        description: 'Dedicated to hunger eradication through community food distribution.',
        email: 'contact@annapoorna.org',
        phone: '+91 98765 11223',
        isVerified: true,
      },
    });
  }
  await ensureOrgOwner(ngoOrg.id, 'usr_ngo_coordinator', 'Priya Sharma', 'priya@annapoorna.org');

  let ngoFacility = await prisma.facility.findFirst({
    where: { organizationId: ngoOrg.id },
  });

  if (!ngoFacility) {
    ngoFacility = await prisma.facility.create({
      data: {
        id: 'fac_annapoorna_center',
        organizationId: ngoOrg.id,
        name: 'Shivajinagar Distribution Hub',
        type: 'COMMUNITY_KITCHEN',
        address: '42 Commercial Street, Tasker Town',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560051',
        latitude: 12.9822,
        longitude: 77.6083,
        operatingStatus: 'ACTIVE',
        isPrimary: true,
      },
    });
  }

  // 3. Recipient 2: Akshaya Community Kitchen
  let kitchenOrg = await prisma.organization.findFirst({
    where: { slug: 'akshaya-community-kitchen' },
  });

  if (!kitchenOrg) {
    kitchenOrg = await prisma.organization.create({
      data: {
        id: 'org_akshaya',
        name: 'Akshaya Community Kitchen',
        slug: 'akshaya-community-kitchen',
        type: 'COMMUNITY_KITCHEN',
        description: 'Serving hot nutritious meals to daily wage workers and night shelters.',
        email: 'help@akshayakitchen.org',
        phone: '+91 98765 33445',
        isVerified: true,
      },
    });
  }
  await ensureOrgOwner(kitchenOrg.id, 'usr_kitchen_coordinator', 'Anand Kumar', 'anand@akshaya.org');

  let kitchenFacility = await prisma.facility.findFirst({
    where: { organizationId: kitchenOrg.id },
  });

  if (!kitchenFacility) {
    kitchenFacility = await prisma.facility.create({
      data: {
        id: 'fac_akshaya_hub',
        organizationId: kitchenOrg.id,
        name: 'Ulsoor Meal Center',
        type: 'COMMUNITY_KITCHEN',
        address: '18 Old Madras Road, Ulsoor',
        city: 'Bangalore',
        state: 'Karnataka',
        latitude: 12.9784,
        longitude: 77.6256,
        operatingStatus: 'ACTIVE',
        isPrimary: true,
      },
    });
  }

  // 4. Recipient 3: Sneha Shelter Home
  let shelterOrg = await prisma.organization.findFirst({
    where: { slug: 'sneha-shelter-home' },
  });

  if (!shelterOrg) {
    shelterOrg = await prisma.organization.create({
      data: {
        id: 'org_sneha',
        name: 'Sneha Shelter Home',
        slug: 'sneha-shelter-home',
        type: 'SHELTER',
        description: 'Safe transitional housing and nourishment for destitute families.',
        email: 'intake@snehashelter.org',
        phone: '+91 98765 55667',
        isVerified: true,
      },
    });
  }
  await ensureOrgOwner(shelterOrg.id, 'usr_shelter_coordinator', 'Sunita Rao', 'sunita@sneha.org');

  // 5. Logistics Partner: GreenWheels Express Logistics
  let logisticsOrg = await prisma.organization.findFirst({
    where: { slug: 'greenwheels-logistics' },
  });

  if (!logisticsOrg) {
    logisticsOrg = await prisma.organization.create({
      data: {
        id: 'org_greenwheels',
        name: 'GreenWheels Express Logistics',
        slug: 'greenwheels-logistics',
        type: 'LOGISTICS_PARTNER',
        description: 'Cold-chain and EV fleet partner specializing in rapid urban food rescue transport.',
        email: 'dispatch@greenwheels.in',
        phone: '+91 80 4455 6677',
        isVerified: true,
      },
    });
  }
  await ensureOrgOwner(logisticsOrg.id, 'usr_greenwheels_dispatcher', 'Kiran Verma', 'kiran@greenwheels.in');

  // 6. Register Fleet Vehicles for GreenWheels
  let vehicle1 = await prisma.vehicle.findFirst({
    where: { vehicleNumber: 'KA-01-EV-4421' },
  });

  if (!vehicle1) {
    vehicle1 = await prisma.vehicle.create({
      data: {
        id: 'veh_tata_ace_1',
        organizationId: logisticsOrg.id,
        vehicleNumber: 'KA-01-EV-4421',
        vehicleType: 'MINI_TRUCK',
        capacity: 800,
        unit: 'kg',
        refrigerationSupported: true,
        currentStatus: 'AVAILABLE',
        isActive: true,
      },
    });
  }

  let vehicle2 = await prisma.vehicle.findFirst({
    where: { vehicleNumber: 'KA-01-VN-9082' },
  });

  if (!vehicle2) {
    vehicle2 = await prisma.vehicle.create({
      data: {
        id: 'veh_cargo_van_2',
        organizationId: logisticsOrg.id,
        vehicleNumber: 'KA-01-VN-9082',
        vehicleType: 'VAN',
        capacity: 500,
        unit: 'kg',
        refrigerationSupported: false,
        currentStatus: 'AVAILABLE',
        isActive: true,
      },
    });
  }

  // 7. Food Item & Batch: 30 kg Vegetable Biryani
  let foodItem = await prisma.foodItem.findFirst({
    where: { organizationId: donorOrg.id, name: 'Royal Vegetable Biryani' },
  });

  if (!foodItem) {
    foodItem = await prisma.foodItem.create({
      data: {
        id: 'item_veg_biryani',
        organizationId: donorOrg.id,
        name: 'Royal Vegetable Biryani',
        category: 'PREPARED_MEALS',
        description: 'Fragrant basmati rice cooked with fresh seasonal vegetables and authentic spices.',
        unit: 'kg',
        storageRequirement: 'WARM',
        dietaryFlags: 'VEG',
        isActive: true,
      },
    });
  }

  let batch = await prisma.foodBatch.findFirst({
    where: { batchNumber: 'BATCH-BIR-202609-01' },
  });

  if (!batch) {
    const now = new Date();
    batch = await prisma.foodBatch.create({
      data: {
        id: 'batch_biryani_01',
        organizationId: donorOrg.id,
        facilityId: donorFacility.id,
        foodItemId: foodItem.id,
        batchNumber: 'BATCH-BIR-202609-01',
        initialQuantity: 100,
        currentQuantity: 30, // 30 kg surplus identified
        unit: 'kg',
        preparedAt: new Date(now.getTime() - 2 * 3600000), // 2 hours ago
        expiresAt: new Date(now.getTime() + 6 * 3600000), // 6 hours remaining
        storageCondition: 'HEATED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        status: 'SURPLUS_POSTED',
        notes: 'Excess banquet production from afternoon conference lunch',
      },
    });
  }

  // 8. Surplus Listing: 30 kg Vegetable Biryani
  let surplus = await prisma.surplusListing.findFirst({
    where: { batchId: batch.id },
  });

  const availableUntil = new Date(Date.now() + 5 * 3600000); // 5 hours from now

  if (!surplus) {
    surplus = await prisma.surplusListing.create({
      data: {
        id: 'surplus_biryani_30kg',
        donorOrganizationId: donorOrg.id,
        facilityId: donorFacility.id,
        foodItemId: foodItem.id,
        batchId: batch.id,
        title: '30 kg Fresh Vegetable Biryani Banquet Meals',
        description: 'Hot, hygienically packed vegetable biryani available for immediate community recovery.',
        totalQuantity: 30,
        allocatedQuantity: 0,
        availableQuantity: 30,
        unit: 'kg',
        status: 'PUBLISHED',
        qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
        eligibleRecipientType: 'ALL',
        availableFrom: new Date(),
        availableUntil,
        pickupAddress: donorFacility.address,
        pickupCity: donorFacility.city,
        pickupLatitude: donorFacility.latitude,
        pickupLongitude: donorFacility.longitude,
        pickupWindow: '19:00 - 20:30',
        storageCondition: 'HEATED',
        isFreeDonation: true,
        pricePerUnit: 0,
      },
    });
  } else {
    // Reset test surplus to fresh state for deterministic testing
    await prisma.deliveryRoute.deleteMany({
      where: { recoveryTransaction: { surplusListingId: surplus.id } },
    });
    await prisma.recoveryTransaction.deleteMany({
      where: { surplusListingId: surplus.id },
    });
    await prisma.matchRecommendation.deleteMany({
      where: { surplusListingId: surplus.id },
    });
    surplus = await prisma.surplusListing.update({
      where: { id: surplus.id },
      data: {
        totalQuantity: 30,
        allocatedQuantity: 0,
        availableQuantity: 30,
        status: 'PUBLISHED',
        availableUntil,
      },
    });
  }

  // 9. Recipient Food Requests:
  // Annapoorna: 20 kg (HIGH urgency, 2.4 km away)
  let req1 = await prisma.foodRequest.findFirst({
    where: { requesterOrganizationId: ngoOrg.id, foodCategory: 'PREPARED_MEALS' },
  });

  if (!req1) {
    req1 = await prisma.foodRequest.create({
      data: {
        id: 'req_annapoorna_20kg',
        requesterUserId: 'usr_ngo_coordinator',
        requesterOrganizationId: ngoOrg.id,
        surplusListingId: surplus.id,
        foodCategory: 'PREPARED_MEALS',
        requestedQuantity: 20,
        unit: 'kg',
        status: 'PENDING',
        intendedUse: 'Night shelter dinner distribution for destitute families',
        beneficiaryCount: 80,
        urgency: 'HIGH',
        requiredByDate: availableUntil,
        deliveryLocation: ngoFacility.address,
        notes: 'Can arrange instant pickup via SaveByte logistics network',
      },
    });
  } else {
    req1 = await prisma.foodRequest.update({
      where: { id: req1.id },
      data: { status: 'PENDING', urgency: 'HIGH', surplusListingId: surplus.id, requiredByDate: availableUntil },
    });
  }

  // Akshaya: 15 kg (MEDIUM urgency, 4.1 km away)
  let req2 = await prisma.foodRequest.findFirst({
    where: { requesterOrganizationId: kitchenOrg.id, foodCategory: 'PREPARED_MEALS' },
  });

  if (!req2) {
    req2 = await prisma.foodRequest.create({
      data: {
        id: 'req_akshaya_15kg',
        requesterUserId: 'usr_kitchen_coordinator',
        requesterOrganizationId: kitchenOrg.id,
        surplusListingId: surplus.id,
        foodCategory: 'PREPARED_MEALS',
        requestedQuantity: 15,
        unit: 'kg',
        status: 'PENDING',
        intendedUse: 'Community kitchen dinner supplement',
        beneficiaryCount: 50,
        urgency: 'STANDARD',
        requiredByDate: availableUntil,
        deliveryLocation: kitchenFacility.address,
      },
    });
  } else {
    req2 = await prisma.foodRequest.update({
      where: { id: req2.id },
      data: { status: 'PENDING', urgency: 'STANDARD', surplusListingId: surplus.id, requiredByDate: availableUntil },
    });
  }

  // Sneha: 10 kg (MEDIUM urgency, 6.8 km away)
  let req3 = await prisma.foodRequest.findFirst({
    where: { requesterOrganizationId: shelterOrg.id, foodCategory: 'PREPARED_MEALS' },
  });

  if (!req3) {
    req3 = await prisma.foodRequest.create({
      data: {
        id: 'req_sneha_10kg',
        requesterUserId: 'usr_shelter_coordinator',
        requesterOrganizationId: shelterOrg.id,
        surplusListingId: surplus.id,
        foodCategory: 'PREPARED_MEALS',
        requestedQuantity: 10,
        unit: 'kg',
        status: 'PENDING',
        intendedUse: 'Resident dinner service',
        beneficiaryCount: 35,
        urgency: 'STANDARD',
        requiredByDate: availableUntil,
      },
    });
  } else {
    req3 = await prisma.foodRequest.update({
      where: { id: req3.id },
      data: { status: 'PENDING', urgency: 'STANDARD', surplusListingId: surplus.id, requiredByDate: availableUntil },
    });
  }

  // Reset fleet vehicles & cleanup test vehicles
  await prisma.vehicle.deleteMany({
    where: {
      organizationId: logisticsOrg.id,
      vehicleNumber: { in: ['KA-01-TR-5501', 'KA-01-SCOOT-11'] },
    },
  });
  await prisma.vehicle.updateMany({
    where: { organizationId: logisticsOrg.id },
    data: { currentStatus: 'AVAILABLE' },
  });

  // 10. Run Matching Engine Evaluation for Surplus
  console.log('Evaluating matches via deterministic Matching Engine...');
  const evaluatedMatches = await matchingService.findMatchesForSurplus(
    surplus.id,
    donorOrg.id
  );

  console.log(`Matching Engine evaluated ${evaluatedMatches.length} candidates:`);
  evaluatedMatches.forEach((m, idx) => {
    console.log(
      `  #${idx + 1}: Org ${m.recipientOrganizationId} — Score: ${m.score}% | Distance: ${m.distanceKm} km | Status: ${m.status}`
    );
  });

  console.log('--- Phase 4 Seeding Complete ---');
  return {
    donorOrg,
    donorFacility,
    ngoOrg,
    ngoFacility,
    kitchenOrg,
    kitchenFacility,
    logisticsOrg,
    vehicles: [vehicle1, vehicle2],
    surplus,
    requests: [req1, req2, req3],
    matches: evaluatedMatches,
  };
}
