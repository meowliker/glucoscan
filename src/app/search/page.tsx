"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, Package, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store/useAppStore";
import { lookupNutritionByName } from "@/lib/api/nutritionAI";
import { searchProductsInDb, savedProductToFoodProduct, type SavedProduct } from "@/lib/db/products";
import { calculateGlycemicResult, getPersonalizedAssessment } from "@/lib/utils/glCalculator";
import globalFoods from "@/data/globalFoods.json";
import type { FoodProduct, AlternativeFood, ImpactLevel } from "@/types";

interface SearchResult {
  type: "local" | "api" | "db";
  product?: FoodProduct;
  localFood?: AlternativeFood;
  savedProduct?: SavedProduct;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const {
    setCurrentProduct,
    setCurrentResult,
    setCurrentAssessment,
    bloodSugar,
    bloodSugarUnit,
    addToHistory,
  } = useAppStore();

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim().toLowerCase();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setHasSearched(true);
      setLoading(true);

      // Search local foods (curated JSON database)
      const localResults: SearchResult[] = (globalFoods as AlternativeFood[])
        .filter((food) => food.name.toLowerCase().includes(trimmed))
        .map((food) => ({ type: "local" as const, localFood: food }));

      setResults(localResults);

      // Search shared products DB (crowd-sourced from prior AI lookups)
      if (trimmed.length > 1) {
        try {
          const dbProducts = await searchProductsInDb(trimmed, 8);
          const dbResults: SearchResult[] = dbProducts.map((savedProduct) => ({
            type: "db" as const,
            savedProduct,
          }));
          setResults([...dbResults, ...localResults]);
        } catch {
          // ignore
        }
      }

      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  const handleLocalFoodTap = (food: AlternativeFood) => {
    const product: FoodProduct = {
      name: food.name,
      nutrition: {
        totalCarbs: food.estimatedGL * 2,
        fiber: 2,
        fat: 3,
        protein: 3,
      },
      source: "local",
    };

    const result = calculateGlycemicResult(product.nutrition);

    let assessment = undefined;
    if (bloodSugar !== null) {
      assessment = getPersonalizedAssessment(
        bloodSugar,
        bloodSugarUnit,
        result.impactLevel
      );
    }

    setCurrentProduct(product);
    setCurrentResult(result);
    setCurrentAssessment(assessment ?? null);
    addToHistory(product, result, assessment);
    router.push("/result");
  };

  const handleApiFoodTap = (product: FoodProduct) => {
    const result = calculateGlycemicResult(
      product.nutrition,
      product.ingredients
    );

    let assessment = undefined;
    if (bloodSugar !== null) {
      assessment = getPersonalizedAssessment(
        bloodSugar,
        bloodSugarUnit,
        result.impactLevel
      );
    }

    setCurrentProduct(product);
    setCurrentResult(result);
    setCurrentAssessment(assessment ?? null);
    addToHistory(product, result, assessment);
    router.push("/result");
  };

  const handleDbProductTap = (saved: SavedProduct) => {
    const product = savedProductToFoodProduct(saved);
    handleApiFoodTap(product);
  };

  const handleAILookup = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setAiLoading(true);
    try {
      const product = await lookupNutritionByName(trimmed);
      if (product) {
        const result = calculateGlycemicResult(
          product.nutrition,
          product.ingredients
        );
        let assessment = undefined;
        if (bloodSugar !== null) {
          assessment = getPersonalizedAssessment(
            bloodSugar,
            bloodSugarUnit,
            result.impactLevel
          );
        }
        setCurrentProduct(product);
        setCurrentResult(result);
        setCurrentAssessment(assessment ?? null);
        addToHistory(product, result, assessment);
        router.push("/result");
      }
    } catch {
      // ignore
    } finally {
      setAiLoading(false);
    }
  };

  const impactLabels: Record<ImpactLevel, string> = {
    low: "Low",
    moderate: "Moderate",
    high: "High",
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-h2 text-text-primary font-bold">Search Food</h1>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a food product..."
            className="w-full h-12 pl-12 pr-4 rounded-button border border-border bg-surface text-text-primary text-body-lg placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* Initial State */}
        {!hasSearched && !query.trim() && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={48} className="text-text-muted mb-4" />
            <p className="text-body-lg text-text-secondary">
              Search for packaged foods by name
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && results.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        )}

        {/* AI Lookup Button — always show when there's a query */}
        {query.trim().length > 1 && (
          <Card className="mb-4 border-primary/20 bg-primary/5" padding="sm">
            <button
              onClick={handleAILookup}
              disabled={aiLoading}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {aiLoading ? (
                  <Loader2 size={20} className="text-primary animate-spin" />
                ) : (
                  <Sparkles size={20} className="text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-body-sm font-semibold text-text-primary">
                  {aiLoading ? "Looking up nutrition..." : `Look up "${query.trim()}" with AI`}
                </p>
                <p className="text-caption text-text-muted">
                  AI-powered nutrition lookup — works for any product worldwide
                </p>
              </div>
            </button>
          </Card>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map((item, idx) => {
              if (item.type === "db" && item.savedProduct) {
                const saved = item.savedProduct;
                return (
                  <Card
                    key={`db-${saved.id}`}
                    padding="sm"
                    onClick={() => handleDbProductTap(saved)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-body-sm font-bold text-text-primary truncate">
                          {saved.name}
                        </p>
                        {saved.brand && (
                          <p className="text-caption text-text-muted truncate">
                            {saved.brand}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-caption font-medium bg-accent/15 text-accent">
                            <Sparkles size={11} /> AI Verified
                          </span>
                          {saved.lookupCount > 1 && (
                            <span className="text-caption text-text-muted">
                              {saved.lookupCount} lookups
                            </span>
                          )}
                        </div>
                      </div>
                      <Package size={18} className="text-text-muted flex-shrink-0" />
                    </div>
                  </Card>
                );
              }

              if (item.type === "local" && item.localFood) {
                const food = item.localFood;
                return (
                  <Card
                    key={`local-${idx}`}
                    padding="sm"
                    onClick={() => handleLocalFoodTap(food)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-body-sm font-bold text-text-primary truncate">
                          {food.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-badge text-caption font-medium bg-primary/10 text-primary">
                            Local
                          </span>
                          <Badge level={food.impactLevel} size="sm">
                            {impactLabels[food.impactLevel]} &middot; GL {food.estimatedGL}
                          </Badge>
                        </div>
                      </div>
                      <Package size={18} className="text-text-muted flex-shrink-0" />
                    </div>
                  </Card>
                );
              }

              if (item.type === "api" && item.product) {
                const product = item.product;
                return (
                  <Card
                    key={`api-${idx}`}
                    padding="sm"
                    onClick={() => handleApiFoodTap(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-body-sm font-bold text-text-primary truncate">
                          {product.name}
                        </p>
                        {product.brand && (
                          <p className="text-caption text-text-muted truncate">
                            {product.brand}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-badge text-caption font-medium bg-gray-100 text-text-secondary">
                            Open Food Facts
                          </span>
                          <span className="text-caption text-text-muted">
                            Tap to analyze
                          </span>
                        </div>
                      </div>
                      <Package size={18} className="text-text-muted flex-shrink-0" />
                    </div>
                  </Card>
                );
              }

              return null;
            })}

            {/* Loading indicator at bottom when API is still fetching */}
            {loading && results.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="text-primary animate-spin mr-2" />
                <span className="text-body-sm text-text-muted">
                  Searching online database...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {hasSearched && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package size={48} className="text-text-muted mb-4" />
            <p className="text-body-lg text-text-secondary mb-2">
              Not found in food databases
            </p>
            <p className="text-body-sm text-text-muted mb-4">
              Use the AI lookup above to get nutrition data for any product
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
