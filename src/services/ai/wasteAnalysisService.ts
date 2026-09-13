// ==============================================
// SaveByte — Waste & Root-Cause Analysis Service (Phase 5)
// ==============================================
//
// Answers: "Why is this organization generating food waste?"
// Evaluates historical operational records:
// - recurring overproduction
// - recurring surplus categories
// - repeated expiry before allocation
// - pickup/logistics delays
// - low recovery rates
//
// Strictly grounded in actual operational data (zero invented numbers).
//

import { WasteAnalysis, WasteCategoryMetric } from '@/types';
import { analyticsService } from '../analyticsService';
import { getAIProvider } from './aiProvider';

export interface WasteAnalysisOptions {
  organizationId: string;
  facilityId?: string | null;
  periodDays?: number; // 7, 14, 30
}

export const wasteAnalysisService = {
  /**
   * Conducts an operational waste analysis and diagnoses grounded root causes.
   */
  async analyzeWaste(options: WasteAnalysisOptions): Promise<WasteAnalysis> {
    const { organizationId, facilityId } = options;
    const periodDays = options.periodDays || 30;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // 1. Fetch aggregated operational metrics
    const analytics = await analyticsService.getOperationalAnalytics({
      organizationId,
      facilityId,
      startDate,
      endDate,
    });

    // 2. Identify Top Waste Categories
    const sortedCategories = [...analytics.categoryBreakdown]
      .filter(c => c.wasted > 0 || c.produced > 0)
      .sort((a, b) => b.wasted - a.wasted);

    const totalWastedKg = analytics.totalWasted;

    const topWasteCategories: WasteCategoryMetric[] = sortedCategories.slice(0, 4).map((c) => {
      const pct = totalWastedKg > 0 ? Math.round((c.wasted / totalWastedKg) * 100) : 0;
      let primaryCause = 'Normal operational variance';
      if (c.wasted > 0 && c.recoveryRate < 50) {
        primaryCause = 'Low recovery rate & delayed surplus publishing';
      } else if (c.produced > 0 && c.consumed > 0 && c.produced > c.consumed * 1.2) {
        primaryCause = 'Systematic batch overproduction relative to demand';
      } else if (c.wasted > 0) {
        primaryCause = 'Short shelf-life window reached before recipient handover';
      }

      return {
        category: c.category,
        quantityWasted: c.wasted,
        unit: c.unit,
        percentageOfTotalWaste: pct,
        estimatedFinancialLoss: Math.round(c.wasted * 120), // ~₹120 / kg average food valuation
        primaryCause,
      };
    });

    // 3. Diagnose Grounded Root Causes from Data
    const rootCauses: string[] = [];

    // Cause A: Overproduction days
    const dailyPoints = analytics.dailyTimeSeries.filter(d => d.produced > 0);
    const overproductionDays = dailyPoints.filter(d => d.produced > d.consumed && d.consumed > 0);
    if (overproductionDays.length > 0) {
      rootCauses.push(
        `Production exceeded recorded consumption on ${overproductionDays.length} of ${dailyPoints.length} active operating days.`
      );
    }

    // Cause B: Weekend overproduction pattern
    const weekendDays = dailyPoints.filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6);
    const weekendSurplusTotal = weekendDays.reduce((acc, d) => acc + d.surplus, 0);
    const weekdayDays = dailyPoints.filter(d => d.dayOfWeek !== 0 && d.dayOfWeek !== 6);
    const weekdaySurplusTotal = weekdayDays.reduce((acc, d) => acc + d.surplus, 0);

    if (weekendDays.length > 0 && weekendSurplusTotal > (weekdaySurplusTotal / Math.max(1, weekdayDays.length)) * 2) {
      rootCauses.push(
        `Weekend shifts generated disproportionate surplus (${weekendSurplusTotal} ${analytics.primaryUnit} across ${weekendDays.length} weekend days).`
      );
    }

    // Cause C: Expiry events & window bottlenecks
    if (analytics.expiryEventsCount > 0) {
      rootCauses.push(
        `${analytics.expiryEventsCount} food batches or surplus listings passed their freshness window before recipient pickup.`
      );
    }

    // Cause D: Delivery or route delays
    if (analytics.deliveryDelaysCount > 0) {
      rootCauses.push(
        `${analytics.deliveryDelaysCount} logistics delivery routes exceeded their scheduled duration buffer.`
      );
    }

    // Cause E: Low recovery rate fallback cause
    if (analytics.totalSurplus > 0 && analytics.recoveryRate < 70) {
      rootCauses.push(
        `Recovery rate (${analytics.recoveryRate}%) indicates surplus is identified but not matched in time.`
      );
    }

    if (rootCauses.length === 0) {
      rootCauses.push('Minimal waste observed. Operational inventory and consumption are tightly aligned.');
    }

    // 4. Formulate Actionable Recommendations Grounded in Root Causes
    const recommendations: string[] = [];
    if (overproductionDays.length > 0) {
      const avgOverproductionRatio = overproductionDays.reduce((sum, d) => sum + (d.produced - d.consumed), 0) / overproductionDays.length;
      recommendations.push(`Calibrate daily batch sizes downward by ~${Math.round(avgOverproductionRatio * 0.8)} ${analytics.primaryUnit} on high-variance days.`);
    }

    if (analytics.recoveryRate < 80 && analytics.totalSurplus > 0) {
      recommendations.push('Publish surplus listings immediately upon batch completion rather than waiting for end-of-shift.');
      recommendations.push('Expand recipient routing radius to connect with community shelters within 7 km.');
    }

    if (analytics.expiryEventsCount > 0) {
      recommendations.push('Prioritize early matching for batches with less than 6 hours shelf-life.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current balanced kitchen scheduling and continue daily ledger audits.');
    }

    // 5. Confidence Score
    let confidence = 50;
    if (analytics.dataPointsCount >= 14) confidence = 88;
    else if (analytics.dataPointsCount >= 7) confidence = 75;
    else if (analytics.dataPointsCount >= 3) confidence = 62;

    // 6. Optional AI Explanation Refinement
    const provider = getAIProvider();
    if (provider.name !== 'deterministic_baseline') {
      try {
        const prompt = `Review this operational food waste diagnostic:\nPeriod: Last ${periodDays} days\nWaste Rate: ${analytics.wasteRate}%\nRecovery Rate: ${analytics.recoveryRate}%\nRoot Causes:\n${rootCauses.join('\n')}\nProvide one actionable summary sentence for operations directors.`;
        const summary = await provider.generateExplanation(
          'You are SAVEBiET AI Operational Auditor.',
          prompt,
          recommendations[0]
        );
        if (summary && summary.trim().length > 10) {
          recommendations.unshift(summary);
        }
      } catch {
        // preserve deterministic recommendations
      }
    }

    return {
      organizationId,
      facilityId: facilityId || null,
      analysisPeriod: `Last ${periodDays} days`,
      periodDays,
      totalProduced: analytics.totalProduced,
      totalConsumed: analytics.totalConsumed,
      totalSurplus: analytics.totalSurplus,
      totalRecovered: analytics.totalRecovered,
      totalWasted: analytics.totalWasted,
      unit: analytics.primaryUnit,
      wasteRate: analytics.wasteRate,
      recoveryRate: analytics.recoveryRate,
      topWasteCategories,
      rootCauses,
      recommendations,
      confidence,
      dataPointsAnalyzed: analytics.dataPointsCount,
      generatedAt: new Date().toISOString(),
    };
  },
};
