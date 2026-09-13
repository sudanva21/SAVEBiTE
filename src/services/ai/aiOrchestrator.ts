// ==============================================
// SaveByte — AI Intelligence Orchestrator (Phase 5)
// ==============================================
//
// Central coordinator for SaveByte AI Intelligence:
// 1. Coordinates Demand Forecasting, Surplus Prediction, Expiry Urgency, Waste Analysis,
//    Production Recommendations, and Comprehensive Audit Reports.
// 2. Intelligent Caching Layer using AIInsight model and SHA-256 input hashing.
// 3. Strict Multi-Tenant Isolation (Server-side validation, Org A cannot inspect Org B).
// 4. Immutable Audit Trail Logging on AI generation events.
// 5. Automatic Fallback Management (never crashes when AI provider fails).
//

import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { auditService } from '../auditService';
import { analyticsService } from '../analyticsService';
import { demandForecastService } from './demandForecastService';
import { surplusPredictionService } from './surplusPredictionService';
import { expiryIntelligenceService } from './expiryIntelligenceService';
import { wasteAnalysisService } from './wasteAnalysisService';
import { productionRecommendationService } from './productionRecommendationService';
import { getAIProvider } from './aiProvider';
import {
  DemandForecast,
  SurplusPrediction,
  WasteAnalysis,
  ProductionRecommendation,
  AIAuditReport,
  AIOverview,
  RecoveryPriorityItem,
} from '@/types';

function computeInputHash(params: Record<string, unknown>): string {
  const sortedKeys = Object.keys(params).sort();
  const normalized = sortedKeys.reduce((acc, k) => {
    acc[k] = params[k];
    return acc;
  }, {} as Record<string, unknown>);
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

export const aiOrchestrator = {
  /**
   * Retrieves or computes a cached Demand Forecast.
   */
  async getDemandForecast(
    organizationId: string,
    facilityId?: string | null,
    foodCategory?: string,
    targetDate?: Date | string,
    forceFresh = false
  ): Promise<DemandForecast> {
    const category = foodCategory || 'PREPARED_MEALS';
    const dateStr = targetDate ? new Date(targetDate).toISOString().split('T')[0] : 'tomorrow';
    const inputHash = computeInputHash({ organizationId, facilityId: facilityId || null, category, dateStr });

    const now = new Date();

    if (!forceFresh) {
      const cached = await prisma.aiInsight.findFirst({
        where: {
          organizationId,
          type: 'DEMAND_FORECAST',
          inputHash,
          expiresAt: { gt: now },
        },
        orderBy: { generatedAt: 'desc' },
      });

      if (cached) {
        try {
          return JSON.parse(cached.result) as DemandForecast;
        } catch {
          // invalid cache, recompute
        }
      }
    }

    const forecast = await demandForecastService.forecastDemand({
      organizationId,
      facilityId,
      foodCategory: category,
      targetDate,
    });

    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 min cache
    const provider = getAIProvider();

    await prisma.aiInsight.create({
      data: {
        organizationId,
        facilityId: facilityId || null,
        type: 'DEMAND_FORECAST',
        inputHash,
        result: JSON.stringify(forecast),
        confidence: forecast.confidence,
        provider: provider.name,
        model: provider.name === 'openai' ? 'gpt-4o-mini' : 'analytical-v1',
        generatedAt: now,
        expiresAt,
      },
    });

    await auditService.log({
      action: 'ai.forecast_generated',
      entity: 'AIInsight',
      entityId: `${organizationId}:${category}`,
      reason: 'Generated demand forecast',
      context: {
        organizationId,
        category,
        predictedQuantity: forecast.predictedQuantity,
        confidence: forecast.confidence,
      },
    });

    return forecast;
  },

  /**
   * Retrieves or computes a Surplus Prediction.
   */
  async getSurplusPrediction(
    organizationId: string,
    facilityId?: string | null,
    foodCategory?: string,
    expectedProduction?: number,
    targetDate?: Date | string,
    forceFresh = false
  ): Promise<SurplusPrediction> {
    const category = foodCategory || 'PREPARED_MEALS';
    const inputHash = computeInputHash({
      organizationId,
      facilityId: facilityId || null,
      category,
      expectedProduction: expectedProduction ?? 'auto',
      targetDate: targetDate ? new Date(targetDate).toISOString().split('T')[0] : 'tomorrow',
    });

    const now = new Date();

    if (!forceFresh) {
      const cached = await prisma.aiInsight.findFirst({
        where: {
          organizationId,
          type: 'SURPLUS_PREDICTION',
          inputHash,
          expiresAt: { gt: now },
        },
        orderBy: { generatedAt: 'desc' },
      });

      if (cached) {
        try {
          return JSON.parse(cached.result) as SurplusPrediction;
        } catch {
          // recompute
        }
      }
    }

    const prediction = await surplusPredictionService.predictSurplus({
      organizationId,
      facilityId,
      foodCategory: category,
      expectedProduction,
      predictionDate: targetDate,
    });

    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const provider = getAIProvider();

    await prisma.aiInsight.create({
      data: {
        organizationId,
        facilityId: facilityId || null,
        type: 'SURPLUS_PREDICTION',
        inputHash,
        result: JSON.stringify(prediction),
        confidence: prediction.confidence,
        provider: provider.name,
        model: provider.name === 'openai' ? 'gpt-4o-mini' : 'analytical-v1',
        generatedAt: now,
        expiresAt,
      },
    });

    await auditService.log({
      action: 'ai.surplus_predicted',
      entity: 'AIInsight',
      entityId: `${organizationId}:${category}`,
      reason: 'Generated surplus prediction',
      context: {
        organizationId,
        category,
        riskLevel: prediction.riskLevel,
        predictedSurplus: prediction.predictedSurplus,
      },
    });

    return prediction;
  },

  /**
   * Scans active operational inventory for expiry urgency (real-time, not cached).
   */
  async getExpiryIntelligence(organizationId: string, facilityId?: string | null) {
    return expiryIntelligenceService.scanExpiryUrgency({
      organizationId,
      facilityId,
      includeBatches: true,
      includeSurplus: true,
    });
  },

  /**
   * Evaluates explainable recovery priorities for urgent food.
   */
  async getRecoveryPriority(organizationId: string, facilityId?: string | null): Promise<RecoveryPriorityItem[]> {
    return expiryIntelligenceService.getRecoveryPriorityQueue(organizationId, facilityId);
  },

  /**
   * Retrieves or computes Waste & Root Cause Analysis.
   */
  async getWasteAnalysis(
    organizationId: string,
    facilityId?: string | null,
    periodDays = 30,
    forceFresh = false
  ): Promise<WasteAnalysis> {
    const inputHash = computeInputHash({
      organizationId,
      facilityId: facilityId || null,
      periodDays,
      today: new Date().toISOString().split('T')[0],
    });

    const now = new Date();

    if (!forceFresh) {
      const cached = await prisma.aiInsight.findFirst({
        where: {
          organizationId,
          type: 'WASTE_ANALYSIS',
          inputHash,
          expiresAt: { gt: now },
        },
        orderBy: { generatedAt: 'desc' },
      });

      if (cached) {
        try {
          return JSON.parse(cached.result) as WasteAnalysis;
        } catch {
          // recompute
        }
      }
    }

    const analysis = await wasteAnalysisService.analyzeWaste({
      organizationId,
      facilityId,
      periodDays,
    });

    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour cache
    const provider = getAIProvider();

    await prisma.aiInsight.create({
      data: {
        organizationId,
        facilityId: facilityId || null,
        type: 'WASTE_ANALYSIS',
        inputHash,
        result: JSON.stringify(analysis),
        confidence: analysis.confidence,
        provider: provider.name,
        model: provider.name === 'openai' ? 'gpt-4o-mini' : 'analytical-v1',
        generatedAt: now,
        expiresAt,
      },
    });

    await auditService.log({
      action: 'ai.audit_generated',
      entity: 'AIInsight',
      entityId: `${organizationId}:${periodDays}d`,
      reason: 'Generated waste and root-cause analysis',
      context: {
        organizationId,
        wasteRate: analysis.wasteRate,
        recoveryRate: analysis.recoveryRate,
      },
    });

    return analysis;
  },

  /**
   * Retrieves or computes Production Recommendations.
   */
  async getProductionRecommendation(
    organizationId: string,
    facilityId?: string | null,
    foodCategory?: string,
    currentPlannedProduction?: number,
    targetDate?: Date | string,
    forceFresh = false
  ): Promise<ProductionRecommendation> {
    const category = foodCategory || 'PREPARED_MEALS';
    const inputHash = computeInputHash({
      organizationId,
      facilityId: facilityId || null,
      category,
      currentPlanned: currentPlannedProduction ?? 'auto',
      date: targetDate ? new Date(targetDate).toISOString().split('T')[0] : 'tomorrow',
    });

    const now = new Date();

    if (!forceFresh) {
      const cached = await prisma.aiInsight.findFirst({
        where: {
          organizationId,
          type: 'PRODUCTION_RECOMMENDATION',
          inputHash,
          expiresAt: { gt: now },
        },
        orderBy: { generatedAt: 'desc' },
      });

      if (cached) {
        try {
          return JSON.parse(cached.result) as ProductionRecommendation;
        } catch {
          // recompute
        }
      }
    }

    const recommendation = await productionRecommendationService.getRecommendation({
      organizationId,
      facilityId,
      foodCategory: category,
      currentPlannedProduction,
      targetDate,
    });

    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const provider = getAIProvider();

    await prisma.aiInsight.create({
      data: {
        organizationId,
        facilityId: facilityId || null,
        type: 'PRODUCTION_RECOMMENDATION',
        inputHash,
        result: JSON.stringify(recommendation),
        confidence: recommendation.howConfident,
        provider: provider.name,
        model: provider.name === 'openai' ? 'gpt-4o-mini' : 'analytical-v1',
        generatedAt: now,
        expiresAt,
      },
    });

    await auditService.log({
      action: 'ai.recommendation_generated',
      entity: 'AIInsight',
      entityId: `${organizationId}:${category}`,
      reason: 'Generated production recommendation',
      context: {
        organizationId,
        category,
        percentageChange: recommendation.percentageChange,
        confidence: recommendation.howConfident,
      },
    });

    return recommendation;
  },

  /**
   * Generates a comprehensive AI Operational Audit Report for an organization.
   */
  async generateAIAuditReport(
    organizationId: string,
    facilityId?: string | null,
    periodDays = 30,
    forceFresh = false
  ): Promise<AIAuditReport> {
    const now = new Date();
    const inputHash = computeInputHash({
      organizationId,
      facilityId: facilityId || null,
      periodDays,
      today: now.toISOString().split('T')[0],
    });

    if (!forceFresh) {
      const cached = await prisma.aiInsight.findFirst({
        where: {
          organizationId,
          type: 'AUDIT_REPORT',
          inputHash,
          expiresAt: { gt: now },
        },
        orderBy: { generatedAt: 'desc' },
      });

      if (cached) {
        try {
          return JSON.parse(cached.result) as AIAuditReport;
        } catch {
          // recompute
        }
      }
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    const orgName = org?.name || 'Organization';

    const analytics = await analyticsService.getOperationalAnalytics({
      organizationId,
      facilityId,
      startDate: new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000),
      endDate: now,
    });

    const wasteDiag = await wasteAnalysisService.analyzeWaste({
      organizationId,
      facilityId,
      periodDays,
    });

    const expiryScan = await expiryIntelligenceService.scanExpiryUrgency({
      organizationId,
      facilityId,
    });

    // Compute Daily demand vs production stats
    const dailyWithProduction = analytics.dailyTimeSeries.filter(d => d.produced > 0);
    const avgDailyProd = dailyWithProduction.length > 0
      ? Math.round(dailyWithProduction.reduce((s, d) => s + d.produced, 0) / dailyWithProduction.length)
      : 0;
    const avgDailyDemand = dailyWithProduction.length > 0
      ? Math.round(dailyWithProduction.reduce((s, d) => s + (d.consumed || d.produced * 0.85), 0) / dailyWithProduction.length)
      : 0;

    const overprodDays = dailyWithProduction.filter(d => d.produced > d.consumed && d.consumed > 0).length;
    const underprodDays = dailyWithProduction.filter(d => d.produced < d.consumed && d.consumed > 0).length;

    // Potential impact calculation
    const potentialFoodSavedKg = Math.round(analytics.totalWasted * 0.65);
    const co2eAvoidedKg = Math.round(potentialFoodSavedKg * 2.5); // ~2.5 kg CO2e per kg food saved
    const recoveryRateImprovementPercent = Math.min(30, Math.round((100 - analytics.recoveryRate) * 0.5));

    const aiFindings: string[] = [
      ...wasteDiag.rootCauses,
      `${expiryScan.criticalCount} batch(es) currently require immediate operational action within 2 hours.`,
    ];

    const bottlenecks: string[] = [];
    if (analytics.averageTimeToRecoveryHours > 6) {
      bottlenecks.push(`Average recovery cycle is ${analytics.averageTimeToRecoveryHours} hours. Expediting listing publication can prevent shelf-life decay.`);
    }
    if (analytics.deliveryDelaysCount > 0) {
      bottlenecks.push(`${analytics.deliveryDelaysCount} logistics delivery route buffer exceedances observed.`);
    }
    if (analytics.expiryEventsCount > 0) {
      bottlenecks.push(`${analytics.expiryEventsCount} batches suffered expiration before being claimed.`);
    }
    if (bottlenecks.length === 0) {
      bottlenecks.push('No significant operational bottlenecks detected in the evaluated period.');
    }

    let dataReliability: 'High - Substantial history' | 'Moderate - Standard history' | 'Low - Limited historical data' =
      'Low - Limited historical data';
    if (analytics.dataPointsCount >= 14) dataReliability = 'High - Substantial history';
    else if (analytics.dataPointsCount >= 7) dataReliability = 'Moderate - Standard history';

    const auditReport: AIAuditReport = {
      organizationId,
      organizationName: orgName,
      facilityId: facilityId || null,
      periodLabel: `Last ${periodDays} days`,
      periodDays,
      generatedAt: now.toISOString(),
      executiveSummary: {
        totalFoodProcessed: analytics.totalProduced,
        totalFoodRecovered: analytics.totalRecovered,
        totalRecordedWaste: analytics.totalWasted,
        recoveryRate: analytics.recoveryRate,
        wasteRate: analytics.wasteRate,
        unit: analytics.primaryUnit,
        summaryNarrative: `During the past ${periodDays} days, ${orgName} processed ${analytics.totalProduced} ${analytics.primaryUnit} of food and successfully redistributed ${analytics.totalRecovered} ${analytics.primaryUnit} (${analytics.recoveryRate}% recovery rate). Recorded waste totaled ${analytics.totalWasted} ${analytics.primaryUnit} (${analytics.wasteRate}% waste rate).`,
      },
      demandVsProduction: {
        averageDailyProduction: avgDailyProd,
        averageDailyDemand: avgDailyDemand,
        overproductionDaysCount: overprodDays,
        underproductionDaysCount: underprodDays,
        comparableDaysAnalyzed: dailyWithProduction.length,
      },
      inventoryRisk: {
        batchesAtRisk: expiryScan.criticalCount + expiryScan.urgentCount,
        quantityAtRisk: expiryScan.totalUrgentKg,
        criticalExpiringBatches: expiryScan.criticalCount,
      },
      expiryRisk: {
        expiredUnrecoveredKg: analytics.totalWasted,
        avgTimeBeforeListingHours: analytics.averageTimeToRecoveryHours,
        windowAdherenceRate: Math.max(50, 100 - (analytics.expiryEventsCount * 8)),
      },
      recoveryPerformance: {
        surplusListingsCount: analytics.categoryBreakdown.reduce((sum, c) => sum + (c.surplus > 0 ? 1 : 0), 0),
        successfulRecoveriesCount: analytics.matchingSuccessRate,
        avgHoursToRecovery: analytics.averageTimeToRecoveryHours,
        unclaimedExpiredListings: analytics.expiryEventsCount,
      },
      topWasteCategories: wasteDiag.topWasteCategories,
      operationalBottlenecks: bottlenecks,
      aiFindings,
      recommendations: wasteDiag.recommendations,
      potentialImpact: {
        potentialFoodSavedKg,
        co2eAvoidedKg,
        recoveryRateImprovementPercent,
      },
      confidence: wasteDiag.confidence,
      dataReliability,
    };

    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const provider = getAIProvider();

    await prisma.aiInsight.create({
      data: {
        organizationId,
        facilityId: facilityId || null,
        type: 'AUDIT_REPORT',
        inputHash,
        result: JSON.stringify(auditReport),
        confidence: auditReport.confidence,
        provider: provider.name,
        model: provider.name === 'openai' ? 'gpt-4o-mini' : 'analytical-v1',
        generatedAt: now,
        expiresAt,
      },
    });

    await auditService.log({
      action: 'ai.audit_generated',
      entity: 'AIInsight',
      entityId: `${organizationId}:${periodDays}d`,
      reason: 'Generated comprehensive operational audit report',
      context: {
        organizationId,
        recoveryRate: auditReport.executiveSummary.recoveryRate,
        wasteRate: auditReport.executiveSummary.wasteRate,
        potentialFoodSavedKg,
      },
    });

    return auditReport;
  },

  /**
   * Assembles high-level AI Overview for the main intelligence dashboard.
   */
  async getAIOverview(organizationId: string, facilityId?: string | null): Promise<AIOverview> {
    const provider = getAIProvider();

    const [forecast, surplus, expiryScan, priorityQueue, recommendation, waste] = await Promise.all([
      this.getDemandForecast(organizationId, facilityId, 'PREPARED_MEALS'),
      this.getSurplusPrediction(organizationId, facilityId, 'PREPARED_MEALS'),
      this.getExpiryIntelligence(organizationId, facilityId),
      this.getRecoveryPriority(organizationId, facilityId),
      this.getProductionRecommendation(organizationId, facilityId, 'PREPARED_MEALS'),
      this.getWasteAnalysis(organizationId, facilityId, 14),
    ]);

    const isFallback = provider.name === 'deterministic_baseline';
    const notice = isFallback
      ? 'Deterministic analytical baseline active. Operating independently with zero cloud API dependency.'
      : 'Enhanced with OpenAI generative explanations and natural language synthesis.';

    return {
      demandForecast: forecast,
      surplusPrediction: surplus,
      urgentFoodCount: expiryScan.criticalCount + expiryScan.urgentCount,
      criticalFoodKg: expiryScan.totalUrgentKg,
      recoveryPriorityList: priorityQueue.slice(0, 5),
      topRecommendation: recommendation,
      quickWasteMetrics: {
        recoveryRate: waste.recoveryRate,
        wasteRate: waste.wasteRate,
        topCategory: waste.topWasteCategories[0]?.category || 'None',
      },
      providerStatus: {
        providerName: provider.name,
        modelName: provider.name === 'openai' ? 'gpt-4o-mini' : 'analytical-heuristics-v1',
        isFallback,
        notice,
      },
    };
  },
};
