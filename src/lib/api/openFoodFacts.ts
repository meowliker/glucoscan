import axios from "axios";
import type { FoodProduct, NutritionData } from "@/types";

const BASE_URL = "https://world.openfoodfacts.org/api/v2";

interface OFFNutriments {
  carbohydrates_100g?: number;
  "carbohydrates_serving"?: number;
  fiber_100g?: number;
  fat_100g?: number;
  proteins_100g?: number;
  sugars_100g?: number;
  "energy-kcal_100g"?: number;
}

interface OFFProduct {
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  nutriments?: OFFNutriments;
  serving_size?: string;
  code?: string;
}

interface OFFResponse {
  status: number;
  product?: OFFProduct;
}

interface OFFSearchResponse {
  count: number;
  products: OFFProduct[];
}

function parseNutrition(nutriments?: OFFNutriments): NutritionData {
  return {
    totalCarbs: nutriments?.carbohydrates_100g ?? 0,
    fiber: nutriments?.fiber_100g ?? 0,
    fat: nutriments?.fat_100g ?? 0,
    protein: nutriments?.proteins_100g ?? 0,
    sugar: nutriments?.sugars_100g ?? 0,
    calories: nutriments?.["energy-kcal_100g"] ?? 0,
  };
}

function parseProduct(product: OFFProduct, barcode?: string): FoodProduct {
  return {
    barcode: barcode || product.code,
    name: product.product_name || "Unknown Product",
    brand: product.brands || undefined,
    imageUrl: product.image_front_url || product.image_url || undefined,
    ingredients:
      product.ingredients_text_en || product.ingredients_text || undefined,
    nutrition: parseNutrition(product.nutriments),
    source: "openfoodfacts",
    ...(product.serving_size && {
      nutrition: {
        ...parseNutrition(product.nutriments),
        servingSize: product.serving_size,
      },
    }),
  };
}

export async function fetchProductByBarcode(
  barcode: string
): Promise<FoodProduct | null> {
  try {
    const response = await axios.get<OFFResponse>(
      `${BASE_URL}/product/${barcode}.json`,
      { timeout: 10000 }
    );

    if (response.data.status === 1 && response.data.product) {
      return parseProduct(response.data.product, barcode);
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchProducts(
  query: string,
  page: number = 1
): Promise<FoodProduct[]> {
  try {
    const response = await axios.get<OFFSearchResponse>(
      `${BASE_URL}/search`,
      {
        params: {
          search_terms: query,
          page,
          page_size: 20,
          fields:
            "product_name,brands,image_front_url,ingredients_text,ingredients_text_en,nutriments,serving_size,code",
          sort_by: "unique_scans_n",
        },
        timeout: 10000,
      }
    );

    return response.data.products
      .filter((p) => p.product_name && p.nutriments)
      .map((p) => parseProduct(p));
  } catch {
    return [];
  }
}
