// ==============================================
// SaveByte — Expiry Intelligence & Recovery Priority Engine (Phase 5)
// ==============================================
//
// Answers: "Which food/batches are becoming urgent?"
// Scans active FoodBatch and SurplusListing records.
//
// Classifies: SAFE | WATCH | URGENT | CRITICAL | EXPIRED
//
// CRITICAL GOVERNANCE RULE:
// This system provides OPERATIONAL EXPIRY URGENCY intelligence based on configured
// time windows and ledger data. It does NOT certify biological or chemical food safety.
//

import { prisma } from '@/lib/db';
import {
  ExpiryItemUrgency,
  ExpiryUrgencyStatus,
  RecoveryPriorityItem,
} from '@/types';

export interface ExpiryScanOptions {
  organizationId: string;
  facilityId?: string | null;
  includeBatches?: boolean;
  includeSurplus?: boolean;
}

const SAFETY_DISCLAIMER =
  'Operational urgency estimate based on recorded preparation times and storage windows. Does not constitute food safety or microbiological certification.';

export const expiryIntelligenceService = {
  /**
   * Evaluates operational expiry urgency for all active food batches and surplus listings.
   */
  async scanExpiryUrgency(options: ExpiryScanOptions): Promise<{
    items: ExpiryItemUrgency[];
    criticalCount: number;
    urgentCount: number;
    watchCount: number;
    safeCount: number;
    expiredCount: number;
    totalUrgentKg: number;
    scannedAt: string;
  }> {
    const { organizationId, facilityId } = options;
    const now = new Date();

    const results: ExpiryItemUrgency[] = [];

    // 1. Scan Batches
    if (options.includeBatches !== false) {
      const batches = await prisma.foodBatch.findMany({
        where: {
          organizationId,
          ...(facilityId ? { facilityId } : {}),
          status: { in: ['ACTIVE', 'PARTIALLY_ALLOCATED', 'EXPIRED'] },
          currentQuantity: { gt: 0 },
        },
        include: { foodItem: true, surplusListings: true },
      });

      for (const b of batches) {
        const expiresAt = new Date(b.expiresAt);
        const diffMs = expiresAt.getTime() - now.getTime();
        const hoursUntilExpiry = Number((diffMs / (1000 * 60 * 60)).toFixed(1));

        let urgency: ExpiryUrgencyStatus;
        let urgencyReason: string;

        if (diffMs <= 0) {
          urgency = 'EXPIRED';
          urgencyReason = `Batch passed shelf-life threshold ${Math.abs(hoursUntilExpiry)} hours ago. Must not be served to humans.`;
        } else if (hoursUntilExpiry < 2) {
          urgency = 'CRITICAL';
          urgencyReason = `Critical: Less than ${Math.max(1, Math.round(hoursUntilExpiry * 60))} minutes remaining in operational window.`;
        } else if (hoursUntilExpiry < 4) {
          urgency = 'URGENT';
          urgencyReason = `Urgent: ${hoursUntilExpiry} hours until operational window closes. Immediate redistribution required.`;
        } else if (hoursUntilExpiry < 12) {
          urgency = 'WATCH';
          urgencyReason = `Watch: ${hoursUntilExpiry} hours remaining. Scheduled for review before end of shift.`;
        } else {
          urgency = 'SAFE';
          urgencyReason = `Safe: ${hoursUntilExpiry} hours remaining in standard storage window.`;
        }

        const hasActiveRecipient = Boolean(b.surplusListings && b.surplusListings.some(s => s.status === 'RESERVED' || s.status === 'COMPLETED'));

        results.push({
          batchId: b.id,
          foodItemId: b.foodItemId,
          foodName: b.foodItem?.name || 'Food Item',
          category: b.foodItem?.category || 'OTHER',
          currentQuantity: b.currentQuantity,
          unit: b.unit,
          expiresAt: expiresAt.toISOString(),
          hoursUntilExpiry,
          urgency,
          urgencyReason,
          suitabilityStatus: b.qualityStatus,
          hasActiveRecipient,
          disclaimer: SAFETY_DISCLAIMER,
        });
      }
    }

    // 2. Scan Surplus Listings
    if (options.includeSurplus !== false) {
      const listings = await prisma.surplusListing.findMany({
        where: {
          donorOrganizationId: organizationId,
          ...(facilityId ? { facilityId } : {}),
          status: { in: ['PUBLISHED', 'RESERVED'] },
          availableQuantity: { gt: 0 },
        },
        include: { foodItem: true, recoveryOrders: true },
      });

      for (const s of listings) {
        // Evaluate based on the earlier of availableUntil and batch/food expiration
        const availableUntil = new Date(s.availableUntil);
        const diffMs = availableUntil.getTime() - now.getTime();
        const hoursUntilExpiry = Number((diffMs / (1000 * 60 * 60)).toFixed(1));

        let urgency: ExpiryUrgencyStatus;
        let urgencyReason: string;

        if (diffMs <= 0) {
          urgency = 'EXPIRED';
          urgencyReason = 'Surplus listing available pickup window has expired.';
        } else if (hoursUntilExpiry < 2) {
          urgency = 'CRITICAL';
          urgencyReason = `Critical: Only ${Math.max(1, Math.round(hoursUntilExpiry * 60))}m remaining for recipient pickup.`;
        } else if (hoursUntilExpiry < 4) {
          urgency = 'URGENT';
          urgencyReason = `Urgent: ${hoursUntilExpiry}h until listing window closes.`;
        } else if (hoursUntilExpiry < 12) {
          urgency = 'WATCH';
          urgencyReason = `Watch: ${hoursUntilExpiry}h left for allocation.`;
        } else {
          urgency = 'SAFE';
          urgencyReason = `Safe: ${hoursUntilExpiry}h remaining on marketplace.`;
        }

        const hasActiveRecipient = Boolean(
          s.recoveryOrders &&
          s.recoveryOrders.some(
            r => r.status === 'RESERVED' || r.status === 'READY_FOR_PICKUP' || r.status === 'PICKUP_ASSIGNED'
          )
        );

        results.push({
          surplusListingId: s.id,
          foodItemId: s.foodItemId,
          foodName: s.foodItem?.name || s.title,
          category: s.foodItem?.category || 'OTHER',
          currentQuantity: s.availableQuantity,
          unit: s.unit,
          expiresAt: s.availableUntil.toISOString(),
          availableUntil: s.availableUntil.toISOString(),
          hoursUntilExpiry,
          urgency,
          urgencyReason,
          suitabilityStatus: s.qualityStatus,
          hasActiveRecipient,
          disclaimer: SAFETY_DISCLAIMER,
        });
      }
    }

    let criticalCount = 0;
    let urgentCount = 0;
    let watchCount = 0;
    let safeCount = 0;
    let expiredCount = 0;
    let totalUrgentKg = 0;

    for (const r of results) {
      if (r.urgency === 'CRITICAL') {
        criticalCount++;
        totalUrgentKg += r.currentQuantity;
      } else if (r.urgency === 'URGENT') {
        urgentCount++;
        totalUrgentKg += r.currentQuantity;
      } else if (r.urgency === 'WATCH') {
        watchCount++;
      } else if (r.urgency === 'SAFE') {
        safeCount++;
      } else if (r.urgency === 'EXPIRED') {
        expiredCount++;
      }
    }

    return {
      items: results.sort((a, b) => a.hoursUntilExpiry - b.hoursUntilExpiry),
      criticalCount,
      urgentCount,
      watchCount,
      safeCount,
      expiredCount,
      totalUrgentKg: Number(totalUrgentKg.toFixed(1)),
      scannedAt: now.toISOString(),
    };
  },

  /**
   * Ranks active surplus food requiring attention via an explainable, multi-factor priority engine.
   *
   * Priority Score (0-100):
   * - Expiry Urgency: up to 50 pts (Critical <2h = 50, Urgent <4h = 35, Watch <12h = 20)
   * - Quantity Impact: up to 20 pts (larger volume = higher priority)
   * - Recipient Absence: up to 20 pts (no active recipient found = +20 pts urgent action required)
   * - Category Sensitivity: up to 10 pts (prepared meals = +10, dairy = +8, bakery = +6)
   */
  async getRecoveryPriorityQueue(organizationId: string, facilityId?: string | null): Promise<RecoveryPriorityItem[]> {
    const scan = await this.scanExpiryUrgency({
      organizationId,
      facilityId,
      includeBatches: true,
      includeSurplus: true,
    });

    // Exclude already expired items from recovery priority queue (they need disposal/biogas, not human recovery)
    const eligibleItems = scan.items.filter(item => item.urgency !== 'EXPIRED');

    const priorityItems: RecoveryPriorityItem[] = eligibleItems.map((item) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Urgency Component (max 50 pts)
      if (item.urgency === 'CRITICAL') {
        score += 50;
        reasons.push(`Expires in less than 2 hours (${Math.max(1, Math.round(item.hoursUntilExpiry * 60))}m left)`);
      } else if (item.urgency === 'URGENT') {
        score += 35;
        reasons.push(`Expires in ${item.hoursUntilExpiry} hours`);
      } else if (item.urgency === 'WATCH') {
        score += 20;
        reasons.push(`Expiry watch window active (${item.hoursUntilExpiry}h left)`);
      } else {
        score += 5;
        reasons.push('Standard freshness window');
      }

      // 2. Quantity Component (max 20 pts)
      const qty = item.currentQuantity;
      if (qty >= 50) {
        score += 20;
        reasons.push(`High impact volume (${qty} ${item.unit})`);
      } else if (qty >= 20) {
        score += 15;
        reasons.push(`Substantial quantity (${qty} ${item.unit})`);
      } else if (qty >= 5) {
        score += 10;
      } else {
        score += 5;
      }

      // 3. Recipient Absence (max 20 pts)
      if (!item.hasActiveRecipient) {
        score += 20;
        reasons.push('No active recipient currently assigned');
      } else {
        score += 5;
        reasons.push('Recipient allocated; awaiting pickup');
      }

      // 4. Category Sensitivity (max 10 pts)
      if (item.category === 'PREPARED_MEALS') {
        score += 10;
        reasons.push('High-perishability cooked food');
      } else if (item.category === 'DAIRY' || item.category === 'BAKERY') {
        score += 8;
        reasons.push('Perishable category');
      } else {
        score += 5;
      }

      const clampedScore = Math.min(100, Math.max(0, score));

      let recommendedAction: string;
      if (clampedScore >= 75) {
        recommendedAction = 'Trigger autonomous recipient matching & send expedited pickup alert';
      } else if (clampedScore >= 50) {
        recommendedAction = 'Publish to NGO recovery queue or discount for secondary purchase';
      } else {
        recommendedAction = 'Monitor batch stock and reserve for standard daily consumption';
      }

      return {
        id: item.surplusListingId || item.batchId || `item_${Math.random()}`,
        priorityRank: 0, // set after sorting
        title: `${item.currentQuantity} ${item.unit} ${item.foodName}`,
        category: item.category,
        quantity: item.currentQuantity,
        unit: item.unit,
        urgency: item.urgency,
        hoursRemaining: item.hoursUntilExpiry,
        activeRecipientFound: item.hasActiveRecipient,
        priorityScore: clampedScore,
        reasons,
        recommendedAction,
      };
    });

    // Rank strictly descending by priority score
    priorityItems.sort((a, b) => b.priorityScore - a.priorityScore);
    priorityItems.forEach((item, idx) => {
      item.priorityRank = idx + 1;
    });

    return priorityItems;
  },
};
