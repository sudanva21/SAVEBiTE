// ==============================================
// SaveByte — Production Recommendation Engine (Phase 5)
// ==============================================
//
// Answers: "What should the organization do differently?"
// Generates bounded, actionable kitchen recommendations with strict explainability:
// 1. WHAT: Target production quantity & delta
// 2. WHY: Core rationale comparing demand forecast to planned production
// 3. BASED ON WHAT: Specific data basis (historical days, category history)
// 4. HOW CONFIDENT: Transparent percentage and confidence tier
// 5. ACTION: Specific operational directive for kitchen staff
// 6. LIMITATIONS: Known boundaries (e.g. holidays, weather volatility)
//
// CRITICAL GOVERNANCE RULE:
// AI recommendations require human approval and NEVER automatically mutate production.
//

import { ProductionRecommendation } from '@/types';
import { demandForecastService } from './demandForecastService';
import { surplusPredictionService } from './surplusPredictionService';
import { getAIProvider } from './aiProvider';

export interface ProductionRecommendationInput {
  organizationId: string;
  facilityId?: string | null;
  foodCategory?: string;
  currentPlannedProduction?: number;
  targetDate?: Date | string;
}

export const productionRecommendationService = {
  /**
   * Generates explainable kitchen production recommendation for upcoming shift.
   */
  async getRecommendation(input: ProductionRecommendationInput): Promise<ProductionRecommendation> {
    const { organizationId, facilityId } = input;
    const foodCategory = input.foodCategory || 'PREPARED_MEALS';
    const targetDate = input.targetDate ? new Date(input.targetDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 1. Forecast Demand
    const forecast = await demandForecastService.forecastDemand({
      organizationId,
      facilityId,
      foodCategory,
      targetDate,
    });

    // 2. Predict Surplus Risk
    const surplus = await surplusPredictionService.predictSurplus({
      organizationId,
      facilityId,
      foodCategory,
      expectedProduction: input.currentPlannedProduction,
      predictionDate: targetDate,
    });

    const currentPlanned = surplus.expectedProduction;
    const predictedDemand = forecast.predictedQuantity;
    const unit = forecast.unit;

    // 3. Calculate Recommended Production Target
    // Kitchens need a small buffer (5-8%) for unexpected walk-ins, but avoid massive overage
    const safetyBuffer = Math.round(predictedDemand * 0.05);
    const recommendedProduction = Math.max(10, predictedDemand + safetyBuffer);
    const productionDelta = recommendedProduction - currentPlanned;
    const percentageChange = currentPlanned > 0 ? Math.round((productionDelta / currentPlanned) * 100) : 0;

    // 4. Populate 6-Part Explainability Contract
    let what: string;
    let why: string;
    let action: string;

    if (percentageChange <= -5) {
      what = `Reduce ${foodCategory.toLowerCase().replace(/_/g, ' ')} production to ~${recommendedProduction} ${unit} (${Math.abs(percentageChange)}% decrease).`;
      why = `Current planned production (${currentPlanned} ${unit}) exceeds forecast demand (${predictedDemand} ${unit}) by approximately ${Math.abs(percentageChange)}%, creating ${surplus.predictedSurplus} ${unit} surplus risk.`;
      action = `Adjust morning kitchen batch prep by producing ~${Math.abs(productionDelta)} fewer ${unit} than planned schedule.`;
    } else if (percentageChange >= 5) {
      what = `Increase ${foodCategory.toLowerCase().replace(/_/g, ' ')} production to ~${recommendedProduction} ${unit} (+${percentageChange}% increase).`;
      why = `Forecast demand (${predictedDemand} ${unit}) exceeds currently planned production (${currentPlanned} ${unit}), risking service shortage.`;
      action = `Schedule an auxiliary prep batch of +${productionDelta} ${unit} before peak lunch service.`;
    } else {
      what = `Maintain planned production of ${currentPlanned} ${unit}.`;
      why = `Planned production (${currentPlanned} ${unit}) is well-balanced with forecast demand (${predictedDemand} ${unit}) plus a standard 5% safety buffer.`;
      action = `Proceed with scheduled batch sizing; log consumption data upon service completion.`;
    }

    const basedOnWhat = `${forecast.historicalDataPoints} historical operating days with ${forecast.foodCategory} consumption patterns and active matching requests.`;

    const howConfident = forecast.confidence;
    const confidenceTier: 'LOW' | 'MEDIUM' | 'HIGH' =
      howConfident >= 80 ? 'HIGH' : howConfident >= 60 ? 'MEDIUM' : 'LOW';

    let limitations = 'Standard operational assumptions apply.';
    if (forecast.isLimitedData) {
      limitations = 'Prediction confidence is reduced because historical operating records are limited (< 3 recorded shifts). Recommendations should be reviewed carefully by the kitchen supervisor.';
    } else {
      limitations = 'Assumes normal weather and traffic conditions without unannounced large private banquets or local public holidays.';
    }

    // 5. Optional AI Provider Polish
    const provider = getAIProvider();
    if (provider.name !== 'deterministic_baseline') {
      try {
        const prompt = `Refine this operational kitchen recommendation into a crisp directive for kitchen managers:\nAction: ${what}\nRationale: ${why}\nTarget: ${recommendedProduction} ${unit}`;
        const polished = await provider.generateExplanation(
          'You are SAVEBiET AI Kitchen Advisor.',
          prompt,
          what
        );
        if (polished && polished.length > 10) {
          what = polished;
        }
      } catch {
        // preserve deterministic output
      }
    }

    return {
      organizationId,
      facilityId: facilityId || null,
      targetDate: targetDate.toISOString(),
      foodCategory,
      currentPlannedProduction: currentPlanned,
      recommendedProduction,
      productionDelta,
      percentageChange,
      unit,
      what,
      why,
      basedOnWhat,
      howConfident,
      confidenceTier,
      action,
      limitations,
      requiresHumanApproval: true,
      generatedAt: new Date().toISOString(),
    };
  },
};
