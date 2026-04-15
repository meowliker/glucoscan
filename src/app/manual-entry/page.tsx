"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  calculateGlycemicResult,
  getPersonalizedAssessment,
} from "@/lib/utils/glCalculator";
import type { FoodProduct } from "@/types";

export default function ManualEntryPage() {
  const router = useRouter();
  const {
    setCurrentProduct,
    setCurrentResult,
    setCurrentAssessment,
    bloodSugar,
    bloodSugarUnit,
    addToHistory,
  } = useAppStore();

  const [foodName, setFoodName] = useState("");
  const [totalCarbs, setTotalCarbs] = useState("");
  const [fiber, setFiber] = useState("");
  const [fat, setFat] = useState("");
  const [protein, setProtein] = useState("");
  const [sugar, setSugar] = useState("");
  const [ingredients, setIngredients] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!foodName.trim()) {
      newErrors.foodName = "Food name is required";
    }

    const carbsValue = parseFloat(totalCarbs);
    if (!totalCarbs.trim()) {
      newErrors.totalCarbs = "Total carbohydrates is required";
    } else if (isNaN(carbsValue) || carbsValue <= 0) {
      newErrors.totalCarbs = "Must be a number greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const product: FoodProduct = {
      name: foodName.trim(),
      nutrition: {
        totalCarbs: parseFloat(totalCarbs),
        fiber: fiber ? parseFloat(fiber) : 0,
        fat: fat ? parseFloat(fat) : 0,
        protein: protein ? parseFloat(protein) : 0,
        sugar: sugar ? parseFloat(sugar) : undefined,
      },
      ingredients: ingredients.trim() || undefined,
      source: "manual",
    };

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
          <h1 className="text-h2 text-text-primary font-bold">Manual Entry</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <div className="space-y-4">
              <Input
                label="Food Name"
                placeholder="e.g. Chocolate Chip Cookie"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                error={errors.foodName}
                required
              />

              <Input
                label="Total Carbohydrates per 100g"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="e.g. 45.0"
                value={totalCarbs}
                onChange={(e) => setTotalCarbs(e.target.value)}
                error={errors.totalCarbs}
                helperText="Required - grams of carbs per 100g"
                required
              />

              <Input
                label="Sugar per 100g"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="0"
                value={sugar}
                onChange={(e) => setSugar(e.target.value)}
                helperText="Grams of sugar per 100g (included in total carbs)"
              />

              <Input
                label="Dietary Fiber per 100g"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="0"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                helperText="Leave as 0 if not listed on the label"
              />

              <Input
                label="Total Fat per 100g"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                helperText="Grams of fat per 100g"
              />

              <Input
                label="Protein per 100g"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                helperText="Grams of protein per 100g"
              />

              {/* Ingredients Textarea */}
              <div className="w-full">
                <label
                  htmlFor="ingredients"
                  className="block text-label uppercase text-text-secondary mb-1.5"
                >
                  Ingredients (optional)
                </label>
                <textarea
                  id="ingredients"
                  rows={3}
                  placeholder="e.g. wheat flour, sugar, butter, eggs, chocolate chips"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="w-full px-4 py-3 rounded-button border border-border bg-surface text-text-primary text-body-lg placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
                <p className="mt-1 text-caption text-text-muted">
                  Comma-separated list helps improve glycemic index estimation
                </p>
              </div>
            </div>
          </Card>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            <Calculator size={20} className="mr-2" />
            Calculate Impact
          </Button>
        </form>
      </div>
    </div>
  );
}
