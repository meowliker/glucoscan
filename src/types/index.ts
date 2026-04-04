export type ImpactLevel = "low" | "moderate" | "high";

export type BloodSugarUnit = "mg/dL" | "mmol/L";

export interface NutritionData {
  totalCarbs: number;
  fiber: number;
  fat: number;
  protein: number;
  sugar?: number;
  calories?: number;
  servingSize?: string;
}

export interface FoodProduct {
  barcode?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  ingredients?: string;
  nutrition: NutritionData;
  source: "openfoodfacts" | "manual" | "search" | "local";
}

export interface GlycemicResult {
  estimatedGI: number;
  netCarbs: number;
  rawGL: number;
  adjustedGL: number;
  impactScore: number;
  impactLevel: ImpactLevel;
  dampening: {
    fat: number;
    protein: number;
    fiber: number;
    total: number;
  };
}

export interface PersonalizedAssessment {
  bloodSugar: number;
  unit: BloodSugarUnit;
  originalImpactLevel: ImpactLevel;
  adjustedImpactLevel: ImpactLevel;
  message: string;
  caution: boolean;
}

export interface ScanHistoryItem {
  id: string;
  product: FoodProduct;
  result: GlycemicResult;
  assessment?: PersonalizedAssessment;
  timestamp: number;
  date: string;
}

export interface AlternativeFood {
  name: string;
  brand?: string;
  category: string;
  estimatedGL: number;
  impactLevel: ImpactLevel;
  description: string;
  whyBetter: string;
}

export interface AIInsight {
  summary: string;
  recommendation: string;
  loading: boolean;
  error?: string;
}

export interface OnboardingSlide {
  title: string;
  description: string;
  icon: string;
}

export interface UserSettings {
  bloodSugarUnit: BloodSugarUnit;
  onboardingComplete: boolean;
  disclaimerAccepted: boolean;
}
