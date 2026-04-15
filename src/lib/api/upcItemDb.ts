import axios from "axios";
import type { FoodProduct, NutritionData } from "@/types";

const TRIAL_URL = "https://api.upcitemdb.com/prod/trial/lookup";

interface UPCItem {
  ean?: string;
  title?: string;
  brand?: string;
  description?: string;
  category?: string;
  images?: string[];
  weight?: string;
}

interface UPCResponse {
  code: string;
  total: number;
  items: UPCItem[];
}

export async function fetchProductFromUPCItemDb(
  barcode: string
): Promise<FoodProduct | null> {
  try {
    const response = await axios.post<UPCResponse>(
      TRIAL_URL,
      { upc: barcode },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000,
      }
    );

    if (
      response.data.code !== "OK" ||
      !response.data.items ||
      response.data.items.length === 0
    ) {
      return null;
    }

    const item = response.data.items[0];

    // UPCitemdb doesn't provide nutrition data — return product info
    // Nutrition will be estimated by AI vision or manual entry
    const nutrition: NutritionData = {
      totalCarbs: 0,
      fiber: 0,
      fat: 0,
      protein: 0,
    };

    return {
      barcode,
      name: item.title || "Unknown Product",
      brand: item.brand || undefined,
      imageUrl: item.images && item.images.length > 0 ? item.images[0] : undefined,
      nutrition,
      source: "openfoodfacts", // treat as external source
    };
  } catch {
    return null;
  }
}
