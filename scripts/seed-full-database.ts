import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { prisma } from '../src/lib/db';

async function seedFullDatabase() {
  console.log('=== Seeding SaveByte Canonical Database (Neon PostgreSQL) ===');

  // 1. Platform Admin / Demo User
  const adminUser = await prisma.user.upsert({
    where: { clerkUserId: 'user_sudanva_admin' },
    update: {
      email: 'sudanva7@gmail.com',
      displayName: 'Sudanva Shilannavar',
      isOnboarded: true,
    },
    create: {
      id: 'usr_sudanva_platform_admin',
      clerkUserId: 'user_sudanva_admin',
      email: 'sudanva7@gmail.com',
      displayName: 'Sudanva Shilannavar',
      isOnboarded: true,
    },
  });

  const aaravUser = await prisma.user.upsert({
    where: { clerkUserId: 'user_aarav_individual' },
    update: {},
    create: {
      id: 'usr_aarav_patel',
      clerkUserId: 'user_aarav_individual',
      email: 'aarav.patel@example.com',
      displayName: 'Aarav Patel',
      isOnboarded: true,
    },
  });

  const sunitaUser = await prisma.user.upsert({
    where: { clerkUserId: 'user_sunita_ngo' },
    update: {},
    create: {
      id: 'usr_sunita_rao',
      clerkUserId: 'user_sunita_ngo',
      email: 'sunita@sneha.org',
      displayName: 'Sunita Rao',
      isOnboarded: true,
    },
  });

  const kiranUser = await prisma.user.upsert({
    where: { clerkUserId: 'user_kiran_logistics' },
    update: {},
    create: {
      id: 'usr_kiran_verma',
      clerkUserId: 'user_kiran_logistics',
      email: 'kiran@greenwheels.in',
      displayName: 'Kiran Verma',
      isOnboarded: true,
    },
  });

  console.log('✓ Users provisioned');

  // 2. Organizations
  const tajOrg = await prisma.organization.upsert({
    where: { slug: 'the-grand-taj-kitchen' },
    update: {},
    create: {
      id: 'org_grand_taj',
      name: 'The Grand Taj Kitchen',
      slug: 'the-grand-taj-kitchen',
      type: 'HOTEL',
      description: 'Luxury five-star hotel culinary center and central banquet kitchen.',
      email: 'vikram@grandtaj.com',
      phone: '+91 98450 11223',
      isVerified: true,
    },
  });

  const snehaOrg = await prisma.organization.upsert({
    where: { slug: 'sneha-shelter-home' },
    update: {},
    create: {
      id: 'org_sneha_shelter',
      name: 'Sneha Shelter Home',
      slug: 'sneha-shelter-home',
      type: 'SHELTER',
      description: 'Community residential shelter providing nutritious daily meals to 180 beneficiaries.',
      email: 'relief@sneha.org',
      phone: '+91 98860 44556',
      isVerified: true,
    },
  });

  const annapoornaOrg = await prisma.organization.upsert({
    where: { slug: 'annapoorna-food-relief' },
    update: {},
    create: {
      id: 'org_annapoorna_relief',
      name: 'Annapoorna Food Relief Trust',
      slug: 'annapoorna-food-relief',
      type: 'NGO',
      description: 'Non-profit dedicated to zero-waste urban food redistribution.',
      email: 'priya@annapoorna.org',
      phone: '+91 98440 99887',
      isVerified: true,
    },
  });

  const greenwheelsOrg = await prisma.organization.upsert({
    where: { slug: 'greenwheels-express-logistics' },
    update: {},
    create: {
      id: 'org_greenwheels_logistics',
      name: 'GreenWheels Express Logistics',
      slug: 'greenwheels-express-logistics',
      type: 'LOGISTICS_PARTNER',
      description: 'Temperature-controlled EV fleet for urban surplus food rescue.',
      email: 'ops@greenwheels.in',
      phone: '+91 99000 88776',
      isVerified: true,
    },
  });

  console.log('✓ Organizations provisioned');

  // 3. Facilities
  const tajFacility = await prisma.facility.upsert({
    where: { id: 'fac_taj_mg_road' },
    update: {},
    create: {
      id: 'fac_taj_mg_road',
      organizationId: tajOrg.id,
      name: 'Central Banquet Kitchen (MG Road)',
      type: 'KITCHEN',
      address: '41/3 MG Road, Central Business District',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      isPrimary: true,
    },
  });

  const snehaFacility = await prisma.facility.upsert({
    where: { id: 'fac_sneha_ulsoor' },
    update: {},
    create: {
      id: 'fac_sneha_ulsoor',
      organizationId: snehaOrg.id,
      name: 'Ulsoor Community Receiving Hub',
      type: 'COMMUNITY_KITCHEN',
      address: '18 Cambridge Road, Ulsoor',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560008',
      latitude: 12.9782,
      longitude: 77.6192,
      isPrimary: true,
    },
  });

  const annapoornaFacility = await prisma.facility.upsert({
    where: { id: 'fac_annapoorna_shivaji' },
    update: {},
    create: {
      id: 'fac_annapoorna_shivaji',
      organizationId: annapoornaOrg.id,
      name: 'Central Distribution Depot',
      type: 'DISTRIBUTION_CENTER',
      address: '74 Queens Road, Shivajinagar',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560051',
      latitude: 12.9856,
      longitude: 77.5982,
      isPrimary: true,
    },
  });

  console.log('✓ Facilities provisioned');

  // 4. Memberships
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: tajOrg.id,
      },
    },
    update: { role: 'ORGANIZATION_OWNER', status: 'ACTIVE' },
    create: {
      userId: adminUser.id,
      organizationId: tajOrg.id,
      role: 'ORGANIZATION_OWNER',
      status: 'ACTIVE',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: sunitaUser.id,
        organizationId: snehaOrg.id,
      },
    },
    update: { role: 'ORGANIZATION_OWNER', status: 'ACTIVE' },
    create: {
      userId: sunitaUser.id,
      organizationId: snehaOrg.id,
      role: 'ORGANIZATION_OWNER',
      status: 'ACTIVE',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: kiranUser.id,
        organizationId: greenwheelsOrg.id,
      },
    },
    update: { role: 'ORGANIZATION_OWNER', status: 'ACTIVE' },
    create: {
      userId: kiranUser.id,
      organizationId: greenwheelsOrg.id,
      role: 'ORGANIZATION_OWNER',
      status: 'ACTIVE',
    },
  });

  console.log('✓ Memberships provisioned');

  // 5. Food Items & Batches
  const biryaniItem = await prisma.foodItem.upsert({
    where: { id: 'fi_veg_biryani_taj' },
    update: {},
    create: {
      id: 'fi_veg_biryani_taj',
      organizationId: tajOrg.id,
      name: 'Royal Subz Dum Biryani',
      category: 'PREPARED_MEALS',
      description: 'Slow-cooked fragrant basmati rice with farm vegetables and saffron.',
      unit: 'kg',
      storageRequirement: 'REFRIGERATED',
      dietaryFlags: 'VEG',
      isActive: true,
    },
  });

  const breadItem = await prisma.foodItem.upsert({
    where: { id: 'fi_artisan_bread' },
    update: {},
    create: {
      id: 'fi_artisan_bread',
      organizationId: tajOrg.id,
      name: 'Artisan Garlic Baguettes',
      category: 'BAKERY',
      description: 'Freshly baked sourdough baguettes with herb butter.',
      unit: 'kg',
      storageRequirement: 'AMBIENT',
      dietaryFlags: 'VEG',
      isActive: true,
    },
  });

  const now = new Date();
  const expiresSoon = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const expiresLater = new Date(now.getTime() + 20 * 60 * 60 * 1000);

  const batch1 = await prisma.foodBatch.upsert({
    where: { id: 'batch_taj_biryani_01' },
    update: {},
    create: {
      id: 'batch_taj_biryani_01',
      organizationId: tajOrg.id,
      facilityId: tajFacility.id,
      foodItemId: biryaniItem.id,
      batchNumber: 'SB-8821',
      initialQuantity: 80,
      currentQuantity: 30,
      unit: 'kg',
      status: 'ACTIVE',
      preparedAt: now,
      expiresAt: expiresSoon,
      storageCondition: 'COLD_STORAGE',
      qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
    },
  });

  const batch2 = await prisma.foodBatch.upsert({
    where: { id: 'batch_taj_bread_02' },
    update: {},
    create: {
      id: 'batch_taj_bread_02',
      organizationId: tajOrg.id,
      facilityId: tajFacility.id,
      foodItemId: breadItem.id,
      batchNumber: 'SB-8822',
      initialQuantity: 45,
      currentQuantity: 45,
      unit: 'kg',
      status: 'ACTIVE',
      preparedAt: now,
      expiresAt: expiresLater,
      storageCondition: 'ROOM_TEMP',
      qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
    },
  });

  console.log('✓ Food Batches provisioned');

  // 6. Surplus Listings
  const surplus1 = await prisma.surplusListing.upsert({
    where: { id: 'surplus_taj_biryani_01' },
    update: {},
    create: {
      id: 'surplus_taj_biryani_01',
      donorOrganizationId: tajOrg.id,
      facilityId: tajFacility.id,
      batchId: batch1.id,
      foodItemId: biryaniItem.id,
      title: 'Cooked Rice & Dal Meals (120 Portions)',
      description: 'High-quality freshly prepared banquet surplus. Chilled in walk-in cold room.',
      totalQuantity: 30,
      availableQuantity: 10,
      allocatedQuantity: 20,
      unit: 'kg',
      status: 'PUBLISHED',
      qualityStatus: 'SUITABLE_FOR_HUMAN_RECOVERY',
      eligibleRecipientType: 'ALL',
      availableUntil: expiresSoon,
      pickupAddress: tajFacility.address,
      pickupCity: 'Bangalore',
      pickupLatitude: tajFacility.latitude,
      pickupLongitude: tajFacility.longitude,
      isFreeDonation: true,
      pricePerUnit: 0,
    },
  });

  console.log('✓ Surplus Listings provisioned');

  // 7. Vehicles & Routes
  const vehicle1 = await prisma.vehicle.upsert({
    where: { id: 'veh_greenwheels_01' },
    update: {},
    create: {
      id: 'veh_greenwheels_01',
      organizationId: greenwheelsOrg.id,
      vehicleNumber: 'KA-01-EB-4921',
      vehicleType: 'VAN',
      capacity: 650,
      unit: 'kg',
      refrigerationSupported: true,
      currentStatus: 'IN_TRANSIT',
      isActive: true,
    },
  });

  const recoveryTx = await prisma.recoveryTransaction.upsert({
    where: { id: 'rec_tx_taj_to_sneha' },
    update: {},
    create: {
      id: 'rec_tx_taj_to_sneha',
      donorOrganizationId: tajOrg.id,
      facilityId: tajFacility.id,
      recipientOrganizationId: snehaOrg.id,
      recipientUserId: sunitaUser.id,
      surplusListingId: surplus1.id,
      foodItemId: biryaniItem.id,
      batchId: batch1.id,
      quantity: 20,
      unit: 'kg',
      orderType: 'NGO_CLAIM',
      status: 'COLLECTED',
      pickupAddress: tajFacility.address,
      pickupLatitude: tajFacility.latitude,
      pickupLongitude: tajFacility.longitude,
      verificationPin: '849201',
      collectedAt: now,
    },
  });

  await prisma.deliveryRoute.upsert({
    where: { recoveryTransactionId: recoveryTx.id },
    update: {},
    create: {
      id: 'route_taj_to_sneha',
      recoveryTransactionId: recoveryTx.id,
      logisticsOrganizationId: greenwheelsOrg.id,
      vehicleId: vehicle1.id,
      driverUserId: kiranUser.id,
      driverName: 'Kiran Verma',
      driverPhone: '+91 99000 88776',
      pickupLocation: tajFacility.address,
      pickupLatitude: tajFacility.latitude,
      pickupLongitude: tajFacility.longitude,
      destinationLocation: snehaFacility.address,
      destinationLatitude: snehaFacility.latitude,
      destinationLongitude: snehaFacility.longitude,
      distanceKm: 2.8,
      estimatedDurationMinutes: 16,
      status: 'EN_ROUTE_TO_DESTINATION',
      verificationPin: '849201',
    },
  });

  console.log('✓ Vehicles & Logistics Routes provisioned');

  // 8. Immutable Audit Log
  await prisma.auditLog.create({
    data: {
      action: 'SURPLUS_RECOVERY_DISPATCHED',
      entity: 'RecoveryTransaction',
      entityId: recoveryTx.id,
      actorId: adminUser.id,
      previousState: { status: 'ALLOCATED' },
      newState: { status: 'COLLECTED' },
      reason: 'Physical handover verified via 6-digit cryptographic PIN 849201.',
      context: { verificationPin: '849201' },
    },
  });

  console.log('=== Neon Database Seeding Complete & Verified! ===');
}

seedFullDatabase()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect?.();
  });
