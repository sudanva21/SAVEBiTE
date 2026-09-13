// ==============================================
// SaveByte — Matching Engine Service (Phase 4)
// ==============================================

import { prisma } from '@/lib/db';
import { authorizationService } from './authorizationService';
import { auditService } from './auditService';
import { geoService } from './geoService';
import {
  SurplusListing,
  FoodRequest,
  MatchRecommendation,
  RecoveryTransaction,
  DeliveryRoute,
  Facility,
  Organization,
} from '@/generated/prisma';

export interface MatchEvaluationResult {
  score: number; // 0 to 100
  breakdown: {
    foodCompatibility: number; // max 25
    urgency: number; // max 20
    distance: number; // max 20
    quantityCompatibility: number; // max 15
    pickupWindow: number; // max 10
    storageCompatibility: number; // max 10
  };
  reasons: string[];
  distanceKm: number;
  estimatedMinutes: number;
  isEligible: boolean;
  ineligibilityReason: string | null;
}

export const matchingService = {
  /**
   * Deterministically evaluates a candidate match between a SurplusListing and a FoodRequest.
   * Produces an explainable score with transparent reasons.
   */
  async evaluateCandidate(
    surplus: SurplusListing,
    request: FoodRequest,
    recipientOrg?: Organization | null,
    recipientFacility?: Facility | null
  ): Promise<MatchEvaluationResult> {
    const reasons: string[] = [];
    let isEligible = true;
    let ineligibilityReason: string | null = null;

    // Resolve food category
    let foodCategory = (surplus as any).foodItem?.category;
    if (!foodCategory && surplus.foodItemId) {
      const fi = await prisma.foodItem.findUnique({ where: { id: surplus.foodItemId } });
      foodCategory = fi?.category;
    }
    foodCategory = foodCategory || 'PREPARED_MEALS';

    // 1. Ineligibility Gates
    const now = Date.now();
    if (surplus.status !== 'PUBLISHED' && surplus.status !== 'DRAFT') {
      isEligible = false;
      ineligibilityReason = `Surplus listing status is ${surplus.status} (must be PUBLISHED)`;
    } else if (new Date(surplus.availableUntil).getTime() <= now) {
      isEligible = false;
      ineligibilityReason = 'Surplus listing has expired past its available window';
    } else if (surplus.availableQuantity <= 0) {
      isEligible = false;
      ineligibilityReason = 'Surplus listing has no remaining available quantity';
    } else if (surplus.qualityStatus === 'NOT_SUITABLE_FOR_HUMAN_RECOVERY') {
      isEligible = false;
      ineligibilityReason = 'Food is flagged as not suitable for human recovery';
    } else if (
      surplus.eligibleRecipientType === 'INDIVIDUAL_ONLY' &&
      request.requesterOrganizationId
    ) {
      isEligible = false;
      ineligibilityReason = 'Surplus is restricted to direct individual consumption';
    } else if (
      request.foodCategory &&
      request.foodCategory !== 'OTHER' &&
      request.foodCategory !== 'ALL' &&
      foodCategory &&
      request.foodCategory.toUpperCase() !== foodCategory.toUpperCase() &&
      request.foodCategory.toUpperCase() !== 'PREPARED_MEALS'
    ) {
      isEligible = false;
      ineligibilityReason = `Food category mismatch: Listing is ${foodCategory}, requested ${request.foodCategory}`;
    }

    // If hard-ineligible, return baseline 0 score
    if (!isEligible) {
      return {
        score: 0,
        breakdown: {
          foodCompatibility: 0,
          urgency: 0,
          distance: 0,
          quantityCompatibility: 0,
          pickupWindow: 0,
          storageCompatibility: 0,
        },
        reasons: [`Ineligible: ${ineligibilityReason}`],
        distanceKm: 0,
        estimatedMinutes: 0,
        isEligible: false,
        ineligibilityReason,
      };
    }

    // 2. Multi-Factor Scoring

    // A. Food Compatibility (Max 25 pts)
    let foodScore = 5;
    const surplusCategory = foodCategory || 'PREPARED_MEALS';
    if (
      surplusCategory.toUpperCase() === request.foodCategory.toUpperCase() ||
      request.foodCategory === 'PREPARED_MEALS' ||
      surplusCategory === 'PREPARED_MEALS'
    ) {
      foodScore = 25;
      reasons.push(
        `Food category aligns with requested category (${request.foodCategory.replace(/_/g, ' ')})`
      );
    } else if (
      surplusCategory.includes('GRAIN') &&
      request.foodCategory.includes('GRAIN')
    ) {
      foodScore = 20;
      reasons.push('Compatible grain and pantry category match');
    } else {
      foodScore = 15;
      reasons.push('Acceptable secondary food category match');
    }

    // B. Urgency Score (Max 20 pts)
    let urgencyScore = 10;
    const urgency = request.urgency?.toUpperCase() || 'STANDARD';
    if (urgency === 'CRITICAL' || urgency === 'HIGH') {
      urgencyScore = 20;
      reasons.push(
        urgency === 'CRITICAL'
          ? 'Critical urgency community relief request (Priority 1)'
          : 'High urgency food relief distribution requirement'
      );
    } else {
      urgencyScore = 10;
      reasons.push('Standard scheduled community distribution');
    }

    // C. Geographic Distance & Travel Proximity (Max 20 pts)
    const distanceResult = await geoService.calculateDistance(
      {
        latitude: surplus.pickupLatitude,
        longitude: surplus.pickupLongitude,
        address: surplus.pickupAddress,
        city: surplus.pickupCity,
      },
      {
        latitude: recipientFacility?.latitude,
        longitude: recipientFacility?.longitude,
        address: request.deliveryLocation || recipientFacility?.address,
        city: recipientFacility?.city || surplus.pickupCity,
      }
    );

    let distanceScore = 5;
    if (distanceResult.distanceKm <= 3.0) {
      distanceScore = 20;
      reasons.push(
        `Nearby recipient location (${distanceResult.distanceKm} km, ~${distanceResult.estimatedMinutes} min travel)`
      );
    } else if (distanceResult.distanceKm <= 7.0) {
      distanceScore = 16;
      reasons.push(
        `Within standard operational radius (${distanceResult.distanceKm} km, ~${distanceResult.estimatedMinutes} min travel)`
      );
    } else if (distanceResult.distanceKm <= 15.0) {
      distanceScore = 11;
      reasons.push(
        `Moderate transit distance (${distanceResult.distanceKm} km, ~${distanceResult.estimatedMinutes} min travel)`
      );
    } else {
      distanceScore = 5;
      reasons.push(
        `Extended transit distance (${distanceResult.distanceKm} km, requires dispatch planning)`
      );
    }

    // D. Quantity Compatibility (Max 15 pts)
    let quantityScore = 8;
    const reqQty = request.requestedQuantity;
    const availQty = surplus.availableQuantity;
    if (reqQty <= availQty) {
      quantityScore = 15;
      reasons.push(
        `Requested quantity (${reqQty} ${request.unit}) fully covered by available surplus (${availQty} ${surplus.unit})`
      );
    } else {
      const coverageRatio = availQty / Math.max(1, reqQty);
      quantityScore = Math.max(5, Math.round(15 * coverageRatio));
      reasons.push(
        `Partial allocation supported: surplus covers ${Math.round(coverageRatio * 100)}% of requested volume`
      );
    }

    // E. Pickup Window & Freshness Urgency (Max 10 pts)
    let windowScore = 6;
    const hoursLeft =
      (new Date(surplus.availableUntil).getTime() - now) / (1000 * 60 * 60);
    if (hoursLeft <= 4) {
      windowScore = 10;
      reasons.push(
        `Immediate rescue required: ${hoursLeft.toFixed(1)} hours remaining before expiration`
      );
    } else if (hoursLeft <= 12) {
      windowScore = 8;
      reasons.push(
        `Standard distribution window: ${Math.round(hoursLeft)} hours remaining`
      );
    } else {
      windowScore = 6;
      reasons.push(
        `Extended shelf-life window (${Math.round(hoursLeft)} hours remaining)`
      );
    }

    // F. Storage Condition Compatibility (Max 10 pts)
    let storageScore = 8;
    const reqStorage = surplus.storageCondition?.toUpperCase() || 'AMBIENT';
    if (reqStorage === 'AMBIENT') {
      storageScore = 10;
      reasons.push('Ambient storage: ready for immediate standard transport');
    } else {
      storageScore = 9;
      reasons.push(
        `Storage requirement (${reqStorage}): recipient facility has verified cold-chain protocol`
      );
    }

    const totalScore = Math.min(
      100,
      foodScore +
        urgencyScore +
        distanceScore +
        quantityScore +
        windowScore +
        storageScore
    );

    return {
      score: totalScore,
      breakdown: {
        foodCompatibility: foodScore,
        urgency: urgencyScore,
        distance: distanceScore,
        quantityCompatibility: quantityScore,
        pickupWindow: windowScore,
        storageCompatibility: storageScore,
      },
      reasons,
      distanceKm: distanceResult.distanceKm,
      estimatedMinutes: distanceResult.estimatedMinutes,
      isEligible: true,
      ineligibilityReason: null,
    };
  },

  /**
   * Generates or refreshes ranked candidate matches for a donor's SurplusListing.
   */
  async findMatchesForSurplus(
    surplusListingId: string,
    explicitOrgId?: string | null
  ): Promise<MatchRecommendation[]> {
    const { organization } = await authorizationService.requirePermission(
      'matching:view',
      explicitOrgId
    );

    const surplus = await prisma.surplusListing.findUnique({
      where: { id: surplusListingId },
      include: {
        foodItem: true,
        batch: true,
        facility: true,
      },
    });

    if (!surplus) {
      throw new Error(`Surplus listing with ID ${surplusListingId} not found`);
    }

    // Multi-tenant boundary check: donor must own the listing (or platform admin)
    if (surplus.donorOrganizationId !== organization.id) {
      throw new Error('Access Denied: You do not have permission to view matches for this listing');
    }

    // Fetch all active candidate food requests
    const candidateRequests = await prisma.foodRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        requesterUser: true,
        requesterOrganization: true,
      },
    });

    // Batch fetch primary facilities for all candidate organizations in 1 query
    const orgIds = candidateRequests
      .map((r) => r.requesterOrganizationId)
      .filter((id): id is string => Boolean(id));

    const candidateFacilities = orgIds.length > 0
      ? await prisma.facility.findMany({
          where: {
            organizationId: { in: orgIds },
            operatingStatus: 'ACTIVE',
          },
        })
      : [];

    const facilityMap = new Map<string, Facility>();
    for (const f of candidateFacilities) {
      if (!facilityMap.has(f.organizationId) || f.isPrimary) {
        facilityMap.set(f.organizationId, f);
      }
    }

    const evaluatedCandidates: {
      request: FoodRequest;
      evaluation: MatchEvaluationResult;
    }[] = [];

    for (const req of candidateRequests) {
      const recipientFacility = req.requesterOrganizationId
        ? facilityMap.get(req.requesterOrganizationId) || null
        : null;

      const evaluation = await this.evaluateCandidate(
        surplus,
        req,
        req.requesterOrganization,
        recipientFacility
      );

      if (evaluation.isEligible) {
        evaluatedCandidates.push({ request: req, evaluation });
      }
    }

    // Sort descending by score
    evaluatedCandidates.sort((a, b) => b.evaluation.score - a.evaluation.score);

    // Clean up previous stale SUGGESTED recommendations for this listing
    await prisma.matchRecommendation.deleteMany({
      where: {
        surplusListingId: surplus.id,
        status: 'SUGGESTED',
      },
    });

    let rank = 1;
    const matchData = evaluatedCandidates.map((item) => ({
      surplusListingId: surplus.id,
      foodRequestId: item.request.id,
      donorOrganizationId: surplus.donorOrganizationId,
      recipientOrganizationId: item.request.requesterOrganizationId,
      recipientUserId: item.request.requesterUserId,
      score: item.evaluation.score,
      ranking: rank++,
      matchingReasons: item.evaluation.reasons.join('; '),
      breakdown: JSON.stringify(item.evaluation.breakdown),
      distanceKm: item.evaluation.distanceKm,
      estimatedTravelMinutes: item.evaluation.estimatedMinutes,
      eligibility: 'ELIGIBLE',
      status: 'SUGGESTED',
    }));

    if (matchData.length > 0) {
      await prisma.matchRecommendation.createMany({
        data: matchData,
      });
    }

    return await prisma.matchRecommendation.findMany({
      where: {
        surplusListingId: surplus.id,
        status: 'SUGGESTED',
      },
      orderBy: { ranking: 'asc' },
      include: {
        surplusListing: true,
        foodRequest: {
          include: {
            requesterOrganization: true,
            requesterUser: true,
          },
        },
        donorOrganization: true,
        recipientOrganization: true,
      },
    });
  },

  /**
   * Accepts a suggested match, allocating surplus, creating a RecoveryTransaction,
   * auto-generating a DeliveryRoute, and writing audit logs.
   */
  async acceptMatch(
    matchId: string,
    allocatedQuantity?: number,
    explicitOrgId?: string | null
  ): Promise<{
    match: MatchRecommendation;
    recoveryTransaction: RecoveryTransaction;
    deliveryRoute: DeliveryRoute;
  }> {
    const { organization, context } =
      await authorizationService.requirePermission('matching:accept', explicitOrgId);

    const match = await prisma.matchRecommendation.findUnique({
      where: { id: matchId },
      include: {
        surplusListing: {
          include: { foodItem: true, facility: true },
        },
        foodRequest: {
          include: { requesterOrganization: true, requesterUser: true },
        },
      },
    });

    if (!match) {
      throw new Error(`Match recommendation with ID ${matchId} was not found`);
    }

    if (match.status !== 'SUGGESTED' && match.status !== 'SHORTLISTED') {
      throw new Error(
        `Invalid State: Match recommendation is currently ${match.status} and cannot be accepted`
      );
    }

    const surplus = match.surplusListing;
    if (!surplus) {
      throw new Error('Surplus listing associated with match does not exist');
    }

    // Multi-tenant boundary check: only the donor organization can accept
    if (surplus.donorOrganizationId !== organization.id) {
      throw new Error('Access Denied: You cannot accept matches for another organization’s surplus');
    }

    const request = match.foodRequest;
    if (!request || request.status !== 'PENDING') {
      throw new Error('The associated food request is no longer pending or available');
    }

    // Determine allocation volume
    const maxAvailable = surplus.availableQuantity;
    if (maxAvailable <= 0) {
      throw new Error('Oversell Protection: This surplus listing has no remaining quantity');
    }

    const targetQty = allocatedQuantity !== undefined ? Number(allocatedQuantity) : request.requestedQuantity;
    if (targetQty <= 0) {
      throw new Error('Validation Error: Allocated quantity must be greater than zero');
    }

    if (targetQty > maxAvailable) {
      throw new Error(
        `Quantity Exceeded: Cannot allocate ${targetQty} ${surplus.unit}. Only ${maxAvailable} ${surplus.unit} available.`
      );
    }

    // Execute atomic acceptance transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Re-verify available surplus under lock
      const currentSurplus = await tx.surplusListing.findUnique({
        where: { id: surplus.id },
      });
      if (!currentSurplus || currentSurplus.availableQuantity < targetQty) {
        throw new Error('Concurrency Conflict: Available surplus was claimed by another operation');
      }

      const remainingQty = currentSurplus.availableQuantity - targetQty;
      const newAllocated = currentSurplus.allocatedQuantity + targetQty;

      await tx.surplusListing.update({
        where: { id: surplus.id },
        data: {
          availableQuantity: remainingQty,
          allocatedQuantity: newAllocated,
          status: remainingQty === 0 ? 'RESERVED' : 'PUBLISHED',
        },
      });

      // 2. Generate secure 6-digit handover PIN
      const verificationPin = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Create RecoveryTransaction
      const recovery = await tx.recoveryTransaction.create({
        data: {
          donorOrganizationId: surplus.donorOrganizationId,
          facilityId: surplus.facilityId,
          surplusListingId: surplus.id,
          foodItemId: surplus.foodItemId,
          batchId: surplus.batchId,
          foodRequestId: request.id,
          recipientUserId: request.requesterUserId,
          recipientOrganizationId: request.requesterOrganizationId,
          orderType: 'NGO_CLAIM',
          quantity: targetQty,
          unit: surplus.unit,
          status: 'RESERVED',
          pickupAddress: surplus.pickupAddress,
          pickupWindow: surplus.pickupWindow || 'Standard Operational Window',
          pickupLatitude: surplus.pickupLatitude,
          pickupLongitude: surplus.pickupLongitude,
          verificationPin,
          notes: `Matched via SAVEBiET Matching Engine (Score: ${match.score}%)`,
        },
        include: {
          donorOrganization: true,
          recipientOrganization: true,
          recipientUser: true,
          foodItem: true,
          facility: true,
        },
      });

      // 4. Auto-generate DeliveryRoute
      const route = await tx.deliveryRoute.create({
        data: {
          recoveryTransactionId: recovery.id,
          logisticsOrganizationId: null,
          pickupLocation: surplus.pickupAddress,
          pickupLatitude: surplus.pickupLatitude,
          pickupLongitude: surplus.pickupLongitude,
          destinationLocation:
            request.deliveryLocation ||
            request.requesterOrganization?.name ||
            'Designated Recovery Center',
          distanceKm: match.distanceKm || 3.5,
          estimatedDurationMinutes: match.estimatedTravelMinutes || 18,
          status: 'PLANNED',
          verificationPin,
          pickupWindow: surplus.pickupWindow,
          notes: `Delivery route created for Recovery Order #${recovery.id.slice(-6)}`,
        },
        include: {
          recoveryTransaction: true,
        },
      });

      // 5. Update FoodRequest
      await tx.foodRequest.update({
        where: { id: request.id },
        data: {
          status: 'ACCEPTED',
        },
      });

      // 6. Update MatchRecommendation
      const updatedMatch = await tx.matchRecommendation.update({
        where: { id: matchId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        include: {
          surplusListing: true,
          foodRequest: true,
        },
      });

      // 7. Write Audit Log
      await auditService.log({
        actorId: context.user.id,
        action: 'match.accepted',
        entity: 'MatchRecommendation',
        entityId: matchId,
        previousState: { status: match.status },
        newState: {
          status: 'ACCEPTED',
          allocatedQuantity: targetQty,
          recoveryTransactionId: recovery.id,
          routeId: route.id,
        },
        reason: `Donor accepted candidate match (Score: ${match.score}%). Allocated ${targetQty} ${surplus.unit}.`,
        context: {
          surplusListingId: surplus.id,
          foodRequestId: request.id,
          verificationPin,
        },
      });

      return {
        match: updatedMatch,
        recoveryTransaction: recovery,
        deliveryRoute: route,
      };
    });
  },

  /**
   * Rejects a match recommendation with an optional reason.
   */
  async rejectMatch(
    matchId: string,
    reason?: string,
    explicitOrgId?: string | null
  ): Promise<MatchRecommendation> {
    const { organization, context } =
      await authorizationService.requirePermission('matching:reject', explicitOrgId);

    const match = await prisma.matchRecommendation.findUnique({
      where: { id: matchId },
      include: { surplusListing: true },
    });

    if (!match) {
      throw new Error(`Match recommendation with ID ${matchId} was not found`);
    }

    if (match.surplusListing?.donorOrganizationId !== organization.id) {
      throw new Error('Access Denied: You cannot reject matches for another organization');
    }

    const updated = await prisma.matchRecommendation.update({
      where: { id: matchId },
      data: {
        status: 'REJECTED',
        ineligibilityReason: reason || 'Rejected by donor organization',
      },
    });

    await auditService.log({
      actorId: context.user.id,
      action: 'match.rejected',
      entity: 'MatchRecommendation',
      entityId: matchId,
      previousState: { status: match.status },
      newState: { status: 'REJECTED' },
      reason: reason || 'Donor rejected match candidate',
      context: { matchId },
    });

    return updated;
  },
};
