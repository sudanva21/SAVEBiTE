// ==============================================
// SaveByte — Surplus Prediction Engine (Phase 5)
// ==============================================
//
// Answers: "How much surplus is likely to be generated?"
// Compares:
// - Predicted Demand
// - Planned / Expected Production
// - Usable On-Hand Inventory
//
// Classifies Risk Levels: LOW | MEDIUM | HIGH | CRITICAL
// Generates grounded operational explanations and mitigation steps.
//

import { prisma } from '@/lib/db';
import { SurplusPrediction, SurplusRiskLevel } from '@/types';
import { demandForecastService } from './demandForecastService';
import { getAIProvider } from './aiProvider';

export interface SurplusPredictionInput {
  organizationId: string;
  facilityId?: string | null;
  foodCategory?: string;
  expectedProduction?: number;
  predictionDate?: Date | string;
}

export const surplusPredictionService = {
  /**
   * Predicts operational surplus risk for an organization.
   */
  async predictSurplus(input: SurplusPredictionInput): Promise<SurplusPrediction> {
    const { organizationId, facilityId } = input;
    const foodCategory = input.foodCategory || 'PREPARED_MEALS';
    const predictionDate = input.predictionDate ? new Date(input.predictionDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 1. Get Demand Forecast
    const forecast = await demandForecastService.forecastDemand({
      organizationId,
      facilityId,
      foodCategory,
      targetDate: predictionDate,
    });
    const predictedDemand = forecast.predictedQuantity;

    // 2. Determine Expected Production
    let expectedProduction = input.expectedProduction;
    if (expectedProduction === undefined || expectedProduction === null) {
      // Find latest batch in this category as baseline production target
      const latestBatch = await prisma.foodBatch.findFirst({
        where: {
          organizationId,
          ...(facilityId ? { facilityId } : {}),
        },
        include: { foodItem: true },
        orderBy: { createdAt: 'desc' },
      });
      expectedProduction = latestBatch?.initialQuantity || Math.round(predictedDemand * 1.15);
    }

    // 3. Compute Current Usable On-Hand Inventory
    const activeBatches = await prisma.foodBatch.findMany({
      where: {
        organizationId,
        ...(facilityId ? { facilityId } : {}),
        status: 'ACTIVE',
        currentQuantity: { gt: 0 },
        expiresAt: { gt: new Date() },
      },
      include: { foodItem: true },
    });

    const categoryBatches = activeBatches.filter(b => b.foodItem?.category === foodCategory);
    const currentInventory = categoryBatches.reduce((sum, b) => sum + b.currentQuantity, 0);

    // 4. Calculate Predicted Surplus
    // Surplus is generated when planned production exceeds predicted demand
    const productionDiff = expectedProduction - predictedDemand;
    const predictedSurplus = Math.max(0, productionDiff);
    const surplusPercentage = predictedDemand > 0 && productionDiff > 0
      ? Math.round((productionDiff / predictedDemand) * 100)
      : 0;

    // 5. Determine Risk Level
    let riskLevel: SurplusRiskLevel;
    if (surplusPercentage >= 25) {
      riskLevel = 'CRITICAL';
    } else if (surplusPercentage >= 15) {
      riskLevel = 'HIGH';
    } else if (surplusPercentage >= 5) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // 6. Formulate Explainable Grounded Explanation
    let explanation: string;
    if (predictedSurplus === 0) {
      explanation = `Planned production of ${expectedProduction} ${forecast.unit} matches or falls below forecast demand (${predictedDemand} ${forecast.unit}). Surplus risk is minimal.`;
    } else {
      const diff = expectedProduction - predictedDemand;
      if (diff > 0) {
        explanation = `Production is currently ${surplusPercentage}% above predicted demand (${predictedDemand} ${forecast.unit}). Expected surplus is approximately ${predictedSurplus} ${forecast.unit}.`;
      } else {
        explanation = `Existing inventory of ${currentInventory} ${forecast.unit} combined with planned production creates an estimated ${predictedSurplus} ${forecast.unit} surplus buffer over forecast demand.`;
      }
    }

    // 7. Formulate Actionable Recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      const suggestedAdjustment = Math.round(predictedSurplus * 0.7);
      recommendations.push(`Reduce planned kitchen production by ~${suggestedAdjustment} ${forecast.unit} to align with expected demand.`);
      recommendations.push('Pre-notify verified local NGOs in the matching queue of potential surplus.');
      recommendations.push('Configure a 3-hour expedited pickup window on the surplus marketplace.');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push(`Monitor morning demand pace; prepare to adjust subsequent batches.`);
      recommendations.push('Designate cold storage space for secondary distribution.');
    } else {
      recommendations.push('Current production plan is well-calibrated to forecast demand.');
      recommendations.push('Maintain standard inventory logging and quality checks.');
    }

    // 8. Optional AI Provider Explanation Refinement
    const provider = getAIProvider();
    let finalExplanation = explanation;

    if (provider.name !== 'deterministic_baseline') {
      try {
        const prompt = `Provide a concise, 1-sentence operational summary of this surplus prediction:\nCategory: ${foodCategory}\nProduction: ${expectedProduction} ${forecast.unit}\nForecast Demand: ${predictedDemand} ${forecast.unit}\nSurplus: ${predictedSurplus} ${forecast.unit} (${surplusPercentage}%)\nRisk: ${riskLevel}`;
        finalExplanation = await provider.generateExplanation(
          'You are SAVEBiET AI Surplus Risk Analyst. Be factual and direct.',
          prompt,
          explanation
        );
      } catch {
        finalExplanation = explanation;
      }
    }

    return {
      organizationId,
      facilityId: facilityId || null,
      predictionDate: predictionDate.toISOString(),
      foodCategory,
      expectedProduction,
      predictedDemand,
      currentInventory,
      predictedSurplus,
      surplusPercentage,
      unit: forecast.unit,
      riskLevel,
      confidence: forecast.confidence,
      explanation: finalExplanation,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  },
};
