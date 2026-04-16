"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Droplets,
  Sparkles,
  Bookmark,
  ChevronRight,
  Apple,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TrafficLight from "@/components/ui/TrafficLight";
import Disclaimer from "@/components/ui/Disclaimer";
import { useAppStore } from "@/lib/store/useAppStore";
import { getAIInsight } from "@/lib/api/claudeAI";
import globalFoods from "@/data/globalFoods.json";
import type { ImpactLevel, AIInsight, AlternativeFood } from "@/types";

const IMPACT_LABELS: Record<ImpactLevel, string> = {
  low: "Low Impact",
  moderate: "Moderate Impact",
  high: "High Impact",
};

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  low: "text-status-success",
  moderate: "text-status-warning",
  high: "text-status-error",
};

const ASSESSMENT_BORDER: Record<ImpactLevel, string> = {
  low: "border-l-status-success",
  moderate: "border-l-status-warning",
  high: "border-l-status-error",
};

/**
 * Minimal markdown parser for bold (**text**) and italic (*text*).
 * Returns a React fragment with proper formatting.
 */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split on bold (**...**) and italic (*...*), preserving delimiters
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

// Map product name keywords to food categories for better matching
const CATEGORY_MAP: Record<string, string[]> = {
  Dairy: ["curd", "yogurt", "dahi", "milk", "paneer", "cheese", "butter", "ghee", "cream", "lassi", "chaas", "buttermilk", "whey"],
  Beverages: ["juice", "drink", "cola", "soda", "tea", "coffee", "water", "shake", "smoothie", "aam panna", "nimbu", "sharbat"],
  Biscuits: ["biscuit", "cookie", "cracker", "rusk", "digestive", "marie"],
  Snacks: ["chips", "kurkure", "namkeen", "bhujia", "mixture", "puff", "makhana", "fox nut", "chana", "murukku", "mathri", "khakhra", "papad"],
  Breakfast: ["oats", "oatmeal", "muesli", "cereal", "cornflakes", "poha", "upma", "dosa", "idli", "dalia", "porridge"],
  "Bread & Bakery": ["bread", "roti", "chapati", "naan", "pav", "bun", "cake", "muffin"],
  Sweets: ["rasgulla", "gulab jamun", "barfi", "ladoo", "halwa", "jalebi", "sweet", "mithai", "chikki"],
  "Pasta & Noodles": ["noodle", "maggi", "pasta", "spaghetti", "macaroni", "hakka", "soba", "ramen"],
  Bars: ["bar", "protein bar", "granola bar", "energy bar"],
  Supplement: ["protein", "creatine", "supplement", "whey", "bcaa", "pre-workout", "vitamin"],
};

function inferCategory(productName: string): string {
  const lower = productName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "";
}

function getAlternatives(
  currentLevel: ImpactLevel,
  productName: string,
  productCategory?: string,
  count: number = 3
): AlternativeFood[] {
  const allFoods = globalFoods as AlternativeFood[];
  const nameLower = productName.toLowerCase();
  const nameWords = nameLower.split(/\s+/).filter((w) => w.length > 2);

  // Infer category from product name if not provided
  const inferredCat = productCategory || inferCategory(productName);
  const catLower = inferredCat.toLowerCase();

  // Get the category keywords for matching
  const catKeywords = CATEGORY_MAP[inferredCat] || [];

  const scored = allFoods.map((food) => {
    const foodNameLower = food.name.toLowerCase();
    const foodCatLower = food.category.toLowerCase();
    let relevance = 0;

    // Category match (strongest signal)
    if (catLower && foodCatLower.includes(catLower)) relevance += 15;
    if (catLower && catLower.includes(foodCatLower)) relevance += 15;

    // Check if the food matches any of the inferred category keywords
    catKeywords.forEach((kw) => {
      if (foodNameLower.includes(kw)) relevance += 10;
    });

    // Word overlap with product name
    nameWords.forEach((w) => {
      if (foodNameLower.includes(w)) relevance += 5;
    });

    // Cross-check: does the food name contain keywords from the same category map?
    for (const [, keywords] of Object.entries(CATEGORY_MAP)) {
      const productHasKeyword = keywords.some((kw) => nameLower.includes(kw));
      const foodHasKeyword = keywords.some((kw) => foodNameLower.includes(kw));
      if (productHasKeyword && foodHasKeyword) relevance += 8;
    }

    return { food, relevance };
  });

  // Deduplicate relevance from multiple keyword matches
  scored.sort((a, b) => b.relevance - a.relevance);

  // Get relevant alternatives (relevance > 0), preferring lower impact
  const relevant = scored.filter((s) => s.relevance > 0);

  if (relevant.length >= count) {
    const levelOrder: ImpactLevel[] = ["low", "moderate", "high"];
    relevant.sort((a, b) => {
      const levelDiff = levelOrder.indexOf(a.food.impactLevel) - levelOrder.indexOf(b.food.impactLevel);
      if (levelDiff !== 0) return levelDiff;
      return b.relevance - a.relevance;
    });
    return relevant.slice(0, count).map((s) => s.food);
  }

  // Fallback — same category foods
  const sameCat = allFoods.filter((f) => {
    if (!catLower) return false;
    return f.category.toLowerCase().includes(catLower) || catLower.includes(f.category.toLowerCase());
  });
  if (sameCat.length >= count) {
    const shuffled = [...sameCat].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Last resort — random low-impact foods
  const lowImpact = allFoods.filter((f) => f.impactLevel === "low");
  const shuffled = [...lowImpact].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function ResultPage() {
  const router = useRouter();
  const {
    currentProduct,
    currentResult,
    currentAssessment,
    addToHistory,
  } = useAppStore();

  const [aiInsight, setAiInsight] = useState<AIInsight>({
    summary: "",
    recommendation: "",
    loading: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentProduct || !currentResult) {
      router.replace("/");
    }
  }, [currentProduct, currentResult, router]);

  useEffect(() => {
    if (currentProduct && currentResult) {
      getAIInsight(currentProduct, currentResult).then((insight) => {
        setAiInsight(insight);
      });
    }
  }, [currentProduct, currentResult]);

  const alternatives = useMemo(() => {
    if (!currentResult || !currentProduct) return [];
    return getAlternatives(
      currentResult.impactLevel,
      currentProduct.name,
      undefined,
      3
    );
  }, [currentResult, currentProduct]);

  if (!currentProduct || !currentResult) {
    return null;
  }

  const { nutrition } = currentProduct;
  const netCarbs = currentResult.netCarbs;
  const displayLevel = currentAssessment
    ? currentAssessment.adjustedImpactLevel
    : currentResult.impactLevel;

  const handleSave = () => {
    addToHistory(
      currentProduct,
      currentResult,
      currentAssessment ?? undefined
    );
    setSaved(true);
    setTimeout(() => {
      router.push("/");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-heading-md font-bold text-text-primary">
            Scan Result
          </h1>
        </div>

        {/* Product Info */}
        <div className="text-center mb-6">
          <h2 className="text-heading-lg font-bold text-text-primary">
            {currentProduct.name}
          </h2>
          {currentProduct.brand && (
            <p className="text-body-sm text-text-secondary mt-1">
              {currentProduct.brand}
            </p>
          )}
        </div>

        {/* Product Image */}
        {currentProduct.imageUrl && (
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 rounded-card overflow-hidden border border-border">
              <Image
                src={currentProduct.imageUrl}
                alt={currentProduct.name}
                fill
                className="object-contain"
                sizes="128px"
              />
            </div>
          </div>
        )}

        {/* Traffic Light */}
        <div className="flex flex-col items-center mb-6">
          <TrafficLight
            level={displayLevel}
            score={currentResult.impactScore}
            size="lg"
            animated
          />
          <p
            className={`mt-3 text-body-lg font-semibold ${IMPACT_COLORS[displayLevel]}`}
          >
            {IMPACT_LABELS[displayLevel]}
          </p>
          <p className="text-caption text-text-muted mt-1">
            Estimated Glycemic Impact Score
          </p>
        </div>

        {/* Personalized Assessment */}
        {currentAssessment && (
          <Card
            className={`mb-4 border-l-4 ${
              ASSESSMENT_BORDER[currentAssessment.adjustedImpactLevel]
            }`}
          >
            <div className="flex items-start gap-3">
              <Droplets
                size={20}
                className={`flex-shrink-0 mt-0.5 ${
                  IMPACT_COLORS[currentAssessment.adjustedImpactLevel]
                }`}
              />
              <div>
                <p className="text-body-sm font-semibold text-text-primary mb-1">
                  Personalized Assessment
                </p>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  {currentAssessment.message}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Nutrition Breakdown */}
        <Card className="mb-4">
          <h3 className="text-body-lg font-bold text-text-primary mb-3">
            Nutrition Breakdown
          </h3>
          <p className="text-caption text-text-muted mb-3">
            Per 100g serving (estimated values)
          </p>
          <div className="space-y-2">
            <NutritionRow label="Carbohydrates" value={nutrition.totalCarbs} />
            {nutrition.sugar !== undefined && nutrition.sugar > 0 && (
              <NutritionRow label="Total Sugars" value={nutrition.sugar} />
            )}
            {nutrition.addedSugar !== undefined && nutrition.addedSugar > 0 && (
              <NutritionRow label="Added Sugars" value={nutrition.addedSugar} />
            )}
            <NutritionRow label="Fiber" value={nutrition.fiber} />
            <NutritionRow label="Net Carbs" value={netCarbs} highlight />
            <NutritionRow label="Fat" value={nutrition.fat} />
            <NutritionRow label="Protein" value={nutrition.protein} />
          </div>
        </Card>

        {/* AI Insight */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-accent" />
            <h3 className="text-body-lg font-bold text-text-primary">
              AI Insight
            </h3>
          </div>
          {aiInsight.loading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 size={20} className="text-primary animate-spin" />
              <p className="text-body-sm text-text-secondary">
                Generating insight...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-body-sm text-text-secondary leading-relaxed">
                {renderMarkdown(aiInsight.summary)}
              </p>
              {aiInsight.recommendation && (
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  {renderMarkdown(aiInsight.recommendation)}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Apple size={18} className="text-primary" />
              <h3 className="text-body-lg font-bold text-text-primary">
                {displayLevel === "low"
                  ? "Similar Products You May Like"
                  : "Similar Products with Low Impact"}
              </h3>
            </div>
            <div className="space-y-3">
              {alternatives.map((alt, idx) => (
                <Card key={idx} padding="sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-body-sm font-semibold text-text-primary truncate">
                          {alt.name}
                        </p>
                        <Badge level={alt.impactLevel} size="sm">
                          {IMPACT_LABELS[alt.impactLevel]}
                        </Badge>
                      </div>
                      <p className="text-caption text-text-muted mb-1">
                        Estimated GL: {alt.estimatedGL}
                      </p>
                      <p className="text-caption text-text-secondary leading-relaxed">
                        {alt.whyBetter}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-text-muted flex-shrink-0 ml-2 mt-1"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mb-6">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleSave}
            disabled={saved}
          >
            <Bookmark size={18} className="mr-2" />
            {saved ? "Saved!" : "Save to History"}
          </Button>
        </div>

        {/* Disclaimer */}
        <Disclaimer />
      </div>
    </div>
  );
}

function NutritionRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        highlight
          ? "bg-primary/5 -mx-4 px-4 rounded-button"
          : "border-b border-border last:border-b-0"
      }`}
    >
      <span
        className={`text-body-sm ${
          highlight
            ? "font-semibold text-primary"
            : "text-text-secondary"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-body-sm font-medium ${
          highlight ? "text-primary" : "text-text-primary"
        }`}
      >
        {value.toFixed(1)}g
      </span>
    </div>
  );
}
