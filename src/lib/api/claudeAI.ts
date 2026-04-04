import axios from "axios";
import type { FoodProduct, GlycemicResult, AIInsight } from "@/types";

export async function getAIInsight(
  product: FoodProduct,
  result: GlycemicResult
): Promise<AIInsight> {
  try {
    const response = await axios.post("/api/claude", {
      productName: product.name,
      nutrition: product.nutrition,
      impactScore: result.impactScore,
      impactLevel: result.impactLevel,
      ingredients: product.ingredients
        ? product.ingredients.slice(0, 300)
        : undefined,
    });

    const text = response.data.response;
    const parts = text.split(/\.\s+/);
    const summary = parts.slice(0, 2).join(". ") + ".";
    const recommendation = parts.slice(2).join(". ") || "";

    return {
      summary,
      recommendation,
      loading: false,
    };
  } catch {
    return {
      summary:
        "Based on the nutritional profile, this food's estimated glycemic impact has been calculated using available data.",
      recommendation: "For personalized dietary guidance, please consult your healthcare provider.",
      loading: false,
      error: "Could not load AI insight",
    };
  }
}
