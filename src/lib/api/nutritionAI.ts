import axios from "axios";
import type { FoodProduct } from "@/types";
import { saveProductToDb } from "@/lib/db/products";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AIResponse {
  success?: boolean;
  error?: string;
  productName?: string;
  brand?: string;
  category?: string;
  nutrition?: {
    calories: number;
    totalCarbs: number;
    sugar: number;
    fiber: number;
    fat: number;
    protein: number;
    sodium: number;
  };
  ingredients?: string;
  confidence?: string;
  correctedFromQuery?: boolean;
  note?: string;
}

export async function lookupNutritionByName(
  productName: string,
  brand?: string
): Promise<FoodProduct | null> {
  try {
    const response = await axios.post<AIResponse>("/api/nutrition", {
      productName,
      brand,
    });

    const data = response.data;
    if (!data.success || !data.nutrition) {
      return null;
    }

    const product: FoodProduct = {
      name: data.productName || productName,
      brand: data.brand || brand || undefined,
      nutrition: {
        totalCarbs: data.nutrition.totalCarbs,
        fiber: data.nutrition.fiber,
        fat: data.nutrition.fat,
        protein: data.nutrition.protein,
        sugar: data.nutrition.sugar,
        calories: data.nutrition.calories,
      },
      ingredients: data.ingredients || undefined,
      source: "search",
    };

    // Save to shared products DB (only high/medium confidence) — fire and forget
    if (data.confidence !== "low") {
      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            saveProductToDb(authData.user.id, product).catch(() => {});
          }
        }
      } catch {
        // ignore save errors
      }
    }

    return product;
  } catch {
    return null;
  }
}
