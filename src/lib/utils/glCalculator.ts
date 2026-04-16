import type {
  NutritionData,
  GlycemicResult,
  ImpactLevel,
  PersonalizedAssessment,
  BloodSugarUnit,
} from "@/types";
import { estimateGIFromIngredients } from "./giLookup";

export function calculateGlycemicResult(
  nutrition: NutritionData,
  ingredients?: string
): GlycemicResult {
  const netCarbs = Math.max(0, nutrition.totalCarbs - nutrition.fiber);
  let estimatedGI = ingredients
    ? estimateGIFromIngredients(ingredients)
    : 55;

  // If sugar data is available, blend it into the GI estimate
  // Sugar (sucrose) has GI ~65, high sugar ratio raises effective GI
  if (nutrition.sugar !== undefined && nutrition.totalCarbs > 0) {
    const sugarRatio = Math.min(nutrition.sugar / nutrition.totalCarbs, 1);
    const sugarGI = 65;
    // Blend: if 100% sugar, GI should be ~65; if 0% sugar, keep ingredient-based GI
    estimatedGI = Math.round(estimatedGI * (1 - sugarRatio * 0.3) + sugarGI * sugarRatio * 0.3);
  }

  const rawGL = (estimatedGI * netCarbs) / 100;

  const fatModifier = Math.min(nutrition.fat * 0.005, 0.2);
  const proteinModifier = Math.min(nutrition.protein * 0.004, 0.15);
  const fiberModifier = Math.min(nutrition.fiber * 0.01, 0.25);
  const totalDampening = Math.min(fatModifier + proteinModifier + fiberModifier, 0.5);

  const adjustedGL = rawGL * (1 - totalDampening);

  const impactScore = Math.min(10, Math.max(0, (adjustedGL / 20) * 10));

  let impactLevel: ImpactLevel;
  if (impactScore <= 3.5) {
    impactLevel = "low";
  } else if (impactScore <= 6.5) {
    impactLevel = "moderate";
  } else {
    impactLevel = "high";
  }

  return {
    estimatedGI,
    netCarbs: Math.round(netCarbs * 10) / 10,
    rawGL: Math.round(rawGL * 10) / 10,
    adjustedGL: Math.round(adjustedGL * 10) / 10,
    impactScore: Math.round(impactScore * 10) / 10,
    impactLevel,
    dampening: {
      fat: Math.round(fatModifier * 1000) / 1000,
      protein: Math.round(proteinModifier * 1000) / 1000,
      fiber: Math.round(fiberModifier * 1000) / 1000,
      total: Math.round(totalDampening * 1000) / 1000,
    },
  };
}

export function convertBloodSugar(
  value: number,
  from: BloodSugarUnit,
  to: BloodSugarUnit
): number {
  if (from === to) return value;
  if (from === "mg/dL" && to === "mmol/L") {
    return Math.round((value / 18.0182) * 10) / 10;
  }
  return Math.round(value * 18.0182);
}

export function getPersonalizedAssessment(
  bloodSugar: number,
  unit: BloodSugarUnit,
  impactLevel: ImpactLevel
): PersonalizedAssessment {
  const bgMgDl =
    unit === "mmol/L" ? convertBloodSugar(bloodSugar, "mmol/L", "mg/dL") : bloodSugar;

  const bgDisplay = `${bloodSugar} ${unit}`;
  let adjustedImpactLevel: ImpactLevel = impactLevel;
  let message: string;
  let caution = false;

  if (bgMgDl > 180) {
    caution = true;
    if (impactLevel === "high") {
      adjustedImpactLevel = "high";
      message =
        `Your blood sugar is at ${bgDisplay}, which is elevated. This food has a high estimated glycemic impact and may cause a significant further increase in blood sugar levels. Consider consulting your healthcare provider before consuming.`;
    } else if (impactLevel === "moderate") {
      adjustedImpactLevel = "high";
      message =
        `Your blood sugar is at ${bgDisplay}, which is elevated. Even though this food has a moderate glycemic impact, it may still contribute to a further rise in your levels. Consider smaller portions or consulting your healthcare provider.`;
    } else {
      adjustedImpactLevel = "moderate";
      message =
        `Your blood sugar is at ${bgDisplay}, which is elevated. This food has a low estimated glycemic impact, so it may cause only a minimal further increase. However, monitoring your levels is still recommended.`;
    }
  } else if (bgMgDl >= 140) {
    if (impactLevel === "high") {
      adjustedImpactLevel = "high";
      message =
        `Your blood sugar is at ${bgDisplay}, which is slightly elevated. This food has a high estimated glycemic impact and may push your levels higher. Consider a lower-impact alternative or a smaller portion.`;
      caution = true;
    } else if (impactLevel === "moderate") {
      message =
        `Your blood sugar is at ${bgDisplay}, which is slightly elevated. This food has a moderate glycemic impact — it may cause a mild increase. Consider pairing with fiber or protein-rich foods.`;
    } else {
      message =
        `Your blood sugar is at ${bgDisplay}, which is slightly elevated. This food has a low estimated glycemic impact, so it is unlikely to cause a significant further increase.`;
    }
  } else {
    if (impactLevel === "high") {
      message =
        `Your blood sugar is at ${bgDisplay}, which is within a normal range. This food has a high estimated glycemic impact and may cause a noticeable rise. Consider portion control.`;
    } else if (impactLevel === "moderate") {
      message =
        `Your blood sugar is at ${bgDisplay}, which is within a normal range. This food has a moderate glycemic impact — it may cause a mild, gradual increase in blood sugar.`;
    } else {
      message =
        `Your blood sugar is at ${bgDisplay}, which is within a normal range. This food has a low estimated glycemic impact and is unlikely to cause a significant increase.`;
    }
  }

  return {
    bloodSugar,
    unit,
    originalImpactLevel: impactLevel,
    adjustedImpactLevel,
    message,
    caution,
  };
}
