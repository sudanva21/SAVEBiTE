// ==============================================
// SaveByte — Canonical SIH Final Demo Seed Script
// ==============================================
//
// Guarantees all 11 canonical entities for the final live SIH demonstration:
// 1. ONE PENDING ORGANIZATION APPLICATION (GreenLeaf Catering & Events)
// 2. ONE APPROVED ORGANIZATION (The Grand Taj Kitchen)
// 3. ONE NGO (Annapoorna Food Relief)
// 4. ONE INDIVIDUAL USER (Aarav Patel)
// 5. ONE ACTIVE SURPLUS (30 kg Vegetable Biryani: 10 kg remaining, 20 kg allocated)
// 6. ONE FOOD REQUEST (Annapoorna 20 kg Request)
// 7. ONE MATCH (Score 94% — The Grand Taj -> Annapoorna)
// 8. ONE RECOVERY TRANSACTION (20 kg, PIN: 849201, COLLECTED)
// 9. ONE ACTIVE ROUTE (Tata Ace EV, 2.4 km, 18 min ETA, status IN_TRANSIT)
// 10. ONE VEHICLE (Tata Ace EV: KA-01-EV-4421)
// 11. ONE AI INSIGHT (Grounded Demand Forecast & Surplus Prediction)

import { prisma } from './db';
import { seedPhase4MatchingAndLogisticsData } from './seed-phase4';
import { seedPhase5AIIntelligenceData } from './seed-phase5';

export async function seedFinalDemoScenario() {
  console.log('=== [SaveByte SIH Final Demo] Seeding Canonical Scenario ===');

  // Step A: Seed Phase 4 & Phase 5 Foundations first
  await seedPhase4MatchingAndLogisticsData();
  await seedPhase5AIIntelligenceData();

  // 1. ONE PENDING ORGANIZATION APPLICATION
  // Ensure applicant user exists
  let applicantUser = await prisma.user.findFirst({
    where: { email: 'kavita@greenleafcatering.in' },
  });
  if (!applicantUser) {
    applicantUser = await prisma.user.create({
      data: {
        id: 'usr_kavita_applicant',
        clerkUserId: 'clerk_kavita_applicant',
        displayName: 'Kavita Rao',
        email: 'kavita@greenleafcatering.in',
        isOnboarded: false,
      },
    });
  }

  let pendingApp = await prisma.organizationApplication.findFirst({
    where: { orgName: 'GreenLeaf Catering & Events' },
  });

  if (!pendingApp) {
    pendingApp = await prisma.organizationApplication.create({
      data: {
        id: 'app_greenleaf_demo',
        applicantId: applicantUser.id,
        orgName: 'GreenLeaf Catering & Events',
        type: 'RESTAURANT',
        orgType: 'RESTAURANT',
        contactName: 'Kavita Rao',
        contactEmail: 'kavita@greenleafcatering.in',
        facilityName: 'GreenLeaf Central Commercial Kitchen',
        facilityType: 'KITCHEN',
        address: '88 Koramangala 4th Block, 80 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        registrationNumber: 'FSSAI-11223344556677',
        status: 'PENDING',
        description: 'High volume corporate catering unit requesting SaveByte verification for regular food surplus donation.',
      },
    });
    console.log('✓ 1. Created Pending Organization Application: GreenLeaf Catering & Events');
  } else {
    console.log('✓ 1. Verified Pending Organization Application: GreenLeaf Catering & Events');
  }

  // 2. ONE APPROVED ORGANIZATION
  const donorOrg = await prisma.organization.findFirst({
    where: { slug: 'the-grand-taj-kitchen' },
  });
  if (!donorOrg) throw new Error('Donor Org The Grand Taj Kitchen missing');
  console.log(`✓ 2. Approved Organization: ${donorOrg.name}`);

  // 3. ONE NGO
  const ngoOrg = await prisma.organization.findFirst({
    where: { slug: 'annapoorna-food-relief' },
  });
  if (!ngoOrg) throw new Error('NGO Annapoorna Food Relief missing');
  console.log(`✓ 3. NGO Organization: ${ngoOrg.name}`);

  // 4. ONE INDIVIDUAL USER
  let individualUser = await prisma.user.findFirst({
    where: { email: 'aarav.patel@gmail.com' },
  });
  if (!individualUser) {
    individualUser = await prisma.user.create({
      data: {
        id: 'usr_individual_aarav',
        clerkUserId: 'clerk_aarav_patel',
        displayName: 'Aarav Patel',
        email: 'aarav.patel@gmail.com',
        isOnboarded: true,
      },
    });
    console.log('✓ 4. Created Individual User: Aarav Patel');
  } else {
    console.log('✓ 4. Verified Individual User: Aarav Patel');
  }

  // 5. ONE ACTIVE SURPLUS (30 kg Vegetable Biryani: 10 kg available, 20 kg allocated)
  const surplus = await prisma.surplusListing.findFirst({
    where: { donorOrganizationId: donorOrg.id },
  });
  if (!surplus) throw new Error('Surplus listing missing');
  await prisma.surplusListing.update({
    where: { id: surplus.id },
    data: {
      totalQuantity: 30,
      allocatedQuantity: 20,
      availableQuantity: 10,
      status: 'PUBLISHED',
    },
  });
  console.log('✓ 5. Active Surplus: 30 kg Vegetable Biryani (20 kg allocated, 10 kg available)');

  // 6. ONE FOOD REQUEST
  const request = await prisma.foodRequest.findFirst({
    where: { requesterOrganizationId: ngoOrg.id },
  });
  if (!request) throw new Error('Food request missing');
  console.log(`✓ 6. Food Request: ${request.requestedQuantity} kg requested by ${ngoOrg.name}`);

  // 7. ONE MATCH
  const match = await prisma.matchRecommendation.upsert({
    where: { id: 'match_taj_annapoorna_01' },
    update: {
      surplusListingId: surplus.id,
      foodRequestId: request.id,
      donorOrganizationId: donorOrg.id,
      recipientOrganizationId: ngoOrg.id,
      score: 94,
      ranking: 1,
      distanceKm: 2.4,
      estimatedTravelMinutes: 18,
      status: 'ACCEPTED',
      matchingReasons: 'Category match: Prepared Meals; Urgency: High (Shelter Dinner); Proximity: 2.4 km; Optimal quantity allocation: 20 kg',
      breakdown: JSON.stringify({
        foodCompatibility: 25,
        urgency: 20,
        distance: 24,
        quantityCompatibility: 25,
      }),
    },
    create: {
      id: 'match_taj_annapoorna_01',
      surplusListingId: surplus.id,
      foodRequestId: request.id,
      donorOrganizationId: donorOrg.id,
      recipientOrganizationId: ngoOrg.id,
      score: 94,
      ranking: 1,
      distanceKm: 2.4,
      estimatedTravelMinutes: 18,
      status: 'ACCEPTED',
      matchingReasons: 'Category match: Prepared Meals; Urgency: High (Shelter Dinner); Proximity: 2.4 km; Optimal quantity allocation: 20 kg',
      breakdown: JSON.stringify({
        foodCompatibility: 25,
        urgency: 20,
        distance: 24,
        quantityCompatibility: 25,
      }),
      acceptedAt: new Date(Date.now() - 30 * 60000),
    },
  });
  console.log('✓ 7. Match: Score 94% — The Grand Taj Kitchen -> Annapoorna Food Relief');

  // 8. ONE VEHICLE (Tata Ace EV)
  const logisticsOrg = await prisma.organization.findFirst({
    where: { slug: 'greenwheels-logistics' },
  });
  const vehicle = await prisma.vehicle.upsert({
    where: { id: 'veh_tata_ace_1' },
    update: {
      vehicleNumber: 'KA-01-EV-4421',
      vehicleType: 'Tata Ace EV',
      currentStatus: 'IN_TRANSIT',
      isActive: true,
    },
    create: {
      id: 'veh_tata_ace_1',
      organizationId: logisticsOrg ? logisticsOrg.id : donorOrg.id,
      vehicleNumber: 'KA-01-EV-4421',
      vehicleType: 'Tata Ace EV',
      capacity: 800,
      unit: 'kg',
      refrigerationSupported: true,
      currentStatus: 'IN_TRANSIT',
      isActive: true,
    },
  });
  console.log(`✓ 8. Vehicle: ${vehicle.vehicleType} (${vehicle.vehicleNumber})`);

  // 9. ONE RECOVERY TRANSACTION (20 kg, PIN: 849201, COLLECTED / IN TRANSIT)
  const recoveryTx = await prisma.recoveryTransaction.upsert({
    where: { id: 'tx_canonical_demo_01' },
    update: {
      donorOrganizationId: donorOrg.id,
      facilityId: surplus.facilityId,
      recipientOrganizationId: ngoOrg.id,
      surplusListingId: surplus.id,
      foodItemId: surplus.foodItemId,
      batchId: surplus.batchId || 'batch_biryani_01',
      quantity: 20,
      status: 'COLLECTED',
      verificationPin: '849201',
      collectedAt: new Date(Date.now() - 15 * 60000),
    },
    create: {
      id: 'tx_canonical_demo_01',
      donorOrganizationId: donorOrg.id,
      facilityId: surplus.facilityId,
      recipientOrganizationId: ngoOrg.id,
      surplusListingId: surplus.id,
      foodItemId: surplus.foodItemId,
      batchId: surplus.batchId || 'batch_biryani_01',
      recipientUserId: 'usr_ngo_coordinator',
      quantity: 20,
      unit: 'kg',
      orderType: 'NGO_CLAIM',
      status: 'COLLECTED',
      verificationPin: '849201',
      pickupAddress: surplus.pickupAddress,
      notes: 'Delivery destination: 42 Commercial Street, Tasker Town, Bengaluru',
      collectedAt: new Date(Date.now() - 15 * 60000),
    },
  });
  console.log('✓ 9. Recovery Transaction: 20 kg (PIN: 849201, COLLECTED)');

  // 10. ONE ACTIVE ROUTE (Tata Ace EV, 2.4 km, 18 min ETA, status IN_TRANSIT)
  const deliveryRoute = await prisma.deliveryRoute.upsert({
    where: { id: 'route_canonical_demo_01' },
    update: {
      recoveryTransactionId: recoveryTx.id,
      vehicleId: vehicle.id,
      pickupLocation: 'The Grand Taj Kitchen, Central Banquet Kitchen, Bengaluru',
      destinationLocation: 'Annapoorna Food Relief, Shivajinagar Distribution Hub, Bengaluru',
      distanceKm: 2.4,
      estimatedDurationMinutes: 18,
      status: 'EN_ROUTE_TO_DESTINATION',
      verificationPin: '849201',
      pickupLatitude: 12.9716,
      pickupLongitude: 77.5946,
      destinationLatitude: 12.9822,
      destinationLongitude: 77.6083,
    },
    create: {
      id: 'route_canonical_demo_01',
      recoveryTransactionId: recoveryTx.id,
      vehicleId: vehicle.id,
      pickupLocation: 'The Grand Taj Kitchen, Central Banquet Kitchen, Bengaluru',
      pickupLatitude: 12.9716,
      pickupLongitude: 77.5946,
      destinationLocation: 'Annapoorna Food Relief, Shivajinagar Distribution Hub, Bengaluru',
      destinationLatitude: 12.9822,
      destinationLongitude: 77.6083,
      distanceKm: 2.4,
      estimatedDurationMinutes: 18,
      status: 'EN_ROUTE_TO_DESTINATION',
      verificationPin: '849201',
      startedAt: new Date(Date.now() - 25 * 60000),
      arrivedPickupAt: new Date(Date.now() - 18 * 60000),
      collectedAt: new Date(Date.now() - 15 * 60000),
    },
  });
  console.log('✓ 10. Active Route: Tata Ace EV, 2.4 km, 18 min ETA, status IN TRANSIT (EN_ROUTE_TO_DESTINATION)');

  // 11. ONE AI INSIGHT (Grounded Demand Forecast & Operational Audit)
  let aiInsight = await prisma.aiInsight.findFirst({
    where: { organizationId: donorOrg.id, type: 'DEMAND_FORECAST' },
  });

  if (!aiInsight) {
    aiInsight = await prisma.aiInsight.create({
      data: {
        organizationId: donorOrg.id,
        facilityId: donorOrg.facilities?.[0]?.id,
        type: 'DEMAND_FORECAST',
        inputHash: 'hash_canonical_demo_taj',
        confidence: 88,
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        result: JSON.stringify({
          weightedMovingAverage: 435,
          weekendSeasonalityMultiplier: 1.15,
          recentTrendPercent: 4.2,
          wastePercentage: 5.8,
          confidence: 88,
          aiExplanation: 'Banquet dinner demand is trending slightly upward (+4.2%) due to weekend corporate bookings. Recommended banquet batch size is 430–445 kg to maintain a safe surplus buffer while avoiding unnecessary waste.',
          methodology: 'Weighted historical baseline + Groq gpt-oss-120b explanation',
          limitations: 'Calculated from 14 days of logged shift records; does not account for unannounced walk-in groups.',
        }),
        expiresAt: new Date(Date.now() + 24 * 3600000),
      },
    });
  }
  console.log('✓ 11. AI Insight: Demand Forecast & Surplus Prediction (The Grand Taj Kitchen)');

  console.log('=== Canonical SIH Demo Scenario Successfully Seeded & Verified! ===\n');

  return {
    pendingApp,
    donorOrg,
    ngoOrg,
    individualUser,
    surplus,
    request,
    match,
    vehicle,
    recoveryTx,
    deliveryRoute,
    aiInsight,
  };
}
