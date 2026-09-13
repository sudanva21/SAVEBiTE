// ==============================================
// SaveByte — Phase 4 Matching & Logistics Automated Test Suite
// ==============================================
//
// 34 Comprehensive Tests Covering:
// 1. Deterministic Matching Engine & Scoring (1-8)
// 2. Ineligibility & Gating Rules (9-12)
// 3. Ranking & Selection Order (13)
// 4. Transactional Acceptance & Partial Allocation (14-18)
// 5. Rejection & Stale Match Protection (19-20)
// 6. Geospatial Service & Coordinate Privacy (21-23)
// 7. Logistics Fleet & Vehicle Capacity (24-26)
// 8. Route Lifecycle & State Machine Transitions (27-28)
// 9. Physical Handover 6-Digit PIN Verification (29-31)
// 10. Multi-Tenant Security, IDOR & Permissions (32-33)
// 11. Audit Logging & Immutable Trail (34)

import { prisma } from '../db';
import { can } from '../permissions';
import { matchingService } from '../../services/matchingService';
import { logisticsService } from '../../services/logisticsService';
import { geoService } from '../../services/geoService';
import { seedPhase4MatchingAndLogisticsData } from '../seed-phase4';

export async function runPhase4Tests() {
  const results: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  async function test(name: string, fn: () => void | Promise<void>) {
    process.stdout.write(`  -> [Phase 4] Running: ${name}... `);
    try {
      const res = fn();
      if (res instanceof Promise) {
        await res;
      }
      results.push({ name, status: 'PASS' });
      console.log('✓ PASS');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name, status: 'FAIL', error: message });
      console.log(`✗ FAIL: ${message}`);
    }
  }

  // Seed baseline Phase 4 ecosystem
  const seed = await seedPhase4MatchingAndLogisticsData();

  // ----------------------------------------------------
  // SECTION 1: MATCHING ENGINE & SCORING (1 - 8)
  // ----------------------------------------------------

  await test('1. Matching candidate discovery evaluates active requests for surplus', async () => {
    const matches = await matchingService.findMatchesForSurplus(seed.surplus.id, seed.donorOrg.id);
    if (!matches || matches.length === 0) {
      throw new Error('Matching engine should discover candidate food requests');
    }
    if (matches[0].surplusListingId !== seed.surplus.id) {
      throw new Error('Matches must be linked to target surplus listing');
    }
  });

  await test('2. Score calculation includes food category compatibility (max 25)', async () => {
    const evalRes = await matchingService.evaluateCandidate(seed.surplus, seed.requests[0], seed.ngoOrg, seed.ngoFacility);
    if (evalRes.breakdown.foodCompatibility !== 25) {
      throw new Error(`Expected food category score 25, got ${evalRes.breakdown.foodCompatibility}`);
    }
  });

  await test('3. Score calculation includes urgency weighting (HIGH = 20, STANDARD = 10)', async () => {
    const highEval = await matchingService.evaluateCandidate(seed.surplus, seed.requests[0], seed.ngoOrg, seed.ngoFacility);
    const standardEval = await matchingService.evaluateCandidate(seed.surplus, seed.requests[1], seed.kitchenOrg);
    if (highEval.breakdown.urgency !== 20) {
      throw new Error(`Expected HIGH urgency score 20, got ${highEval.breakdown.urgency}`);
    }
    if (standardEval.breakdown.urgency !== 10) {
      throw new Error(`Expected STANDARD urgency score 10, got ${standardEval.breakdown.urgency}`);
    }
  });

  await test('4. Score calculation reflects geographic distance (nearby gets higher score)', async () => {
    const nearbyEval = await matchingService.evaluateCandidate(seed.surplus, seed.requests[0], seed.ngoOrg, seed.ngoFacility);
    if (nearbyEval.breakdown.distance < 15) {
      throw new Error(`Expected nearby distance score >= 15, got ${nearbyEval.breakdown.distance}`);
    }
  });

  await test('5. Score calculation evaluates quantity fit', async () => {
    const evalRes = await matchingService.evaluateCandidate(seed.surplus, seed.requests[0], seed.ngoOrg, seed.ngoFacility);
    if (evalRes.breakdown.quantityCompatibility <= 0) {
      throw new Error('Quantity fit score must be greater than 0');
    }
  });

  await test('6. Score calculation evaluates pickup window compatibility', async () => {
    const evalRes = await matchingService.evaluateCandidate(seed.surplus, seed.requests[0], seed.ngoOrg, seed.ngoFacility);
    if (evalRes.breakdown.pickupWindow <= 0) {
      throw new Error('Pickup window score must be greater than 0');
    }
  });

  await test('7. Score calculation evaluates storage condition compatibility', async () => {
    const evalRes = await matchingService.evaluateCandidate(seed.surplus, seed.requests[0], seed.ngoOrg, seed.ngoFacility);
    if (evalRes.breakdown.storageCompatibility <= 0) {
      throw new Error('Storage compatibility score must be greater than 0');
    }
  });

  await test('8. Explainability: Transparent reasons are generated for match', async () => {
    const evalRes = await matchingService.evaluateCandidate(seed.surplus, seed.requests[0], seed.ngoOrg, seed.ngoFacility);
    if (!evalRes.reasons || evalRes.reasons.length < 3) {
      throw new Error('Evaluation must produce multiple transparent reasons');
    }
    const hasCategoryReason = evalRes.reasons.some(r => r.includes('category'));
    if (!hasCategoryReason) {
      throw new Error('Reasons should explain food category compatibility');
    }
  });

  // ----------------------------------------------------
  // SECTION 2: INELIGIBILITY & GATING RULES (9 - 12)
  // ----------------------------------------------------

  await test('9. Expired surplus is gated as ineligible', async () => {
    const expiredSurplus = { ...seed.surplus, availableUntil: new Date(Date.now() - 10000) };
    const evalRes = await matchingService.evaluateCandidate(expiredSurplus, seed.requests[0]);
    if (evalRes.isEligible) {
      throw new Error('Expired surplus must be marked as ineligible');
    }
  });

  await test('10. Surplus with zero available quantity is gated as ineligible', async () => {
    const zeroSurplus = { ...seed.surplus, availableQuantity: 0 };
    const evalRes = await matchingService.evaluateCandidate(zeroSurplus, seed.requests[0]);
    if (evalRes.isEligible) {
      throw new Error('Zero available surplus must be marked as ineligible');
    }
  });

  await test('11. Non-published surplus status (e.g. CANCELLED) is gated as ineligible', async () => {
    const cancelledSurplus = { ...seed.surplus, status: 'CANCELLED' };
    const evalRes = await matchingService.evaluateCandidate(cancelledSurplus, seed.requests[0]);
    if (evalRes.isEligible) {
      throw new Error('Non-published surplus must be marked as ineligible');
    }
  });

  await test('12. Incompatible food category is gated as ineligible', async () => {
    const dairyRequest = { ...seed.requests[0], foodCategory: 'DAIRY' };
    const evalRes = await matchingService.evaluateCandidate(seed.surplus, dairyRequest);
    if (evalRes.isEligible) {
      throw new Error('Mismatched food category must be marked as ineligible');
    }
  });

  // ----------------------------------------------------
  // SECTION 3: RANKING & CANDIDATE ORDER (13)
  // ----------------------------------------------------

  await test('13. Candidates are ranked strictly descending by total match score', async () => {
    const matches = await matchingService.findMatchesForSurplus(seed.surplus.id, seed.donorOrg.id);
    for (let i = 0; i < matches.length - 1; i++) {
      if (matches[i].score < matches[i + 1].score) {
        throw new Error(`Ranking violation: #${i + 1} score (${matches[i].score}) < #${i + 2} score (${matches[i + 1].score})`);
      }
      if (matches[i].ranking >= matches[i + 1].ranking) {
        throw new Error('Ranking numbers must increment strictly');
      }
    }
  });

  // ----------------------------------------------------
  // SECTION 4: ACCEPTANCE & PARTIAL ALLOCATION (14 - 18)
  // ----------------------------------------------------

  let acceptedMatchId: string;
  let createdRouteId: string;

  await test('14. Accepting match performs atomic partial allocation (20 kg of 30 kg)', async () => {
    const matches = await matchingService.findMatchesForSurplus(seed.surplus.id, seed.donorOrg.id);
    const topMatch = matches[0];
    acceptedMatchId = topMatch.id;

    const res = await matchingService.acceptMatch(topMatch.id, 20, seed.donorOrg.id);

    if (res.match.status !== 'ACCEPTED') {
      throw new Error('Match recommendation status must be ACCEPTED');
    }
    if (res.recoveryTransaction.quantity !== 20) {
      throw new Error(`Expected recovery quantity 20, got ${res.recoveryTransaction.quantity}`);
    }

    // Verify surplus state preservation
    const updatedSurplus = await prisma.surplusListing.findUnique({
      where: { id: seed.surplus.id },
    });

    if (!updatedSurplus) throw new Error('Surplus listing disappeared');
    if (updatedSurplus.totalQuantity !== 30) throw new Error('totalQuantity must remain 30');
    if (updatedSurplus.allocatedQuantity !== 20) throw new Error('allocatedQuantity must be 20');
    if (updatedSurplus.availableQuantity !== 10) throw new Error('availableQuantity must be 10');

    createdRouteId = res.deliveryRoute.id;
  });

  await test('15. Match acceptance automatically provisions a DeliveryRoute with distance & ETA', async () => {
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: createdRouteId },
      include: { recoveryTransaction: true },
    });

    if (!route) throw new Error('Delivery route was not created');
    if (route.status !== 'PLANNED') throw new Error(`Expected route status PLANNED, got ${route.status}`);
    if (!route.distanceKm || route.distanceKm <= 0) throw new Error('Route must have valid distanceKm');
    if (!route.estimatedDurationMinutes || route.estimatedDurationMinutes <= 0) {
      throw new Error('Route must have valid estimatedDurationMinutes');
    }
  });

  await test('16. Match acceptance provisions 6-digit secure physical handover PIN', async () => {
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: createdRouteId },
    });
    if (!route || !route.verificationPin || route.verificationPin.length !== 6) {
      throw new Error('Route must contain 6-digit verification PIN');
    }
  });

  await test('17. Oversell protection: Allocating more than remaining surplus throws error', async () => {
    // Current available is 10 kg
    const matches = await matchingService.findMatchesForSurplus(seed.surplus.id, seed.donorOrg.id);
    const candidate = matches.find(m => m.status === 'SUGGESTED');
    if (candidate) {
      let threw = false;
      try {
        await matchingService.acceptMatch(candidate.id, 15, seed.donorOrg.id); // 15 > 10 available
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Quantity Exceeded') && !err.message.includes('available')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected oversell attempt to throw error');
    }
  });

  await test('18. Negative or zero allocation quantity throws validation error', async () => {
    const matches = await matchingService.findMatchesForSurplus(seed.surplus.id, seed.donorOrg.id);
    const candidate = matches.find(m => m.status === 'SUGGESTED');
    if (candidate) {
      let threw = false;
      try {
        await matchingService.acceptMatch(candidate.id, -5, seed.donorOrg.id);
      } catch (_err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Expected negative allocation to throw error');
    }
  });

  // ----------------------------------------------------
  // SECTION 5: REJECTION & STALE MATCH PROTECTION (19 - 20)
  // ----------------------------------------------------

  await test('19. Donor can reject a match recommendation with reason', async () => {
    const matches = await matchingService.findMatchesForSurplus(seed.surplus.id, seed.donorOrg.id);
    const candidate = matches.find(m => m.status === 'SUGGESTED');
    if (candidate) {
      const rejected = await matchingService.rejectMatch(candidate.id, 'Capacity full', seed.donorOrg.id);
      if (rejected.status !== 'REJECTED') {
        throw new Error('Match must be set to REJECTED');
      }
    }
  });

  await test('20. Stale match protection: Already accepted match cannot be re-accepted', async () => {
    let threw = false;
    try {
      await matchingService.acceptMatch(acceptedMatchId, 5, seed.donorOrg.id);
    } catch (err: any) {
      threw = true;
      if (!err.message.includes('Invalid State')) {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
    if (!threw) throw new Error('Expected double acceptance to throw error');
  });

  // ----------------------------------------------------
  // SECTION 6: GEOSPATIAL & PRIVACY BOUNDARY (21 - 23)
  // ----------------------------------------------------

  await test('21. Haversine distance calculation is accurate between coordinates', async () => {
    // Bangalore MG Road (12.9716, 77.5946) to Shivajinagar (12.9822, 77.6083) ~ 1.9 - 2.5 km
    const res = await geoService.calculateDistance(
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9822, longitude: 77.6083 }
    );
    if (res.distanceKm < 1.0 || res.distanceKm > 4.0) {
      throw new Error(`Distance calculation out of expected range: ${res.distanceKm} km`);
    }
    if (res.estimatedMinutes < 5 || res.estimatedMinutes > 30) {
      throw new Error(`Estimated duration out of expected range: ${res.estimatedMinutes} mins`);
    }
  });

  await test('22. Missing or invalid coordinates fall back gracefully without crashing', async () => {
    const res = await geoService.calculateDistance(
      { city: 'Bangalore' },
      { city: 'Bangalore' }
    );
    if (!res.distanceKm || res.distanceKm <= 0) {
      throw new Error('Fallback city coordinates calculation failed');
    }
  });

  await test('23. Privacy boundary: Individual user profile has no operational coordinates', async () => {
    const user = await prisma.user.findFirst();
    if (user) {
      if ('latitude' in user || 'longitude' in user) {
        throw new Error('User profile must NOT store operational geographic coordinates');
      }
    }
  });

  // ----------------------------------------------------
  // SECTION 7: LOGISTICS FLEET & VEHICLE CAPACITY (24 - 26)
  // ----------------------------------------------------

  let createdVehicleId: string;

  await test('24. Logistics partner can register a fleet vehicle', async () => {
    await prisma.vehicle.deleteMany({
      where: { organizationId: seed.logisticsOrg.id, vehicleNumber: 'KA-01-TR-5501' },
    });

    const vehicle = await logisticsService.createVehicle(
      {
        vehicleNumber: 'KA-01-TR-5501',
        vehicleType: 'MINI_TRUCK',
        capacity: 1000,
        unit: 'kg',
        refrigerationSupported: true,
      },
      seed.logisticsOrg.id
    );

    if (!vehicle.id || vehicle.vehicleNumber !== 'KA-01-TR-5501') {
      throw new Error('Vehicle failed to register');
    }
    createdVehicleId = vehicle.id;
  });

  await test('25. Duplicate vehicle number registration in same organization throws conflict error', async () => {
    let threw = false;
    try {
      await logisticsService.createVehicle(
        {
          vehicleNumber: 'KA-01-TR-5501',
          vehicleType: 'VAN',
          capacity: 500,
        },
        seed.logisticsOrg.id
      );
    } catch (err: any) {
      threw = true;
      if (!err.message.includes('Conflict')) {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
    if (!threw) throw new Error('Expected duplicate vehicle to throw error');
  });

  await test('26. Vehicle capacity validation: Assigning vehicle with capacity < shipment volume throws error', async () => {
    await prisma.vehicle.deleteMany({
      where: { organizationId: seed.logisticsOrg.id, vehicleNumber: 'KA-01-SCOOT-11' },
    });

    // Create tiny vehicle with 5 kg capacity
    const tinyVehicle = await logisticsService.createVehicle(
      {
        vehicleNumber: 'KA-01-SCOOT-11',
        vehicleType: 'TWO_WHEELER',
        capacity: 5, // 5 kg is smaller than 20 kg shipment
      },
      seed.logisticsOrg.id
    );

    let threw = false;
    try {
      await logisticsService.assignRoute(
        createdRouteId,
        { vehicleId: tinyVehicle.id },
        seed.logisticsOrg.id
      );
    } catch (err: any) {
      threw = true;
      if (!err.message.includes('Capacity Exceeded')) {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
    if (!threw) throw new Error('Expected capacity exceeded error');
  });

  // ----------------------------------------------------
  // SECTION 8: ROUTE LIFECYCLE & STATE MACHINE (27 - 28)
  // ----------------------------------------------------

  await test('27. Assigning eligible vehicle transitions route to ASSIGNED', async () => {
    const assigned = await logisticsService.assignRoute(
      createdRouteId,
      {
        vehicleId: createdVehicleId,
        driverName: 'Ramesh Kumar',
        driverPhone: '+91 99887 76655',
      },
      seed.logisticsOrg.id
    );

    if (assigned.status !== 'ASSIGNED') {
      throw new Error(`Expected route status ASSIGNED, got ${assigned.status}`);
    }
    if (assigned.vehicleId !== createdVehicleId) {
      throw new Error('Vehicle ID was not assigned');
    }
  });

  await test('28. State Machine: Illegal transition (ASSIGNED -> DELIVERED) throws error', async () => {
    let threw = false;
    try {
      await logisticsService.updateRouteStatus(
        createdRouteId,
        'DELIVERED',
        undefined,
        seed.logisticsOrg.id
      );
    } catch (err: any) {
      threw = true;
      if (!err.message.includes('Invalid Transition')) {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
    if (!threw) throw new Error('Expected illegal state transition to throw error');
  });

  // ----------------------------------------------------
  // SECTION 9: 6-DIGIT PIN VERIFICATION ON PHYSICAL PICKUP (29 - 31)
  // ----------------------------------------------------

  await test('29. Physical pickup requires valid 6-digit PIN; wrong PIN throws error', async () => {
    // Advance to EN_ROUTE_TO_PICKUP then AT_PICKUP
    await logisticsService.updateRouteStatus(createdRouteId, 'EN_ROUTE_TO_PICKUP', undefined, seed.logisticsOrg.id);
    await logisticsService.updateRouteStatus(createdRouteId, 'AT_PICKUP', undefined, seed.logisticsOrg.id);

    let threw = false;
    try {
      await logisticsService.updateRouteStatus(
        createdRouteId,
        'COLLECTED',
        { verificationPin: '000000' }, // Wrong PIN
        seed.logisticsOrg.id
      );
    } catch (err: any) {
      threw = true;
      if (!err.message.includes('Handover PIN Verification Failed')) {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
    if (!threw) throw new Error('Expected wrong PIN to throw error');
  });

  await test('30. Physical pickup with correct 6-digit PIN transitions route to COLLECTED and vehicle to IN_TRANSIT', async () => {
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: createdRouteId },
    });

    const collected = await logisticsService.updateRouteStatus(
      createdRouteId,
      'COLLECTED',
      { verificationPin: route!.verificationPin || undefined },
      seed.logisticsOrg.id
    );

    if (collected.status !== 'COLLECTED') {
      throw new Error(`Expected route status COLLECTED, got ${collected.status}`);
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: createdVehicleId },
    });
    if (vehicle?.currentStatus !== 'IN_TRANSIT') {
      throw new Error(`Expected vehicle currentStatus IN_TRANSIT, got ${vehicle?.currentStatus}`);
    }
  });

  await test('31. Delivery completion transitions route to DELIVERED and marks vehicle AVAILABLE', async () => {
    const delivered = await logisticsService.updateRouteStatus(
      createdRouteId,
      'DELIVERED',
      { notes: 'Successfully handed over to community kitchen chef' },
      seed.logisticsOrg.id
    );

    if (delivered.status !== 'DELIVERED') {
      throw new Error(`Expected route status DELIVERED, got ${delivered.status}`);
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: createdVehicleId },
    });
    if (vehicle?.currentStatus !== 'AVAILABLE') {
      throw new Error(`Expected vehicle currentStatus AVAILABLE, got ${vehicle?.currentStatus}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 10: MULTI-TENANT SECURITY & PERMISSIONS (32 - 33)
  // ----------------------------------------------------

  await test('32. Multi-tenant isolation: Org B cannot accept Org A’s surplus match', async () => {
    const matches = await matchingService.findMatchesForSurplus(seed.surplus.id, seed.donorOrg.id);
    const candidate = matches[0];
    if (candidate) {
      let threw = false;
      try {
        await matchingService.acceptMatch(candidate.id, 5, seed.ngoOrg.id); // Ngo Org cannot accept donor's surplus
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Access Denied')) {
          throw new Error(`Unexpected error: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected cross-tenant acceptance to be blocked');
    }
  });

  await test('33. Capability checks: Individual user cannot manage fleet or assign routes', async () => {
    const individualMembership = { role: 'INDIVIDUAL_USER', status: 'ACTIVE' as const };
    if (can(individualMembership, 'logistics:manage')) {
      throw new Error('INDIVIDUAL_USER must NOT have logistics:manage capability');
    }
    if (can(individualMembership, 'route:assign')) {
      throw new Error('INDIVIDUAL_USER must NOT have route:assign capability');
    }
  });

  // ----------------------------------------------------
  // SECTION 11: AUDIT LOGGING (34)
  // ----------------------------------------------------

  await test('34. Critical operations create immutable audit trail records', async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['match.accepted', 'route.assigned', 'route.status_updated', 'route.delivered'],
        },
      },
    });

    if (!logs || logs.length < 3) {
      throw new Error(`Expected multiple audit log records, found ${logs?.length}`);
    }
  });

  return results;
}
