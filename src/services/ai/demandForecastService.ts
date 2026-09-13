// ==============================================
// SaveByte — Demand Forecasting Engine (Phase 5)
// ==============================================
//
// Answers: "What will demand look like?"
// Uses hybrid architecture:
// 1. Deterministic baseline: Weighted moving average + day-of-week seasonality + active requests
// 2. Data sufficiency gating (explicit labeling if < 3 data points)
// 3. AI provider explanation refinement
//
// Grounded strictly in operational data (InventoryTransaction, FoodBatch, FoodRequest).
//

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { DemandForecast } from '@/types';
import { getAIProvider } from './aiProvider';
import { analyticsService } from '../analyticsService';

export const DemandForecastSchema = z.object({
  predictedQuantity: z.number().nonnegative(),
  confidence: z.number().min(0).max(100),
  trend: z.string(),
  explanation: z.string(),
});

export interface DemandForecastInput {
  organizationId: string;
  facilityId?: string | null;
  foodCategory?: string;
  targetDate?: Date | string;
}

export const demandForecastService = {
  /**
   * Generates demand forecast for an organization and food category.
   */
  async forecastDemand(input: DemandForecastInput): Promise<DemandForecast> {
    const { organizationId, facilityId } = input;
    const foodCategory = input.foodCategory || 'PREPARED_MEALS';
    const targetDate = input.targetDate ? new Date(input.targetDate) : new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow

    // 1. Gather historical operational analytics for the last 30 days
    const analytics = await analyticsService.getOperationalAnalytics({
      organizationId,
      facilityId,
      category: foodCategory,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });

    // 2. Extract consumption time-series points where consumption > 0
    const consumptionPoints = analytics.dailyTimeSeries
      .filter(d => d.consumed > 0)
      .map(d => ({
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        consumed: d.consumed,
      }));

    // If zero consumption recorded from ledger, fall back to production data points
    const activeDataPoints = consumptionPoints.length > 0
      ? consumptionPoints
      : analytics.dailyTimeSeries
          .filter(d => d.produced > 0)
          .map(d => ({
            date: d.date,
            dayOfWeek: d.dayOfWeek,
            consumed: d.produced * 0.88, // heuristic for production without consumption
          }));

    const historicalDataPointsCount = activeDataPoints.length;
    const isLimitedData = historicalDataPointsCount < 3;

    // 3. Calculate Weighted Moving Average
    let baselineDemand = 0;
    if (historicalDataPointsCount === 0) {
      baselineDemand = 100; // default simulation seed if absolutely zero history
    } else {
      let weightSum = 0;
      let weightedTotal = 0;
      // Reverse order: most recent get highest weight
      const reversed = [...activeDataPoints].reverse();
      reversed.forEach((pt, idx) => {
        const weight = Math.max(1, 10 - idx); // linear decay weight
        weightedTotal += pt.consumed * weight;
        weightSum += weight;
      });
      baselineDemand = weightSum > 0 ? weightedTotal / weightSum : activeDataPoints[0].consumed;
    }

    // 4. Day-of-week seasonality adjustment
    const targetDayOfWeek = targetDate.getDay();
    const sameDayPoints = activeDataPoints.filter(pt => pt.dayOfWeek === targetDayOfWeek);
    let seasonalityMultiplier = 1.0;

    if (sameDayPoints.length > 0 && activeDataPoints.length >= 7) {
      const avgAll = activeDataPoints.reduce((sum, p) => sum + p.consumed, 0) / activeDataPoints.length;
      const avgSameDay = sameDayPoints.reduce((sum, p) => sum + p.consumed, 0) / sameDayPoints.length;
      if (avgAll > 0) {
        seasonalityMultiplier = Math.min(1.4, Math.max(0.7, avgSameDay / avgAll));
      }
    } else {
      // Weekend bump default for food services if not enough history
      if (targetDayOfWeek === 0 || targetDayOfWeek === 6) {
        seasonalityMultiplier = 1.08;
      }
    }

    // 5. Active food request demand adjustment
    const pendingRequests = await prisma.foodRequest.findMany({
      where: {
        status: 'PENDING',
        foodCategory,
      },
    });
    const pendingRequestQuantity = pendingRequests.reduce((sum, r) => sum + r.requestedQuantity, 0);
    const requestAdjustment = pendingRequestQuantity > 0 ? Math.min(pendingRequestQuantity * 0.3, baselineDemand * 0.2) : 0;

    const rawPredicted = (baselineDemand * seasonalityMultiplier) + requestAdjustment;
    const predictedQuantity = Math.round(rawPredicted);

    // 6. Calculate Confidence
    let confidence: number;
    if (historicalDataPointsCount >= 14) {
      confidence = Math.min(94, 85 + Math.round(historicalDataPointsCount * 0.4));
    } else if (historicalDataPointsCount >= 7) {
      confidence = 74 + Math.round((historicalDataPointsCount - 7) * 1.5);
    } else if (historicalDataPointsCount >= 3) {
      confidence = 54 + Math.round((historicalDataPointsCount - 3) * 4);
    } else {
      confidence = 35 + Math.round(historicalDataPointsCount * 5);
    }

    // 7. Trend Calculation
    let trend = 'Stable demand';
    if (activeDataPoints.length >= 4) {
      const recent4 = activeDataPoints.slice(-4);
      const earlier = activeDataPoints.slice(0, -4);
      if (earlier.length > 0) {
        const recentAvg = recent4.reduce((s, p) => s + p.consumed, 0) / recent4.length;
        const earlierAvg = earlier.reduce((s, p) => s + p.consumed, 0) / earlier.length;
        if (earlierAvg > 0) {
          const deltaPct = Math.round(((recentAvg - earlierAvg) / earlierAvg) * 100);
          trend = deltaPct >= 0 ? `+${deltaPct}% versus recent baseline` : `${deltaPct}% versus recent baseline`;
        }
      }
    }

    // 8. Grounded Explanation
    let deterministicExplanation: string;
    let dataLabel: 'Measured historical data' | 'Limited historical data' | 'Simulation / estimate';

    if (isLimitedData) {
      dataLabel = historicalDataPointsCount === 0 ? 'Simulation / estimate' : 'Limited historical data';
      deterministicExplanation = `Estimate based on ${historicalDataPointsCount} operating records. Additional operating history is required to reach high predictive confidence.`;
    } else {
      dataLabel = 'Measured historical data';
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDayOfWeek];
      deterministicExplanation = `Demand projected at ${predictedQuantity} ${analytics.primaryUnit} based on weighted analysis of ${historicalDataPointsCount} operating days with ${dayName} consumption weighting (${Math.round((seasonalityMultiplier - 1) * 100)}% shift).`;
    }

    // 9. AI Explanation Refinement (Optional)
    const provider = getAIProvider();
    let finalExplanation = deterministicExplanation;

    if (provider.name !== 'deterministic_baseline') {
      try {
        const aiPrompt = `Explain this demand forecast in one clear, professional sentence for kitchen management:\nCategory: ${foodCategory}\nPredicted: ${predictedQuantity} ${analytics.primaryUnit}\nHistorical Days: ${historicalDataPointsCount}\nTrend: ${trend}\nSeasonality: ${seasonalityMultiplier.toFixed(2)}`;
        finalExplanation = await provider.generateExplanation(
          'You are SAVEBiET AI Demand Analyst. Summarize the operational demand reason concisely.',
          aiPrompt,
          deterministicExplanation
        );
      } catch {
        finalExplanation = deterministicExplanation;
      }
    }

    return {
      organizationId,
      facilityId: facilityId || null,
      forecastDate: targetDate.toISOString(),
      foodCategory,
      predictedQuantity,
      unit: analytics.primaryUnit,
      confidence,
      historicalDataPoints: historicalDataPointsCount,
      trend,
      explanation: finalExplanation,
      isLimitedData,
      dataLabel,
      generatedAt: new Date().toISOString(),
    };
  },
};
