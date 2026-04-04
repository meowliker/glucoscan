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
  const estimatedGI = ingredients
    ? estimateGIFromIngredients(ingredients)
    : 55;

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

  let adjustedImpactLevel: ImpactLevel = impactLevel;
  let message: string;
  let caution = false;

  if (bgMgDl > 180) {
    caution = true;
    if (impactLevel === "high") {
      adjustedImpactLevel = "high";
      message =
        "Your current blood sugar reading is elevated. This food has an estimated high glycemic impact. Consider consulting your healthcare provider.";
    } else if (impactLevel === "moderate") {
      adjustedImpactLevel = "high";
      message =
        "Your current blood sugar reading is elevated. Even moderate glycemic impact foods may require extra consideration. Consult your healthcare provider.";
    } else {
      adjustedImpactLevel = "moderate";
      message =
        "Your current blood sugar reading is elevated, but this food has an estimated low glycemic impact based on its nutritional profile.";
    }
  } else if (bgMgDl >= 140) {
    if (impactLevel === "high") {
      adjustedImpactLevel = "high";
      message =
        "Your blood sugar is in an elevated range. This food has an estimated high glycemic impact. Consider consulting your healthcare provider.";
      caution = true;
    } else {
      message =
        "Your current blood sugar reading is within a typical range for this assessment.";
    }
  } else {
    message =
      "Your current blood sugar reading is within a lower range. Standard glycemic thresholds apply for this assessment.";
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
