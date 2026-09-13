// ==============================================
// SaveByte — Central Operational Analytics Service
// ==============================================
//
// Single source of truth for historical operational metrics.
// Aggregates:
// - total produced / consumed / surplus / recovered / wasted
// - recovery rate & waste rate
// - average surplus size & recovery cycle time
// - expiry events, delivery delays & matching success rates
// - category breakdowns and day-by-day time-series
//
// Enforces strict tenant isolation.
// Reusable foundation for Phase 5 AI, Phase 6 Automation, Phase 8 Leaderboard, Phase 10 Digital Twin, Phase 11 ESG.
//

import { prisma } from '@/lib/db';

export interface AnalyticsFilterOptions {
  organizationId: string;
  facilityId?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  category?: string | null;
}

export interface CategoryMetricSummary {
  category: string;
  produced: number;
  consumed: number;
  surplus: number;
  recovered: number;
  wasted: number;
  unit: string;
  recoveryRate: number;
  wasteRate: number;
}

export interface DailyMetricPoint {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  produced: number;
  consumed: number;
  surplus: number;
  recovered: number;
  wasted: number;
}

export interface OperationalAnalyticsResult {
  organizationId: string;
  facilityId: string | null;
  periodStart: Date;
  periodEnd: Date;
  daysCovered: number;
  totalProduced: number;
  totalConsumed: number;
  totalSurplus: number;
  totalRecovered: number;
  totalWasted: number;
  primaryUnit: string;
  recoveryRate: number; // percentage
  wasteRate: number; // percentage
  averageSurplus: number;
  averageTimeToRecoveryHours: number;
  expiryEventsCount: number;
  deliveryDelaysCount: number;
  matchingSuccessRate: number; // percentage
  categoryBreakdown: CategoryMetricSummary[];
  dailyTimeSeries: DailyMetricPoint[];
  hasSufficientData: boolean;
  dataPointsCount: number;
}

export const analyticsService = {
  /**
   * Aggregates comprehensive operational metrics for an organization across a time window.
   */
  async getOperationalAnalytics(filters: AnalyticsFilterOptions): Promise<OperationalAnalyticsResult> {
    const { organizationId, facilityId, category } = filters;

    const periodEnd = filters.endDate ? new Date(filters.endDate) : new Date();
    const periodStart = filters.startDate
      ? new Date(filters.startDate)
      : new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days

    const daysCovered = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)));

    // 1. Fetch Food Batches
    const batchWhere: Record<string, any> = {
      organizationId,
      createdAt: { gte: periodStart, lte: periodEnd },
    };
    if (facilityId) batchWhere.facilityId = facilityId;

    const batches = await prisma.foodBatch.findMany({
      where: batchWhere,
      include: { foodItem: true },
    });

    // 2. Fetch Inventory Transactions (Ledger)
    const txWhere: Record<string, any> = {
      organizationId,
      createdAt: { gte: periodStart, lte: periodEnd },
    };
    if (facilityId) txWhere.facilityId = facilityId;

    const transactions = await prisma.inventoryTransaction.findMany({
      where: txWhere,
      include: { foodItem: true },
    });

    // 3. Fetch Surplus Listings
    const surplusWhere: Record<string, any> = {
      donorOrganizationId: organizationId,
      createdAt: { gte: periodStart, lte: periodEnd },
    };
    if (facilityId) surplusWhere.facilityId = facilityId;

    const surplusListings = await prisma.surplusListing.findMany({
      where: surplusWhere,
      include: { foodItem: true },
    });

    // 4. Fetch Recovery Transactions
    const recoveryWhere: Record<string, any> = {
      donorOrganizationId: organizationId,
      createdAt: { gte: periodStart, lte: periodEnd },
    };
    if (facilityId) recoveryWhere.facilityId = facilityId;

    const recoveries = await prisma.recoveryTransaction.findMany({
      where: recoveryWhere,
      include: { foodItem: true, deliveryRoute: true },
    });

    // 5. Fetch Match Recommendations
    const matchWhere: Record<string, any> = {
      donorOrganizationId: organizationId,
      createdAt: { gte: periodStart, lte: periodEnd },
    };

    const matches = await prisma.matchRecommendation.findMany({
      where: matchWhere,
    });

    // Filter by category if requested
    const filteredBatches = category ? batches.filter(b => b.foodItem?.category === category) : batches;
    const filteredTransactions = category ? transactions.filter(t => t.foodItem?.category === category) : transactions;
    const filteredSurplus = category ? surplusListings.filter(s => s.foodItem?.category === category) : surplusListings;
    const filteredRecoveries = category ? recoveries.filter(r => r.foodItem?.category === category) : recoveries;

    // Metric Calculations
    let totalProduced = 0;
    let totalConsumed = 0;
    let totalWastedFromLedger = 0;

    for (const tx of filteredTransactions) {
      if (tx.type === 'PRODUCED') {
        totalProduced += tx.quantity;
      } else if (tx.type === 'CONSUMED') {
        totalConsumed += tx.quantity;
      } else if (tx.type === 'DISPOSED' || tx.type === 'WASTED') {
        totalWastedFromLedger += tx.quantity;
      }
    }

    // Fallback: If ledger has no explicit PRODUCED entries, sum initial quantities of batches
    if (totalProduced === 0 && filteredBatches.length > 0) {
      totalProduced = filteredBatches.reduce((acc, b) => acc + b.initialQuantity, 0);
    }

    const totalSurplus = filteredSurplus.reduce((acc, s) => acc + s.totalQuantity, 0);
    const completedRecoveries = filteredRecoveries.filter(r => r.status === 'COMPLETED');
    const totalRecovered = completedRecoveries.reduce((acc, r) => acc + r.quantity, 0);

    // Calculate unrecovered expired batches/listings as waste
    const now = new Date();
    let expiredBatchWaste = 0;
    let expiryEventsCount = 0;

    for (const batch of filteredBatches) {
      const isExpired = new Date(batch.expiresAt).getTime() <= now.getTime();
      if (isExpired || batch.status === 'EXPIRED') {
        expiryEventsCount++;
        if (batch.currentQuantity > 0) {
          expiredBatchWaste += batch.currentQuantity;
        }
      }
    }

    // Unclaimed surplus that reached availableUntil or expired
    for (const surplus of filteredSurplus) {
      const isWindowPassed = new Date(surplus.availableUntil).getTime() <= now.getTime();
      if ((isWindowPassed || surplus.status === 'EXPIRED') && surplus.availableQuantity > 0) {
        if (expiredBatchWaste === 0) {
          expiredBatchWaste += surplus.availableQuantity;
        }
      }
    }

    const totalWasted = Number((totalWastedFromLedger + expiredBatchWaste).toFixed(1));
    const recoveryRate = totalSurplus > 0 ? Number(((totalRecovered / totalSurplus) * 100).toFixed(1)) : 0;
    const wasteRate = totalProduced > 0 ? Number(((totalWasted / totalProduced) * 100).toFixed(1)) : 0;
    const averageSurplus = filteredSurplus.length > 0 ? Number((totalSurplus / filteredSurplus.length).toFixed(1)) : 0;

    // Average Recovery Cycle Time (Hours from listing creation to completed handover)
    let totalRecoveryHours = 0;
    let recoveriesWithDuration = 0;

    for (const rec of completedRecoveries) {
      if (rec.completedAt && rec.createdAt) {
        const diffMs = new Date(rec.completedAt).getTime() - new Date(rec.createdAt).getTime();
        if (diffMs > 0) {
          totalRecoveryHours += diffMs / (1000 * 60 * 60);
          recoveriesWithDuration++;
        }
      }
    }
    const averageTimeToRecoveryHours =
      recoveriesWithDuration > 0 ? Number((totalRecoveryHours / recoveriesWithDuration).toFixed(1)) : 0;

    // Delivery delays check
    let deliveryDelaysCount = 0;
    for (const rec of filteredRecoveries) {
      if (rec.deliveryRoute) {
        const route = rec.deliveryRoute;
        if (route.status === 'DELIVERED' && route.startedAt && route.deliveredAt) {
          const actualMinutes = (new Date(route.deliveredAt).getTime() - new Date(route.startedAt).getTime()) / (1000 * 60);
          if (route.estimatedDurationMinutes > 0 && actualMinutes > route.estimatedDurationMinutes * 1.3) {
            deliveryDelaysCount++;
          }
        }
      }
    }

    // Matching Success Rate
    const acceptedMatchesCount = matches.filter(m => m.status === 'ACCEPTED').length;
    const matchingSuccessRate = matches.length > 0 ? Number(((acceptedMatchesCount / matches.length) * 100).toFixed(1)) : 0;

    // Category Breakdown
    const categoryMap = new Map<string, { produced: number; consumed: number; surplus: number; recovered: number; wasted: number; unit: string }>();

    for (const b of filteredBatches) {
      const cat = b.foodItem?.category || 'OTHER';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { produced: 0, consumed: 0, surplus: 0, recovered: 0, wasted: 0, unit: b.unit });
      }
      const entry = categoryMap.get(cat)!;
      entry.produced += b.initialQuantity;
    }

    for (const tx of filteredTransactions) {
      const cat = tx.foodItem?.category || 'OTHER';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { produced: 0, consumed: 0, surplus: 0, recovered: 0, wasted: 0, unit: tx.unit });
      }
      const entry = categoryMap.get(cat)!;
      if (tx.type === 'CONSUMED') entry.consumed += tx.quantity;
      if (tx.type === 'DISPOSED' || tx.type === 'WASTED') entry.wasted += tx.quantity;
    }

    for (const s of filteredSurplus) {
      const cat = s.foodItem?.category || 'OTHER';
      if (categoryMap.has(cat)) {
        categoryMap.get(cat)!.surplus += s.totalQuantity;
      }
    }

    for (const r of completedRecoveries) {
      const cat = r.foodItem?.category || 'OTHER';
      if (categoryMap.has(cat)) {
        categoryMap.get(cat)!.recovered += r.quantity;
      }
    }

    const categoryBreakdown: CategoryMetricSummary[] = Array.from(categoryMap.entries()).map(([cat, data]) => ({
      category: cat,
      produced: Number(data.produced.toFixed(1)),
      consumed: Number(data.consumed.toFixed(1)),
      surplus: Number(data.surplus.toFixed(1)),
      recovered: Number(data.recovered.toFixed(1)),
      wasted: Number(data.wasted.toFixed(1)),
      unit: data.unit,
      recoveryRate: data.surplus > 0 ? Number(((data.recovered / data.surplus) * 100).toFixed(1)) : 0,
      wasteRate: data.produced > 0 ? Number(((data.wasted / data.produced) * 100).toFixed(1)) : 0,
    }));

    // Daily Time-Series Map
    const dailyMap = new Map<string, DailyMetricPoint>();

    // Pre-populate days in window
    for (let d = new Date(periodStart); d <= periodEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        dayOfWeek: d.getDay(),
        produced: 0,
        consumed: 0,
        surplus: 0,
        recovered: 0,
        wasted: 0,
      });
    }

    for (const tx of filteredTransactions) {
      const dateStr = new Date(tx.createdAt).toISOString().split('T')[0];
      const point = dailyMap.get(dateStr);
      if (point) {
        if (tx.type === 'PRODUCED') point.produced += tx.quantity;
        if (tx.type === 'CONSUMED') point.consumed += tx.quantity;
        if (tx.type === 'DISPOSED' || tx.type === 'WASTED') point.wasted += tx.quantity;
      }
    }

    for (const s of filteredSurplus) {
      const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
      const point = dailyMap.get(dateStr);
      if (point) point.surplus += s.totalQuantity;
    }

    for (const r of completedRecoveries) {
      const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
      const point = dailyMap.get(dateStr);
      if (point) point.recovered += r.quantity;
    }

    const dailyTimeSeries = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Data sufficiency calculation
    const activeOperatingDays = dailyTimeSeries.filter(d => d.produced > 0 || d.consumed > 0 || d.surplus > 0).length;
    const dataPointsCount = activeOperatingDays;
    const hasSufficientData = activeOperatingDays >= 3;

    return {
      organizationId,
      facilityId: facilityId || null,
      periodStart,
      periodEnd,
      daysCovered,
      totalProduced: Number(totalProduced.toFixed(1)),
      totalConsumed: Number(totalConsumed.toFixed(1)),
      totalSurplus: Number(totalSurplus.toFixed(1)),
      totalRecovered: Number(totalRecovered.toFixed(1)),
      totalWasted,
      primaryUnit: filteredBatches[0]?.unit || filteredTransactions[0]?.unit || 'kg',
      recoveryRate,
      wasteRate,
      averageSurplus,
      averageTimeToRecoveryHours,
      expiryEventsCount,
      deliveryDelaysCount,
      matchingSuccessRate,
      categoryBreakdown,
      dailyTimeSeries,
      hasSufficientData,
      dataPointsCount,
    };
  },
};
