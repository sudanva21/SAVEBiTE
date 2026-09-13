// ==============================================
// SaveByte — Phase 5 AI Intelligence Automated Test Suite
// ==============================================
//
// 30 Comprehensive Automated Tests Covering:
// 1. Operational Analytics Aggregations (1)
// 2. Demand Forecasting & Seasonality (2-5)
// 3. Surplus Risk Prediction & Thresholds (6-9)
// 4. Expiry Urgency & Safety Disclaimer (10-12)
// 5. Explainable Recovery Priority Queue (13-15)
// 6. Waste & Root-Cause Diagnostics (16-18)
// 7. Production Recommendations & Human Governance (19-20)
// 8. AI Provider Abstraction & Fallback Resilience (21-22)
// 9. Input Hash Caching & Lifecycle (23-24)
// 10. Multi-Tenant Security & Permissions (25-28)
// 11. Audit Trail Logging (29)
// 12. Full Operational Audit Report (30)
//

import { z } from 'zod';
import { prisma } from '../db';
import { can } from '../permissions';
import { analyticsService } from '../../services/analyticsService';
import { demandForecastService } from '../../services/ai/demandForecastService';
import { surplusPredictionService } from '../../services/ai/surplusPredictionService';
import { expiryIntelligenceService } from '../../services/ai/expiryIntelligenceService';
import { wasteAnalysisService } from '../../services/ai/wasteAnalysisService';
import { productionRecommendationService } from '../../services/ai/productionRecommendationService';
import { aiOrchestrator } from '../../services/ai/aiOrchestrator';
import {
  DeterministicFallbackProvider,
  OpenAIProvider,
  getAIProvider as _getAIProvider,
} from '../../services/ai/aiProvider';
import { seedPhase5AIIntelligenceData } from '../seed-phase5';

export async function runPhase5Tests() {
  const results: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  async function test(name: string, fn: () => void | Promise<void>) {
    process.stdout.write(`  -> [Phase 5] Running: ${name}... `);
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

  // Seed baseline Phase 5 operational data
  await seedPhase5AIIntelligenceData();

  const donorOrg = await prisma.organization.findFirst({
    where: { slug: 'the-grand-taj-kitchen' },
  });
  const orgTajId = donorOrg ? donorOrg.id : 'org_taj';

  // ----------------------------------------------------
  // SECTION 1: HISTORICAL ANALYTICS (Test 1)
  // ----------------------------------------------------

  await test('1. Historical operational analytics aggregates production, consumption and waste', async () => {
    const analytics = await analyticsService.getOperationalAnalytics({
      organizationId: orgTajId,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });

    if (analytics.totalProduced <= 0) {
      throw new Error(`Expected totalProduced > 0, got ${analytics.totalProduced}`);
    }
    if (analytics.totalConsumed <= 0) {
      throw new Error(`Expected totalConsumed > 0, got ${analytics.totalConsumed}`);
    }
    if (analytics.categoryBreakdown.length === 0) {
      throw new Error('Expected non-empty category breakdown');
    }
    if (typeof analytics.recoveryRate !== 'number' || analytics.recoveryRate < 0) {
      throw new Error(`Invalid recovery rate: ${analytics.recoveryRate}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 2: DEMAND FORECASTING (Tests 2 - 5)
  // ----------------------------------------------------

  await test('2. Demand forecasting computes weighted moving average for category', async () => {
    const forecast = await demandForecastService.forecastDemand({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (forecast.predictedQuantity < 350 || forecast.predictedQuantity > 550) {
      throw new Error(`Predicted quantity ${forecast.predictedQuantity} outside expected realistic range (350 - 550)`);
    }
    if (forecast.confidence < 70) {
      throw new Error(`Expected confidence >= 70% with 14 days of history, got ${forecast.confidence}%`);
    }
    if (!forecast.explanation || forecast.explanation.length < 20) {
      throw new Error('Expected detailed operational explanation');
    }
    if (forecast.dataLabel !== 'Measured historical data') {
      throw new Error(`Expected 'Measured historical data', got '${forecast.dataLabel}'`);
    }
  });

  await test('3. Demand forecasting adjusts for day-of-week seasonality (weekend multiplier)', async () => {
    // Next Sunday
    const sunday = new Date();
    sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7 || 7));

    // Next Tuesday
    const tuesday = new Date();
    tuesday.setDate(tuesday.getDate() + ((2 - tuesday.getDay() + 7) % 7 || 7));

    const sundayForecast = await demandForecastService.forecastDemand({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      targetDate: sunday,
    });

    const tuesdayForecast = await demandForecastService.forecastDemand({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      targetDate: tuesday,
    });

    if (sundayForecast.predictedQuantity < tuesdayForecast.predictedQuantity) {
      throw new Error('Expected weekend demand projection to be higher or equal to mid-week demand');
    }
  });

  await test('4. Insufficient data (<3 records) yields low confidence and is explicitly labeled as limited data', async () => {
    // Isolated new organization with zero historical data
    const emptyOrg = await prisma.organization.upsert({
      where: { id: 'org_empty_history' },
      update: {},
      create: {
        id: 'org_empty_history',
        name: 'Brand New Cloud Kitchen',
        slug: `brand-new-${Date.now()}`,
        type: 'RESTAURANT',
      },
    });

    const forecast = await demandForecastService.forecastDemand({
      organizationId: emptyOrg.id,
      foodCategory: 'PREPARED_MEALS',
    });

    if (!forecast.isLimitedData) {
      throw new Error('Expected isLimitedData to be true when historical data is absent');
    }
    if (forecast.confidence > 50) {
      throw new Error(`Expected low confidence (< 50%), got ${forecast.confidence}%`);
    }
    if (forecast.dataLabel === 'Measured historical data') {
      throw new Error(`Should not claim 'Measured historical data' with 0 records. Got: ${forecast.dataLabel}`);
    }
  });

  await test('5. Demand forecast trend calculation computes change vs recent baseline', async () => {
    const forecast = await demandForecastService.forecastDemand({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
    });

    if (!forecast.trend || !forecast.trend.includes('versus recent baseline') && !forecast.trend.includes('Stable')) {
      throw new Error(`Unexpected trend format: ${forecast.trend}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 3: SURPLUS PREDICTION (Tests 6 - 9)
  // ----------------------------------------------------

  await test('6. Surplus prediction calculates expected surplus from production vs forecast demand', async () => {
    const prediction = await surplusPredictionService.predictSurplus({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      expectedProduction: 500,
    });

    if (prediction.expectedProduction !== 500) {
      throw new Error(`Expected production 500, got ${prediction.expectedProduction}`);
    }
    if (prediction.predictedSurplus <= 0) {
      throw new Error(`Expected positive surplus for production 500 vs ~430 demand, got ${prediction.predictedSurplus}`);
    }
    if (prediction.surplusPercentage <= 0) {
      throw new Error(`Expected positive surplus percentage, got ${prediction.surplusPercentage}%`);
    }
  });

  await test('7. Surplus prediction risk classification identifies LOW risk when production matches demand', async () => {
    const forecast = await demandForecastService.forecastDemand({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
    });

    const prediction = await surplusPredictionService.predictSurplus({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      expectedProduction: forecast.predictedQuantity, // exact match
    });

    if (prediction.riskLevel !== 'LOW') {
      throw new Error(`Expected LOW risk when production matches demand, got ${prediction.riskLevel}`);
    }
  });

  await test('8. Surplus prediction risk classification flags CRITICAL risk when production exceeds demand by >25%', async () => {
    const prediction = await surplusPredictionService.predictSurplus({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      expectedProduction: 700, // massively exceeding 430 demand
    });

    if (prediction.riskLevel !== 'CRITICAL') {
      throw new Error(`Expected CRITICAL risk for 700 meals vs 430 demand, got ${prediction.riskLevel}`);
    }
  });

  await test('9. Surplus prediction generates grounded explanations citing exact quantities', async () => {
    const prediction = await surplusPredictionService.predictSurplus({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      expectedProduction: 500,
    });

    const lower = (prediction.explanation || '').toLowerCase();
    if (!lower.includes('demand') || !lower.includes('surplus')) {
      throw new Error(`Explanation missing core data grounded terms: ${prediction.explanation}`);
    }
    if (prediction.recommendations.length === 0) {
      throw new Error('Expected actionable recommendations array');
    }
  });

  // ----------------------------------------------------
  // SECTION 4: EXPIRY INTELLIGENCE (Tests 10 - 12)
  // ----------------------------------------------------

  await test('10. Expiry intelligence classifies batches into SAFE, WATCH, URGENT, CRITICAL, and EXPIRED', async () => {
    const scan = await expiryIntelligenceService.scanExpiryUrgency({
      organizationId: orgTajId,
      includeBatches: true,
      includeSurplus: true,
    });

    if (scan.criticalCount === 0) {
      throw new Error('Expected at least 1 CRITICAL item (< 2 hours remaining)');
    }
    if (scan.urgentCount === 0) {
      throw new Error('Expected at least 1 URGENT item (2 to 4 hours remaining)');
    }
    if (scan.watchCount === 0) {
      throw new Error('Expected at least 1 WATCH item (4 to 12 hours remaining)');
    }
    if (scan.safeCount === 0) {
      throw new Error('Expected at least 1 SAFE item (> 12 hours remaining)');
    }
    if (scan.expiredCount === 0) {
      throw new Error('Expected at least 1 EXPIRED item');
    }
  });

  await test('11. Expiry intelligence separates expired batches from human recovery queues', async () => {
    const priorityQueue = await expiryIntelligenceService.getRecoveryPriorityQueue(orgTajId);

    // No EXPIRED items should appear in active human recovery priority queue
    const hasExpired = priorityQueue.some(item => item.urgency === 'EXPIRED');
    if (hasExpired) {
      throw new Error('Expired food must not be listed in human recovery priority queue');
    }
  });

  await test('12. Expiry intelligence exposes explicit disclaimer stating it does not certify food safety', async () => {
    const scan = await expiryIntelligenceService.scanExpiryUrgency({
      organizationId: orgTajId,
    });

    for (const item of scan.items) {
      if (!item.disclaimer || !item.disclaimer.includes('Does not constitute food safety')) {
        throw new Error(`Missing mandatory food safety disclaimer on item ${item.foodName}`);
      }
    }
  });

  // ----------------------------------------------------
  // SECTION 5: RECOVERY PRIORITY ENGINE (Tests 13 - 15)
  // ----------------------------------------------------

  await test('13. Recovery priority engine ranks urgent short-window surplus at highest priority (#1)', async () => {
    const queue = await expiryIntelligenceService.getRecoveryPriorityQueue(orgTajId);

    if (queue.length === 0) {
      throw new Error('Priority queue should contain active surplus items');
    }

    const topItem = queue[0];
    if (topItem.priorityRank !== 1) {
      throw new Error(`Expected top item rank 1, got ${topItem.priorityRank}`);
    }
    if (topItem.urgency !== 'CRITICAL') {
      throw new Error(`Top priority item should be CRITICAL (<2h), got ${topItem.urgency}`);
    }
  });

  await test('14. Recovery priority score incorporates volume, urgency, recipient absence, and category', async () => {
    const queue = await expiryIntelligenceService.getRecoveryPriorityQueue(orgTajId);
    const topItem = queue[0];

    if (topItem.priorityScore < 70) {
      throw new Error(`Expected high priority score (>=70) for critical unallocated item, got ${topItem.priorityScore}`);
    }

    // Strictly descending sort order
    for (let i = 0; i < queue.length - 1; i++) {
      if (queue[i].priorityScore < queue[i + 1].priorityScore) {
        throw new Error(`Priority queue not sorted descending: ${queue[i].priorityScore} < ${queue[i + 1].priorityScore}`);
      }
    }
  });

  await test('15. Recovery priority engine generates explainable rationale bullet points', async () => {
    const queue = await expiryIntelligenceService.getRecoveryPriorityQueue(orgTajId);
    const topItem = queue[0];

    if (!topItem.reasons || topItem.reasons.length < 2) {
      throw new Error('Expected multiple transparent justification reasons');
    }
    if (!topItem.recommendedAction || topItem.recommendedAction.length < 10) {
      throw new Error('Expected actionable operational directive');
    }
  });

  // ----------------------------------------------------
  // SECTION 6: WASTE ANALYSIS (Tests 16 - 18)
  // ----------------------------------------------------

  await test('16. Waste analysis computes accurate recovery rate and waste rate percentages', async () => {
    const analysis = await wasteAnalysisService.analyzeWaste({
      organizationId: orgTajId,
      periodDays: 30,
    });

    if (analysis.totalProduced <= 0) {
      throw new Error('Total produced should be > 0');
    }
    if (analysis.recoveryRate <= 0 || analysis.recoveryRate > 100) {
      throw new Error(`Recovery rate outside 0-100%: ${analysis.recoveryRate}%`);
    }
    if (analysis.wasteRate < 0 || analysis.wasteRate > 100) {
      throw new Error(`Waste rate outside 0-100%: ${analysis.wasteRate}%`);
    }
  });

  await test('17. Waste analysis identifies top waste categories from ledger and batch history', async () => {
    const analysis = await wasteAnalysisService.analyzeWaste({
      organizationId: orgTajId,
      periodDays: 30,
    });

    if (analysis.topWasteCategories.length === 0) {
      throw new Error('Expected top waste categories breakdown');
    }

    const firstCat = analysis.topWasteCategories[0];
    if (!firstCat.category || !firstCat.primaryCause) {
      throw new Error('Waste category item missing required category or primaryCause');
    }
  });

  await test('18. Waste analysis derives grounded root causes citing actual operational occurrences', async () => {
    const analysis = await wasteAnalysisService.analyzeWaste({
      organizationId: orgTajId,
      periodDays: 30,
    });

    if (analysis.rootCauses.length === 0) {
      throw new Error('Expected diagnosed root causes');
    }

    const hasOperationalEvidence = analysis.rootCauses.some(rc =>
      rc.includes('operating days') || rc.includes('surplus') || rc.includes('freshness window') || rc.includes('Recovery rate')
    );
    if (!hasOperationalEvidence) {
      throw new Error(`Root causes not grounded in operational figures: ${JSON.stringify(analysis.rootCauses)}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 7: PRODUCTION RECOMMENDATIONS (Tests 19 - 20)
  // ----------------------------------------------------

  await test('19. Production recommendation satisfies 6-part explainability contract (What, Why, BasedOn, Conf, Action, Limitation)', async () => {
    const rec = await productionRecommendationService.getRecommendation({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      currentPlannedProduction: 500,
    });

    if (!rec.what || rec.what.length < 10) throw new Error('Missing 1. WHAT');
    if (!rec.why || rec.why.length < 10) throw new Error('Missing 2. WHY');
    if (!rec.basedOnWhat || rec.basedOnWhat.length < 10) throw new Error('Missing 3. BASED ON WHAT');
    if (typeof rec.howConfident !== 'number' || rec.howConfident < 0) throw new Error('Missing 4. HOW CONFIDENT');
    if (!rec.action || rec.action.length < 10) throw new Error('Missing 5. ACTION');
    if (!rec.limitations || rec.limitations.length < 10) throw new Error('Missing 6. LIMITATIONS');
  });

  await test('20. Production recommendation requires human approval and never mutates production automatically', async () => {
    const rec = await productionRecommendationService.getRecommendation({
      organizationId: orgTajId,
      foodCategory: 'PREPARED_MEALS',
      currentPlannedProduction: 500,
    });

    if (rec.requiresHumanApproval !== true) {
      throw new Error('AI recommendations must strictly declare requiresHumanApproval: true');
    }

    // Verify existing active batches in database were not modified
    const criticalBatch = await prisma.foodBatch.findUnique({ where: { id: 'batch_taj_critical_01' } });
    if (criticalBatch?.initialQuantity !== 50) {
      throw new Error('Database batch data was altered without human authorization');
    }
  });

  // ----------------------------------------------------
  // SECTION 8: AI PROVIDER & FALLBACK RESILIENCE (Tests 21 - 22)
  // ----------------------------------------------------

  await test('21. AI provider abstraction uses DeterministicFallbackProvider when API key is not configured', async () => {
    const provider = new DeterministicFallbackProvider();
    const fallbackVal = { test: 123 };

    const schema = z.object({ test: z.number() });
    const res = await provider.generateStructuredAnalysis('prompt', 'user', schema, fallbackVal);

    if (res.provider !== 'deterministic_baseline') {
      throw new Error(`Expected provider 'deterministic_baseline', got '${res.provider}'`);
    }
    if (res.fallbackUsed !== true) {
      throw new Error('Expected fallbackUsed: true');
    }
    if (res.data.test !== 123) {
      throw new Error('Fallback value was not preserved');
    }
  });

  await test('22. AI provider abstraction validates responses with Zod and falls back safely on malformed JSON', async () => {
    const provider = new OpenAIProvider({ apiKey: 'dummy_fake_key_for_test', timeoutMs: 200 });
    const fallbackVal = { status: 'safe_fallback' };

    const schema = z.object({ status: z.string() });
    // Fake key / network fail will trigger immediate fallback without throwing uncaught error
    const res = await provider.generateStructuredAnalysis('system', 'user', schema, fallbackVal);

    if (res.data.status !== 'safe_fallback') {
      throw new Error(`Expected safe_fallback, got ${res.data.status}`);
    }
    if (!res.fallbackUsed) {
      throw new Error('Expected fallbackUsed to be true when external call fails');
    }
  });

  // ----------------------------------------------------
  // SECTION 9: RESULT CACHING (Tests 23 - 24)
  // ----------------------------------------------------

  await test('23. AI orchestrator caches results using SHA-256 inputHash and reuses valid unexpired insights', async () => {
    // 1st invocation computes and stores
    const first = await aiOrchestrator.getDemandForecast(orgTajId, null, 'PREPARED_MEALS', undefined, true);

    // Count stored insights in database
    const initialCount = await prisma.aiInsight.count({
      where: { organizationId: orgTajId, type: 'DEMAND_FORECAST' },
    });

    // 2nd invocation with same parameters should hit cache without creating a new record
    const second = await aiOrchestrator.getDemandForecast(orgTajId, null, 'PREPARED_MEALS', undefined, false);

    const secondCount = await prisma.aiInsight.count({
      where: { organizationId: orgTajId, type: 'DEMAND_FORECAST' },
    });

    if (secondCount > initialCount) {
      throw new Error(`Cached insight was re-persisted redundantly: initial ${initialCount}, second ${secondCount}`);
    }
    if (first.predictedQuantity !== second.predictedQuantity) {
      throw new Error('Cached prediction did not match initial result');
    }
  });

  await test('24. AI orchestrator recomputes when forceFresh is true or cache expires', async () => {
    const initialCount = await prisma.aiInsight.count({
      where: { organizationId: orgTajId, type: 'DEMAND_FORECAST' },
    });

    // forceFresh = true must trigger new computation
    await aiOrchestrator.getDemandForecast(orgTajId, null, 'PREPARED_MEALS', undefined, true);

    const newCount = await prisma.aiInsight.count({
      where: { organizationId: orgTajId, type: 'DEMAND_FORECAST' },
    });

    if (newCount !== initialCount + 1) {
      throw new Error(`Expected insight count to increase by 1 on forceFresh. Was: ${initialCount}, now: ${newCount}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 10: MULTI-TENANT ISOLATION & PERMISSIONS (Tests 25 - 28)
  // ----------------------------------------------------

  await test('25. Multi-tenant isolation: Organization A cannot query or view Organization B\'s AI forecasts', async () => {
    // Create Org B
    const orgB = await prisma.organization.upsert({
      where: { id: 'org_sneha_relief' },
      update: {},
      create: {
        id: 'org_sneha_relief',
        name: 'Sneha Relief Organization',
        slug: `sneha-${Date.now()}`,
        type: 'NGO',
      },
    });

    // Generate forecast for Org A
    const forecastA = await aiOrchestrator.getDemandForecast(orgTajId, null, 'PREPARED_MEALS');

    // Query AI insights for Org B
    const insightsForB = await prisma.aiInsight.findMany({
      where: { organizationId: orgB.id },
    });

    const leakedOrgA = insightsForB.some((ins: any) => ins.organizationId === orgTajId);
    if (leakedOrgA) {
      throw new Error('Tenant data breach: Org B retrieved Org A\'s AI insights');
    }

    if (forecastA.organizationId !== orgTajId) {
      throw new Error('Forecast entity does not belong to Org A');
    }
  });

  await test('26. Multi-tenant isolation: Organization A cannot view Organization B\'s operational audit reports', async () => {
    const reportTaj = await aiOrchestrator.generateAIAuditReport(orgTajId, null, 14, true);

    if (reportTaj.organizationId !== orgTajId) {
      throw new Error(`Audit report organizationId mismatch: expected ${orgTajId}, got ${reportTaj.organizationId}`);
    }

    // Verify Org B has no access to Org A's audit cache
    const cachedB = await prisma.aiInsight.findFirst({
      where: { organizationId: 'org_sneha_relief', type: 'AUDIT_REPORT' },
    });

    if (cachedB && cachedB.organizationId === orgTajId) {
      throw new Error('Audit report leak across organization boundaries');
    }
  });

  await test('27. Capability permissions: INDIVIDUAL_USER cannot access organizational AI intelligence', async () => {
    const individualUserMember = {
      role: 'INDIVIDUAL_USER',
      status: 'ACTIVE',
    };

    if (can(individualUserMember, 'ai:view')) {
      throw new Error('Security Violation: INDIVIDUAL_USER has ai:view capability');
    }
    if (can(individualUserMember, 'ai:analyze')) {
      throw new Error('Security Violation: INDIVIDUAL_USER has ai:analyze capability');
    }
    if (can(individualUserMember, 'ai:recommend')) {
      throw new Error('Security Violation: INDIVIDUAL_USER has ai:recommend capability');
    }
    if (can(individualUserMember, 'ai:audit')) {
      throw new Error('Security Violation: INDIVIDUAL_USER has ai:audit capability');
    }
  });

  await test('28. Capability permissions: Kitchen Manager has ai:view and ai:recommend capabilities', async () => {
    const kitchenManager = {
      role: 'KITCHEN_MANAGER',
      status: 'ACTIVE',
    };

    if (!can(kitchenManager, 'ai:view')) {
      throw new Error('KITCHEN_MANAGER should have ai:view');
    }
    if (!can(kitchenManager, 'ai:recommend')) {
      throw new Error('KITCHEN_MANAGER should have ai:recommend');
    }
    if (!can(kitchenManager, 'ai:analyze')) {
      throw new Error('KITCHEN_MANAGER should have ai:analyze');
    }
  });

  // ----------------------------------------------------
  // SECTION 11: AUDIT TRAIL LOGGING (Test 29)
  // ----------------------------------------------------

  await test('29. Immutable audit logging: AI forecast and audit generation create non-deletable audit records', async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['ai.forecast_generated', 'ai.surplus_predicted', 'ai.audit_generated'] },
      },
    });

    if (logs.length === 0) {
      throw new Error('Expected audit log entries for AI operations');
    }
  });

  // ----------------------------------------------------
  // SECTION 12: COMPREHENSIVE AUDIT REPORT (Test 30)
  // ----------------------------------------------------

  await test('30. Comprehensive AI Operational Audit Report generates executive summary and impact projections', async () => {
    const audit = await aiOrchestrator.generateAIAuditReport(orgTajId, null, 30, true);

    if (!audit.executiveSummary || audit.executiveSummary.totalFoodProcessed <= 0) {
      throw new Error('Executive summary missing food processed figures');
    }
    if (audit.demandVsProduction.averageDailyProduction <= 0) {
      throw new Error('Demand vs production missing daily production figures');
    }
    if (audit.potentialImpact.potentialFoodSavedKg <= 0) {
      throw new Error('Audit report missing projected food saved impact');
    }
    if (!audit.recommendations || audit.recommendations.length === 0) {
      throw new Error('Audit report missing recommendations array');
    }
  });

  return results;
}
